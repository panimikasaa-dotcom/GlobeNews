const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GNEWS_API_KEY || "";
const CACHE_SECONDS = Number(process.env.CACHE_SECONDS || 30);
const ORIGINS = process.env.CORS_ORIGIN || "*";

app.use(cors({
  origin: ORIGINS === "*" ? true : ORIGINS.split(",").map(s => s.trim())
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

const cache = new Map();

function cacheKey(params) {
  return JSON.stringify(params);
}

function demoArticle(country, category, i) {
  const now = new Date().toISOString();
  return {
    id: `demo-${country}-${category}-${i}`,
    title: `GlobeNews demo: berita ${category} ${country}`,
    description: "API berita belum dikonfigurasi. Tambahkan GNEWS_API_KEY untuk berita live.",
    content: "Ini adalah data demo, bukan berita real-time.",
    url: "#",
    image: "",
    publishedAt: now,
    source: { name: "GlobeNews Demo", url: "#" }
  };
}

async function fetchGNews(params) {
  const url = new URL("https://gnews.io/api/v4/top-headlines");
  url.searchParams.set("apikey", API_KEY);
  url.searchParams.set("lang", params.lang || "en");
  url.searchParams.set("max", String(Math.min(Number(params.max || 10), 10)));
  url.searchParams.set("category", params.category || "general");

  if (params.country) url.searchParams.set("country", params.country);

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    const message = data?.errors?.join(", ") || data?.message || `GNews HTTP ${response.status}`;
    throw new Error(message);
  }

  return {
    source: "gnews",
    totalArticles: data.totalArticles || data.articles?.length || 0,
    articles: (data.articles || []).map((a, index) => ({
      id: `${a.url || "article"}-${index}`,
      title: a.title,
      description: a.description || "",
      content: a.content || "",
      url: a.url,
      image: a.image || "",
      publishedAt: a.publishedAt,
      source: a.source || {}
    }))
  };
}

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    liveNewsConfigured: Boolean(API_KEY),
    provider: "GNews",
    refreshSeconds: 30
  });
});

app.get("/api/news", async (req, res) => {
  const params = {
    country: String(req.query.country || "id").toLowerCase(),
    category: String(req.query.category || "general").toLowerCase(),
    lang: String(req.query.lang || "en").toLowerCase(),
    max: Number(req.query.max || 10)
  };

  const key = cacheKey(params);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.time < CACHE_SECONDS * 1000) {
    return res.json({ ...cached.data, cached: true });
  }

  if (!API_KEY) {
    const demo = {
      source: "demo",
      live: false,
      totalArticles: 5,
      articles: Array.from({ length: 5 }, (_, i) =>
        demoArticle(params.country, params.category, i)
      ),
      warning: "GNEWS_API_KEY belum diisi. Tambahkan API key di server agar feed menjadi live."
    };
    return res.json(demo);
  }

  try {
    const data = await fetchGNews(params);
    const result = { ...data, live: true, cached: false };
    cache.set(key, { time: Date.now(), data: result });
    res.json(result);
  } catch (error) {
    res.status(502).json({
      source: "gnews",
      live: false,
      error: error.message,
      articles: []
    });
  }
});

app.get("/{*splat}", (req, res) => {
  res.sendFile(require("path").join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`GlobeNews running on port ${PORT}`);
  console.log(API_KEY ? "Live news: configured" : "Live news: NOT configured");
});
