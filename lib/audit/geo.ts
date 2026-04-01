export interface GeoModelResult {
  model: string;
  mentioned: boolean;
  position: number | null;
  context: string | null;
  sentiment: "positive" | "neutral" | "negative" | null;
}

export interface GeoResult {
  score: number;
  totalModels: number;
  mentionedIn: number;
  results: GeoModelResult[];
  recommendations: string[];
}

const QUERIES = (brand: string, url: string) => [
  `What is ${brand}?`,
  `Tell me about ${brand}`,
  `Is ${brand} a good tool?`,
];

function detectMention(text: string, brand: string, url: string): { mentioned: boolean; position: number | null; context: string | null } {
  const lowerText = text.toLowerCase();
  const lowerBrand = brand.toLowerCase();
  const lowerUrl = url.toLowerCase().replace(/https?:\/\//, "").replace(/www\./, "");

  const brandIndex = lowerText.indexOf(lowerBrand);
  const urlIndex = lowerText.indexOf(lowerUrl);
  const index = brandIndex !== -1 ? brandIndex : urlIndex;

  if (index === -1) {
    return { mentioned: false, position: null, context: null };
  }

  const start = Math.max(0, index - 100);
  const end = Math.min(text.length, index + 200);
  const context = text.substring(start, end).trim();

  return { mentioned: true, position: index, context };
}

async function queryClaude(query: string, brand: string, url: string): Promise<GeoModelResult> {
  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [{ role: "user", content: query }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const { mentioned, position, context } = detectMention(text, brand, url);

    return {
      model: "Claude (Anthropic)",
      mentioned,
      position,
      context,
      sentiment: mentioned ? "neutral" : null,
    };
  } catch {
    return { model: "Claude (Anthropic)", mentioned: false, position: null, context: null, sentiment: null };
  }
}

async function queryOpenAI(query: string, brand: string, url: string): Promise<GeoModelResult> {
  try {
    const OpenAI = (await import("openai")).default;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 500,
      messages: [{ role: "user", content: query }],
    });

    const text = response.choices[0]?.message?.content || "";
    const { mentioned, position, context } = detectMention(text, brand, url);

    return {
      model: "ChatGPT (OpenAI)",
      mentioned,
      position,
      context,
      sentiment: mentioned ? "neutral" : null,
    };
  } catch {
    return { model: "ChatGPT (OpenAI)", mentioned: false, position: null, context: null, sentiment: null };
  }
}

async function queryGemini(query: string, brand: string, url: string): Promise<GeoModelResult> {
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

    const response = await model.generateContent(query);
    const text = response.response.text();
    const { mentioned, position, context } = detectMention(text, brand, url);

    return {
      model: "Gemini (Google)",
      mentioned,
      position,
      context,
      sentiment: mentioned ? "neutral" : null,
    };
  } catch {
    return { model: "Gemini (Google)", mentioned: false, position: null, context: null, sentiment: null };
  }
}

async function queryPerplexity(query: string, brand: string, url: string): Promise<GeoModelResult> {
  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [{ role: "user", content: query }],
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    const { mentioned, position, context } = detectMention(text, brand, url);

    return {
      model: "Perplexity AI",
      mentioned,
      position,
      context,
      sentiment: mentioned ? "neutral" : null,
    };
  } catch {
    return { model: "Perplexity AI", mentioned: false, position: null, context: null, sentiment: null };
  }
}

export async function runGeoAudit(brand: string, url: string): Promise<GeoResult> {
  const queries = QUERIES(brand, url);
  const mainQuery = queries[0];

  // Pitamo sve 4 AI modele paralelno
  const [claudeResult, openaiResult, geminiResult, perplexityResult] = await Promise.all([
    queryClaude(mainQuery, brand, url),
    queryOpenAI(mainQuery, brand, url),
    queryGemini(mainQuery, brand, url),
    queryPerplexity(mainQuery, brand, url),
  ]);

  const results = [claudeResult, openaiResult, geminiResult, perplexityResult];
  const mentionedIn = results.filter((r) => r.mentioned).length;
  const totalModels = results.length;
  const score = Math.round((mentionedIn / totalModels) * 100);

  const recommendations: string[] = [];

  if (mentionedIn === 0) {
    recommendations.push("Napravi llms.txt fajl u root folderu sajta koji opisuje tvoj brend");
    recommendations.push("Dodaj strukturirane podatke (Schema.org) na sajt");
    recommendations.push("Napiši jasan About stranicu koja opisuje čime se baviš");
    recommendations.push("Objavi blog postove i sadržaj koji AI modeli mogu citirati");
  } else if (mentionedIn < totalModels) {
    recommendations.push("Poboljšaj opis brenda na sajtu — budi konkretniji i jasniji");
    recommendations.push("Dodaj llms.txt fajl u root folderu za bolje AI indeksiranje");
    recommendations.push("Povećaj broj kvalitetnih backlink-ova ka tvom sajtu");
  } else {
    recommendations.push("Odličan GEO rezultat! Nastavi sa kreiranjem kvalitetnog sadržaja");
    recommendations.push("Redovno ažuriraj llms.txt fajl sa novim informacijama");
  }

  return { score, totalModels, mentionedIn, results, recommendations };
}
