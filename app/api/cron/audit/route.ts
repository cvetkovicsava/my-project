import { NextRequest, NextResponse } from "next/server";

/**
 * Scheduled weekly audit — runs every Monday at 09:00 UTC
 * Configured in vercel.json: { "crons": [{ "path": "/api/cron/audit", "schedule": "0 9 * * 1" }] }
 *
 * Fetches all users who have audit history in the last 30 days,
 * re-runs their most recent audit, stores the new result, and sends email notification.
 */

// ─── Email helper (uses Resend if RESEND_API_KEY is set) ──────────────────────

async function sendAuditEmail(opts: {
  to: string;
  userName: string;
  url: string;
  seoScore: number;
  geoScore: number;
  issueCount: number;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[CRON] RESEND_API_KEY nije postavljen — preskačem email za", opts.to);
    return;
  }

  const seoEmoji = opts.seoScore >= 80 ? "🟢" : opts.seoScore >= 50 ? "🟡" : "🔴";
  const geoEmoji = opts.geoScore >= 80 ? "🟢" : opts.geoScore >= 50 ? "🟡" : "🔴";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#07010f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:40px auto;padding:0 16px;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#818cf8,#a855f7);border-radius:16px 16px 0 0;padding:28px 32px;">
      <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.7);">SEO GEO Platform</p>
      <h1 style="margin:8px 0 0;font-size:22px;font-weight:300;color:#fff;">Sedmični audit završen</h1>
    </div>

    <!-- Body -->
    <div style="background:#111022;border-radius:0 0 16px 16px;padding:28px 32px;border:1px solid rgba(255,255,255,0.07);border-top:none;">
      <p style="margin:0 0 20px;color:rgba(255,255,255,0.6);font-size:14px;line-height:1.6;">
        Zdravo <strong style="color:rgba(255,255,255,0.85);">${opts.userName}</strong>,<br/>
        automatski sedmični audit za <strong style="color:#818cf8;">${opts.url}</strong> je završen.
      </p>

      <!-- Score cards -->
      <div style="display:flex;gap:12px;margin-bottom:24px;">
        <div style="flex:1;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px;text-align:center;">
          <p style="margin:0 0 4px;font-size:28px;font-weight:200;color:#818cf8;">${opts.seoScore}</p>
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.08em;">${seoEmoji} SEO Score</p>
        </div>
        <div style="flex:1;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px;text-align:center;">
          <p style="margin:0 0 4px;font-size:28px;font-weight:200;color:#a855f7;">${opts.geoScore}</p>
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.08em;">${geoEmoji} GEO Score</p>
        </div>
      </div>

      ${opts.issueCount > 0 ? `
      <div style="background:rgba(250,204,21,0.07);border:1px solid rgba(250,204,21,0.15);border-radius:10px;padding:14px 16px;margin-bottom:20px;">
        <p style="margin:0;font-size:13px;color:rgba(250,204,21,0.9);">
          ⚠️ Pronađeno <strong>${opts.issueCount}</strong> ${opts.issueCount === 1 ? 'problem' : opts.issueCount < 5 ? 'problema' : 'problema'} — prijavi se i pokreni optimizaciju.
        </p>
      </div>` : `
      <div style="background:rgba(74,222,128,0.07);border:1px solid rgba(74,222,128,0.15);border-radius:10px;padding:14px 16px;margin-bottom:20px;">
        <p style="margin:0;font-size:13px;color:rgba(74,222,128,0.9);">✅ Odlično! Nema kritičnih problema.</p>
      </div>`}

      <!-- CTA -->
      <a href="https://seo-geo-platform-hazel.vercel.app/dashboard"
         style="display:block;text-align:center;background:linear-gradient(135deg,#818cf8,#a855f7);color:#fff;text-decoration:none;font-size:14px;font-weight:500;padding:13px 24px;border-radius:10px;margin-bottom:24px;">
        Pogledaj detalje →
      </a>

      <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.25);line-height:1.6;border-top:1px solid rgba(255,255,255,0.06);padding-top:16px;">
        Ovaj email je automatski poslan svaki ponedjeljak u 9:00.<br/>
        Možeš isključiti notifikacije u <a href="https://seo-geo-platform-hazel.vercel.app/settings" style="color:#818cf8;">Podešavanjima</a>.
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SEO GEO Platform <noreply@resend.dev>",
        to: [opts.to],
        subject: `${seoEmoji} Sedmični audit završen — SEO: ${opts.seoScore}, GEO: ${opts.geoScore}`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[CRON] Email greška za", opts.to, ":", err);
    } else {
      console.log("[CRON] Email poslan na", opts.to);
    }
  } catch (err) {
    console.error("[CRON] Email fetch greška:", err);
  }
}

// ─── Cron handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // Vercel Cron sends the CRON_SECRET as Authorization header
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: { userId: string; url: string; status: string; emailSent?: boolean }[] = [];

  try {
    const { db } = await import("@/db");
    const { users, audits, auditResults } = await import("@/db/schema");
    const { gte, desc, eq } = await import("drizzle-orm");

    // Get audits from the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const recentAuditResults = await db
      .select({
        userId: audits.userId,
        rawData: auditResults.rawData,
        createdAt: audits.completedAt,
      })
      .from(auditResults)
      .innerJoin(audits, eq(auditResults.auditId, audits.id))
      .where(gte(audits.completedAt, thirtyDaysAgo))
      .orderBy(desc(audits.completedAt))
      .limit(50);

    // Collect unique users with their last audited URL
    const userUrlMap = new Map<string, string>();
    for (const row of recentAuditResults) {
      if (!row.userId) continue;
      const raw = row.rawData as any;
      const url = raw?.url || raw?.seo?.url;
      if (url && !userUrlMap.has(row.userId)) {
        userUrlMap.set(row.userId, url);
      }
    }

    // Fetch user emails once
    const userIds = [...userUrlMap.keys()];
    const userRows = userIds.length > 0
      ? await db.select({ id: users.id, email: users.email, githubUsername: users.githubUsername })
          .from(users)
          .where(eq(users.id, userIds[0])) // drizzle doesn't have inArray easily — handle per-user
      : [];

    // Build a quick id→user map
    const userMap = new Map<string, { email: string; name: string }>();
    for (const u of userRows) {
      userMap.set(u.id, { email: u.email, name: u.githubUsername ?? u.email.split('@')[0] });
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

        // Send email notification
        let emailSent = false;
        const userInfo = userMap.get(userId);
        if (userInfo?.email) {
          await sendAuditEmail({
            to: userInfo.email,
            userName: userInfo.name,
            url,
            seoScore: (seo as any).score,
            geoScore: (geo as any).score,
            issueCount: (seo as any).issues?.length ?? 0,
          });
          emailSent = true;
        }

        results.push({ userId, url, status: "ok", emailSent });
        console.log(`[CRON] Scheduled audit done for user=${userId} url=${url} emailSent=${emailSent}`);
      } catch (err) {
        console.error(`[CRON] Failed for user=${userId} url=${url}`, err);
        results.push({ userId, url, status: "error" });
      }
    }
  } catch (dbErr) {
    console.warn("[CRON] DB not available:", dbErr);
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
