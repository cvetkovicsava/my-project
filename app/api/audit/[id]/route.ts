import { NextRequest, NextResponse } from "next/server";

// GET /api/audit/[id] — fetch full audit detail by audit ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) return NextResponse.json({ error: "ID obavezan" }, { status: 400 });

    const { db } = await import("@/db");
    const { audits, auditResults, optimizations } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    // Fetch audit row
    const auditRows = await db.select().from(audits).where(eq(audits.id, id)).limit(1);
    if (auditRows.length === 0) {
      return NextResponse.json({ error: "Audit nije pronađen" }, { status: 404 });
    }

    // Fetch result
    const resultRows = await db.select().from(auditResults)
      .where(eq(auditResults.auditId, id))
      .limit(1);

    // Fetch PR (if any)
    const prRows = await db.select({
      prUrl: optimizations.prUrl,
      filePath: optimizations.filePath,
      createdAt: optimizations.createdAt,
    }).from(optimizations)
      .where(eq(optimizations.auditId, id))
      .limit(10);

    const audit = auditRows[0];
    const result = resultRows[0] ?? null;

    return NextResponse.json({
      id: audit.id,
      type: audit.type,
      status: audit.status,
      createdAt: audit.createdAt,
      completedAt: audit.completedAt,
      seoScore: result?.seoScore ?? null,
      geoScore: result?.geoScore ?? null,
      issues: result?.issues ?? [],
      rawData: result?.rawData ?? null,
      prUrl: prRows[0]?.prUrl ?? null,
      prFiles: prRows.map(r => r.filePath).filter(Boolean),
    });
  } catch (err: any) {
    console.error("Audit detail greška:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
