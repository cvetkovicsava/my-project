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

export async function runSeoAudit(url: string): Promise<SeoResult> {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    throw new Error("DataForSEO kredencijali nisu postavljeni u .env.local");
  }

  const credentials = Buffer.from(`${login}:${password}`).toString("base64");

  // Pokretanje On-Page taska
  const taskResponse = await fetch(
    "https://api.dataforseo.com/v3/on_page/task_post",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        {
          target: url,
          max_crawl_pages: 1,
          load_resources: false,
          enable_javascript: false,
        },
      ]),
    }
  );

  const taskData = await taskResponse.json();

  if (!taskData.tasks || taskData.tasks[0].status_code !== 20100) {
    throw new Error(`DataForSEO greška: ${taskData.tasks?.[0]?.status_message || "Nepoznata greška"}`);
  }

  const taskId = taskData.tasks[0].id;

  // Čekamo da se task završi (max 30 sekundi)
  await new Promise((resolve) => setTimeout(resolve, 15000));

  // Dohvatamo rezultate
  const resultResponse = await fetch(
    `https://api.dataforseo.com/v3/on_page/pages`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([{ id: taskId, limit: 1 }]),
    }
  );

  const resultData = await resultResponse.json();
  const pageData = resultData.tasks?.[0]?.result?.[0]?.items?.[0];

  if (!pageData) {
    // Ako nema podataka, vraćamo osnovni rezultat
    return buildBasicResult(url);
  }

  return buildSeoResult(url, pageData);
}

function buildSeoResult(url: string, pageData: any): SeoResult {
  const issues: SeoIssue[] = [];
  let score = 100;

  const meta = pageData.meta || {};
  const checks = pageData.checks || {};

  // Provjera title taga
  const title = meta.title || null;
  if (!title) {
    issues.push({
      type: "missing_title",
      severity: "critical",
      message: "Stranica nema title tag",
      recommendation: "Dodaj <title> tag sa ključnim riječima (50-60 znakova)",
    });
    score -= 20;
  } else if (title.length < 30) {
    issues.push({
      type: "short_title",
      severity: "warning",
      message: `Title je previše kratak (${title.length} znakova)`,
      recommendation: "Title treba biti između 50-60 znakova",
    });
    score -= 10;
  } else if (title.length > 60) {
    issues.push({
      type: "long_title",
      severity: "warning",
      message: `Title je previše dugačak (${title.length} znakova)`,
      recommendation: "Skrati title na maksimalno 60 znakova",
    });
    score -= 5;
  }

  // Provjera meta description
  const description = meta.description || null;
  if (!description) {
    issues.push({
      type: "missing_description",
      severity: "critical",
      message: "Stranica nema meta description",
      recommendation: "Dodaj meta description (150-160 znakova) koji opisuje sadržaj",
    });
    score -= 15;
  } else if (description.length < 100) {
    issues.push({
      type: "short_description",
      severity: "warning",
      message: `Meta description je kratak (${description.length} znakova)`,
      recommendation: "Meta description treba biti između 150-160 znakova",
    });
    score -= 8;
  }

  // Provjera H1
  const h1Count = meta.htags?.h1?.length || 0;
  if (h1Count === 0) {
    issues.push({
      type: "missing_h1",
      severity: "critical",
      message: "Stranica nema H1 naslov",
      recommendation: "Dodaj jedan H1 tag sa glavnom temom stranice",
    });
    score -= 15;
  } else if (h1Count > 1) {
    issues.push({
      type: "multiple_h1",
      severity: "warning",
      message: `Stranica ima ${h1Count} H1 naslova (treba biti samo jedan)`,
      recommendation: "Ostavi samo jedan H1 tag, ostale pretvori u H2 ili H3",
    });
    score -= 5;
  }

  // Provjera OG tagova
  const hasOgTags = !!(meta.og_title || meta.og_description);
  if (!hasOgTags) {
    issues.push({
      type: "missing_og_tags",
      severity: "warning",
      message: "Nema Open Graph (OG) tagova za dijeljenje na društvenim mrežama",
      recommendation: "Dodaj og:title, og:description i og:image tagove u <head>",
    });
    score -= 10;
  }

  // Provjera canonical
  const hasCanonical = !!checks.canonical;
  if (!hasCanonical) {
    issues.push({
      type: "missing_canonical",
      severity: "info",
      message: "Nema canonical URL taga",
      recommendation: "Dodaj <link rel='canonical' href='...'> u <head>",
    });
    score -= 5;
  }

  // Provjera schema markup
  const hasSchemaMarkup = !!(pageData.page_timing || checks.has_html_doctype);
  if (!hasSchemaMarkup) {
    issues.push({
      type: "missing_schema",
      severity: "info",
      message: "Nema Schema.org strukturiranih podataka",
      recommendation: "Dodaj JSON-LD schema markup za bolji prikaz u Google rezultatima",
    });
    score -= 5;
  }

  return {
    score: Math.max(0, score),
    url,
    issues,
    meta: {
      title,
      description,
      hasH1: h1Count > 0,
      h1Count,
      hasCanonical,
      hasRobots: !!checks.has_robots_txt,
      hasSitemap: !!checks.has_sitemap_xml,
      hasSchemaMarkup,
      hasOgTags,
    },
  };
}

function buildBasicResult(url: string): SeoResult {
  return {
    score: 50,
    url,
    issues: [
      {
        type: "audit_incomplete",
        severity: "warning",
        message: "Audit nije mogao prikupiti sve podatke",
        recommendation: "Provjeri da li je sajt dostupan i pokušaj ponovo",
      },
    ],
    meta: {
      title: null,
      description: null,
      hasH1: false,
      h1Count: 0,
      hasCanonical: false,
      hasRobots: false,
      hasSitemap: false,
      hasSchemaMarkup: false,
      hasOgTags: false,
    },
  };
}
