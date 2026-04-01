/**
 * SEO Audit — bez eksternih API-ja
 * Direktno fetchuje HTML stranicu i parsira ga regex-om.
 */

export interface SeoIssue {
  type: string;
  severity: "critical" | "warning" | "info";
  message: string;
  recommendation: string;
}

export interface SeoResult {
  score: number;
  url: string;
  issues: SeoIssue[];
  meta: {
    title: string | null;
    description: string | null;
    hasH1: boolean;
    h1Count: number;
    hasCanonical: boolean;
    hasRobots: boolean;
    hasSitemap: boolean;
    hasSchemaMarkup: boolean;
    hasOgTags: boolean;
  };
}

// ─── HTML helpers ─────────────────────────────────────────────────

function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m ? m[1].trim() || null : null;
}

function extractMetaDescription(html: string): string | null {
  const m =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i) ||
    html.match(/<meta[^>]+content=["']([^"']*)[^>]+name=["']description["']/i);
  return m ? m[1].trim() || null : null;
}

function countH1(html: string): number {
  return (html.match(/<h1[\s>]/gi) || []).length;
}

function detectOgTags(html: string): boolean {
  return /<meta[^>]+property=["']og:/i.test(html);
}

function detectCanonical(html: string): boolean {
  return /<link[^>]+rel=["']canonical["']/i.test(html);
}

function detectSchemaMarkup(html: string): boolean {
  return (
    /<script[^>]+type=["']application\/ld\+json["']/i.test(html) ||
    /itemtype=["']https?:\/\/schema\.org/i.test(html)
  );
}

// ─── Main audit function ───────────────────────────────────────────

export async function runSeoAudit(url: string): Promise<SeoResult> {
  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
  const origin = (() => { try { return new URL(normalizedUrl).origin; } catch { return normalizedUrl; } })();

  let html = "";
  let fetchOk = false;

  try {
    const res = await fetch(normalizedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SEOBot/1.0; +https://seo-geo.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    });
    if (res.ok) {
      html = await res.text();
      fetchOk = true;
    }
  } catch {
    // nastavimo sa praznim HTML-om
  }

  if (!fetchOk) {
    return {
      score: 30,
      url: normalizedUrl,
      issues: [
        {
          type: "fetch_error",
          severity: "critical",
          message: "Sajt nije dostupan ili je zaštićen od crawlera",
          recommendation: "Provjeri da li je sajt online i da li dozvoljava HTTP crawlere",
        },
      ],
      meta: {
        title: null, description: null, hasH1: false, h1Count: 0,
        hasCanonical: false, hasRobots: false, hasSitemap: false,
        hasSchemaMarkup: false, hasOgTags: false,
      },
    };
  }

  // ── Parse meta ──
  const title       = extractTitle(html);
  const description = extractMetaDescription(html);
  const h1Count     = countH1(html);
  const ogTags      = detectOgTags(html);
  const canonical   = detectCanonical(html);
  const schema      = detectSchemaMarkup(html);

  // ── Check robots.txt & sitemap ──
  let hasRobots  = false;
  let hasSitemap = false;
  try {
    const [robotsRes, sitemapRes] = await Promise.allSettled([
      fetch(`${origin}/robots.txt`,  { signal: AbortSignal.timeout(5000) }),
      fetch(`${origin}/sitemap.xml`, { signal: AbortSignal.timeout(5000) }),
    ]);
    hasRobots  = robotsRes.status  === "fulfilled" && robotsRes.value.ok;
    hasSitemap = sitemapRes.status === "fulfilled" && sitemapRes.value.ok;
  } catch { /* ignore */ }

  // ── Build score & issues ──
  const issues: SeoIssue[] = [];
  let score = 100;

  if (!title) {
    issues.push({ type: "missing_title", severity: "critical",
      message: "Stranica nema <title> tag",
      recommendation: "Dodaj title tag sa ključnim riječima (50–60 znakova)" });
    score -= 20;
  } else if (title.length < 30) {
    issues.push({ type: "short_title", severity: "warning",
      message: `Title je previše kratak (${title.length} znakova)`,
      recommendation: "Proširi title na 50–60 znakova" });
    score -= 8;
  } else if (title.length > 65) {
    issues.push({ type: "long_title", severity: "warning",
      message: `Title je previše dugačak (${title.length} znakova)`,
      recommendation: "Skrati title na maksimalno 60 znakova" });
    score -= 5;
  }

  if (!description) {
    issues.push({ type: "missing_description", severity: "critical",
      message: "Nema meta description taga",
      recommendation: "Dodaj meta description (150–160 znakova)" });
    score -= 15;
  } else if (description.length < 80) {
    issues.push({ type: "short_description", severity: "warning",
      message: `Meta description je kratak (${description.length} znakova)`,
      recommendation: "Proširi meta description na 150–160 znakova" });
    score -= 8;
  }

  if (h1Count === 0) {
    issues.push({ type: "missing_h1", severity: "critical",
      message: "Stranica nema H1 naslov",
      recommendation: "Dodaj jedan H1 tag sa glavnom temom stranice" });
    score -= 15;
  } else if (h1Count > 1) {
    issues.push({ type: "multiple_h1", severity: "warning",
      message: `Stranica ima ${h1Count} H1 naslova — treba biti samo jedan`,
      recommendation: "Ostavi samo jedan H1, ostale pretvori u H2 ili H3" });
    score -= 5;
  }

  if (!ogTags) {
    issues.push({ type: "missing_og_tags", severity: "warning",
      message: "Nema Open Graph tagova za dijeljenje na društvenim mrežama",
      recommendation: "Dodaj og:title, og:description i og:image u <head>" });
    score -= 10;
  }

  if (!canonical) {
    issues.push({ type: "missing_canonical", severity: "info",
      message: "Nema canonical URL taga",
      recommendation: "Dodaj <link rel='canonical' href='...'> u <head>" });
    score -= 5;
  }

  if (!schema) {
    issues.push({ type: "missing_schema", severity: "info",
      message: "Nema Schema.org strukturiranih podataka",
      recommendation: "Dodaj JSON-LD schema markup u <head> za bolji Google prikaz" });
    score -= 5;
  }

  if (!hasSitemap) {
    issues.push({ type: "missing_sitemap", severity: "info",
      message: "Nije pronađen sitemap.xml",
      recommendation: "Dodaj /sitemap.xml i prijavi ga Google Search Console-u" });
    score -= 5;
  }

  if (!hasRobots) {
    issues.push({ type: "missing_robots", severity: "info",
      message: "Nije pronađen robots.txt",
      recommendation: "Dodaj /robots.txt koji govori crawlerima šta da indeksiraju" });
    score -= 2;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    url: normalizedUrl,
    issues,
    meta: { title, description, hasH1: h1Count > 0, h1Count, hasCanonical: canonical, hasRobots, hasSitemap, hasSchemaMarkup: schema, hasOgTags: ogTags },
  };
}
