export interface FileChange {
  path: string;
  content: string;
  message: string;
}

export interface PrResult {
  prUrl: string;
  branchName: string;
  filesChanged: number;
}

export async function createOptimizationPR(
  accessToken: string,
  repoFullName: string,
  changes: FileChange[],
  auditSummary: string
): Promise<PrResult> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
  };

  const baseUrl = "https://api.github.com";
  const branchName = `seo-geo-optimization-${Date.now()}`;

  // 1. Dohvati default branch i SHA
  const repoRes = await fetch(`${baseUrl}/repos/${repoFullName}`, { headers });
  const repoData = await repoRes.json();
  const defaultBranch = repoData.default_branch || "main";

  const branchRes = await fetch(`${baseUrl}/repos/${repoFullName}/git/refs/heads/${defaultBranch}`, { headers });
  const branchData = await branchRes.json();
  const baseSha = branchData.object.sha;

  // 2. Napravi novi branch
  await fetch(`${baseUrl}/repos/${repoFullName}/git/refs`, {
    method: "POST",
    headers,
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: baseSha }),
  });

  // 3. Commit svaki fajl
  for (const change of changes) {
    // Provjeri postoji li fajl
    let fileSha: string | undefined;
    try {
      const existingRes = await fetch(`${baseUrl}/repos/${repoFullName}/contents/${change.path}?ref=${branchName}`, { headers });
      if (existingRes.ok) {
        const existing = await existingRes.json();
        fileSha = existing.sha;
      }
    } catch {}

    const contentBase64 = Buffer.from(change.content).toString("base64");

    await fetch(`${baseUrl}/repos/${repoFullName}/contents/${change.path}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: change.message,
        content: contentBase64,
        branch: branchName,
        ...(fileSha ? { sha: fileSha } : {}),
      }),
    });
  }

  // 4. Otvori Pull Request
  const prRes = await fetch(`${baseUrl}/repos/${repoFullName}/pulls`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      title: "🚀 SEO & GEO Optimizacija",
      body: `## Automatska SEO & GEO Optimizacija\n\n${auditSummary}\n\n### Izmijenjeni fajlovi:\n${changes.map((c) => `- \`${c.path}\``).join("\n")}\n\n*Generisano od strane SEO/GEO platforme*`,
      head: branchName,
      base: defaultBranch,
    }),
  });

  const prData = await prRes.json();

  if (!prData.html_url) {
    throw new Error("Nije moguće kreirati Pull Request: " + JSON.stringify(prData));
  }

  return {
    prUrl: prData.html_url,
    branchName,
    filesChanged: changes.length,
  };
}
