import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const githubId = searchParams.get("githubId");

    if (!githubId) {
      return NextResponse.json({ history: [] });
    }

    const { db } = await import("@/db");
    const { users, audits, auditResults } = await import("@/db/schema");
    const { eq, desc } = await import("drizzle-orm");

    // Nađi korisnika
    const userRows = await db.select().from(users).where(eq(users.githubId, githubId)).limit(1);
    if (userRows.length === 0) {
      return NextResponse.json({ history: [] });
    }

    const userId = userRows[0].id;

    // Dohvati audit historiju s rezultatima
    const auditRows = await db.select().from(audits)
      .where(eq(audits.userId, userId))
      .orderBy(desc(audits.createdAt))
      .limit(10);

    const history = await Promise.all(
      auditRows.map(async (audit) => {
        const results = await db.select().from(auditResults)
          .where(eq(auditResults.auditId, audit.id))
          .limit(1);

        const result = results[0];
        return {
          id: audit.id,
          createdAt: audit.createdAt,
          status: audit.status,
          seoScore: result?.seoScore ?? null,
          geoScore: result?.geoScore ?? null,
          url: (result?.rawData as any)?.url ?? null,
        };
      })
    );

    return NextResponse.json({ history });
  } catch (err: any) {
    console.warn("History API greška (da li si pokrenuo drizzle-kit push?):", err);
    return NextResponse.json({ history: [] });
  }
}
