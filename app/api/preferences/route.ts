import { NextRequest, NextResponse } from "next/server";

// GET /api/preferences?githubId=xxx  — fetch current preferences
// POST /api/preferences               — { githubId, emailNotifications, weeklyReport }

export async function GET(request: NextRequest) {
  try {
    const githubId = request.nextUrl.searchParams.get("githubId");
    if (!githubId) return NextResponse.json({ error: "githubId required" }, { status: 400 });

    const { db } = await import("@/db");
    const { users } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const rows = await db.select({
      emailNotifications: users.emailNotifications,
      weeklyReport: users.weeklyReport,
    }).from(users).where(eq(users.githubId, githubId)).limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ emailNotifications: true, weeklyReport: true });
    }

    return NextResponse.json(rows[0]);
  } catch (err: any) {
    console.error("Preferences GET greška:", err);
    return NextResponse.json({ emailNotifications: true, weeklyReport: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { githubId, emailNotifications, weeklyReport } = body;

    if (!githubId) return NextResponse.json({ error: "githubId required" }, { status: 400 });

    const { db } = await import("@/db");
    const { users } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    await db.update(users)
      .set({
        emailNotifications: Boolean(emailNotifications),
        weeklyReport: Boolean(weeklyReport),
      })
      .where(eq(users.githubId, String(githubId)));

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Preferences POST greška:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
