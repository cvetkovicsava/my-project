import { NextRequest, NextResponse } from "next/server";
import { runSeoAudit } from "@/lib/audit/seo";
import { runGeoAudit } from "@/lib/audit/geo";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, brand, repoName, githubId } = body;

    if (!url) {
      return NextResponse.json(
        { error: "URL sajta je obavezan" },
        { status: 400 }
      );
    }

    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
    const brandName = brand || repoName || new URL(normalizedUrl).hostname;

    console.log(`Pokrećem audit za: ${normalizedUrl}`);

    // Pokrenemo SEO i GEO audit paralelno
    const [seoResult, geoResult] = await Promise.allSettled([
      runSeoAudit(normalizedUrl),
      runGeoAudit(brandName, normalizedUrl),
    ]);

    const seo = seoResult.status === "fulfilled"
      ? seoResult.value
      : { score: 0, url: normalizedUrl, issues: [{ type: "error", severity: "critical", message: "SEO audit nije uspio", recommendation: "Provjeri da li je sajt dostupan i pokušaj ponovo" }], meta: {} };

    const geo = geoResult.status === "fulfilled"
      ? geoResult.value
      : { score: 0, totalModels: 4, mentionedIn: 0, results: [], recommendations: ["Provjeri AI API ključeve"] };

    // Snimi rezultate u bazu (opcionalno — ne blokira ako baza nije gotova)
    try {
      const { db } = await import("@/db");
      const { users, audits, auditResults } = await import("@/db/schema");
      const { eq } = await import("drizzle-orm");

      let userId: string | null = null;

      if (githubId) {
        const userRows = await db.select().from(users).where(eq(users.githubId, String(githubId))).limit(1);
        if (userRows.length > 0) userId = userRows[0].id;
      }

      if (userId) {
        // Kreiraj audit record
        const [auditRow] = await db.insert(audits).values({
          userId,
          type: "seo_geo",
          status: "completed",
          completedAt: new Date(),
        }).returning();

        // Snimi rezultate
        await db.insert(auditResults).values({
          auditId: auditRow.id,
          seoScore: (seo as any).score,
          geoScore: (geo as any).score,
          issues: (seo as any).issues,
          rawData: { seo, geo, url: normalizedUrl, brand: brandName },
        });

        console.log(`Audit snimljen u bazu: ${auditRow.id}`);
      }
    } catch (dbErr) {
      console.warn("Nije moguće snimiti audit u bazu (da li si pokrenuo drizzle-kit push?):", dbErr);
    }

    return NextResponse.json({
      success: true,
      seo,
      geo,
      auditedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("Audit greška:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
