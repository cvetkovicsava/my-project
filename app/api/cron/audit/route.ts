import { NextRequest, NextResponse } from "next/server";

/**
 * Scheduled weekly audit — runs every Monday at 09:00 UTC
 * Configured in vercel.json: { "crons": [{ "path": "/api/cron/audit", "schedule": "0 9 * * 1" }] }
 *
 * Fetches all users who have audit history in the last 30 days,
 * re-runs their most recent audit, and stores the new result.
 */
export async function GET(request: NextRequest) {
  // Vercel Cron sends the CRON_SECRET as Authorization header
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: { userId: string; url: string; status: string }[] = [];

  try {
    const { db } = await import("@/db");
    const { users, audits, auditResults } = await import("@/db/schema");
    const { gte, desc } = await import("drizzle-orm");

    // Get audits from the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const recentAuditResults = await db
      .select({
        userId: audits.userId,
        rawData: auditResults.rawData,
        createdAt: audits.completedAt,
      })
      .from(auditResults)
      .innerJoin(audits, (t) => `${t}.audit_id = ${audits.id}`)
      .where(gte(audits.completedAt, thirtyDaysAgo))
      .orderBy(desc(audits.completedAt))
      .limit(50);

    // Collect unique users with their last audited URL
    const userUrlMap = new Map<string, string>();
    for (const row of recentAuditResults) {
      if (!row.userId) continue;
      const raw = row.rawData as any;
      const url = raw?.url;
      if (url && !userUrlMap.has(row.userId)) {
        userUrlMap.set(row.userId, url);
      }
    }

    // Run audit for each user
    for (const [userId, url] of userUrlMap.entries()) {
      try {
        const { runSeoAudit } = await import("@/lib/audit/seo");
        const { runGeoAudit } = await import("@/lib/audit/geo");

        const [seoResult, geoResult] = await Promise.allSettled([
          runSeoAudit(url),
          runGeoAudit(new URL(url).hostname, url),
        ]);

        const seo =
          seoResult.status === "fulfilled"
            ? seoResult.value
            : { score: 0, url, issues: [], meta: {} };

        const geo =
          geoResult.status === "fulfilled"
            ? geoResult.value
            : { score: 0, totalModels: 4, mentionedIn: 0, results: [], recommendations: [] };

        // Save to DB
        const [auditRow] = await db
          .insert(audits)
          .values({
            userId,
            type: "seo_geo_scheduled",
            status: "completed",
            completedAt: new Date(),
          })
          .returning();

        await db.insert(auditResults).values({
          auditId: auditRow.id,
          seoScore: (seo as any).score,
          geoScore: (geo as any).score,
          issues: (seo as any).issues,
          rawData: { seo, geo, url, scheduledRun: true },
        });

        results.push({ userId, url, status: "ok" });
        console.log(`[CRON] Scheduled audit done for user=${userId} url=${url}`);
      } catch (err) {
        console.error(`[CRON] Failed for user=${userId} url=${url}`, err);
        results.push({ userId, url, status: "error" });
      }
    }
  } catch (dbErr) {
    console.warn("[CRON] DB not available:", dbErr);
    // No users to re-audit — this is fine during development
    return NextResponse.json({
      ok: true,
      ran: 0,
      message: "No DB / no users to re-audit",
    });
  }

  return NextResponse.json({
    ok: true,
    ran: results.length,
    results,
    timestamp: new Date().toISOString(),
  });
}
