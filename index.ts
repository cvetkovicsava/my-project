import Anthropic from "@anthropic-ai/sdk";
import { SeoResult } from "@/lib/audit/seo";
import { GeoResult } from "@/lib/audit/geo";
import { FileChange } from "@/lib/github/pr";

export async function generateOptimizations(
  seoResult: SeoResult,
  geoResult: GeoResult,
  repoName: string,
  websiteUrl: string
): Promise<FileChange[]> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const seoIssuesList = seoResult.issues
    .map((i) => `- [${i.severity}] ${i.message}: ${i.recommendation}`)
    .join("\n");

  const geoRecommendationsList = geoResult.recommendations.join("\n- ");

  const prompt = `
Ti si SEO i GEO ekspert. Analizirao si sajt "${websiteUrl}" (GitHub repo: "${repoName}") i pronašao sljedeće probleme:

## SEO Problemi (score: ${seoResult.score}/100):
${seoIssuesList}

## GEO Status (${geoResult.mentionedIn}/${geoResult.totalModels} AI modela te pominje):
- ${geoRecommendationsList}

## Meta podaci koje si pronašao:
- Title: ${seoResult.meta.title || "NEDOSTAJE"}
- Description: ${seoResult.meta.description || "NEDOSTAJE"}
- H1: ${seoResult.meta.hasH1 ? "postoji" : "NEDOSTAJE"}
- OG tagovi: ${seoResult.meta.hasOgTags ? "postoje" : "NEDOSTAJU"}

Kreiraj konkretne fajlove koje treba dodati/izmijeniti u repozitorijumu da bi se popravili ovi problemi.

Vrati JSON u ovom formatu (bez markdown, samo JSON):
{
  "files": [
    {
      "path": "putanja/do/fajla.html",
      "content": "cijeli sadržaj fajla",
      "message": "opis commit-a"
    }
  ]
}

Kreiraj ove fajlove:
1. llms.txt - opis brenda/sajta za AI modele
2. README.md - poboljšan opis projekta sa SEO ključnim riječima
3. public/seo-meta.json - schema.org strukturirani podaci

Budi konkretan i napiši pravi sadržaj, ne placeholderove.
`;

  const response = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";

  try {
    // Izvuci JSON iz odgovora
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Nema JSON-a u odgovoru");

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.files as FileChange[];
  } catch (err) {
    console.error("Greška pri parsiranju AI odgovora:", err);
    // Fallback — vrati osnovne fajlove
    return [
      {
        path: "llms.txt",
        content: `# ${repoName}\n\nOvaj sajt je dostupan na: ${websiteUrl}\n\n## O projektu\n${repoName} je web projekat koji pruža usluge korisnicima.\n\n## Kontakt\nVišemore informacija na: ${websiteUrl}`,
        message: "feat: dodaj llms.txt za GEO optimizaciju",
      },
    ];
  }
}
