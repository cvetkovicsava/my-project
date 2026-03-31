import { NextRequest, NextResponse } from "next/server";
import { generateOptimizations } from "@/lib/optimizer";
import { createOptimizationPR } from "@/lib/github/pr";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { seoResult, geoResult, repoFullName, websiteUrl, repoName, accessToken, githubId } = body;

    if (!seoResult || !geoResult || !repoFullName || !accessToken) {
      return NextResponse.json({ error: "Nedostaju obavezni parametri" }, { status: 400 });
    }

    console.log("Generišem optimizacije sa Claude AI...");

    // 1. Claude generiše fajlove
    const changes = await generateOptimizations(seoResult, geoResult, repoName, websiteUrl);

    console.log(`Claude predlaže ${changes.length} izmjena`);

    // 2. Kreiramo PR na GitHubu
    const auditSummary = `
### SEO Score: ${seoResult.score}/100
- Pronađeno ${seoResult.issues.length} problema

### GEO Score: ${geoResult.score}/100
- ${geoResult.mentionedIn}/${geoResult.totalModels} AI modela te pominje
`;

    const prResult = await createOptimizationPR(
      accessToken,
      repoFullName,
      changes,
      auditSummary
    );

    // 3. Snimi PR URL u bazu (opcionalno)
    try {
      const { db } = await import("@/db");
      const { users, audits, optimizations } = await import("@/db/schema");
      const { eq, desc } = await import("drizzle-orm");

      let userId: string | null = null;
      if (githubId) {
        const userRows = await db.select().from(users).where(eq(users.githubId, String(githubId))).limit(1);
        if (userRows.length > 0) userId = userRows[0].id;
      }

      if (userId) {
        // Nađi posljednji audit za ovog korisnika
        const lastAudit = await db.select().from(audits)
          .where(eq(audits.userId, userId))
          .orderBy(desc(audits.createdAt))
          .limit(1);

        if (lastAudit.length > 0) {
          // Snimi optimizacije
          for (const change of changes) {
            await db.insert(optimizations).values({
              auditId: lastAudit[0].id,
              filePath: change.path,
              newContent: change.content,
              status: "completed",
              prUrl: prResult.prUrl,
            });
          }
          console.log(`PR URL snimljen u bazu: ${prResult.prUrl}`);
        }
      }
    } catch (dbErr) {
      console.warn("Nije moguće snimiti PR u bazu:", dbErr);
    }

    return NextResponse.json({
      success: true,
      prUrl: prResult.prUrl,
      branchName: prResult.branchName,
      filesChanged: prResult.filesChanged,
      changes: changes.map((c) => ({ path: c.path, message: c.message })),
    });
  } catch (error: any) {
    console.error("Optimize greška:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
