import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Nema tokena" }, { status: 401 });
  }

  const accessToken = authHeader.replace("Bearer ", "");

  try {
    const response = await fetch(
      "https://api.github.com/user/repos?sort=updated&per_page=50&visibility=all&affiliation=owner,collaborator,organization_member",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API greška: ${response.status}`);
    }

    const repos = await response.json();

    const simplifiedRepos = repos.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      homepage: repo.homepage,
      stars: repo.stargazers_count,
      language: repo.language,
      updatedAt: repo.updated_at,
      isPrivate: repo.private,
    }));

    return NextResponse.json({ repos: simplifiedRepos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
