const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GNEWS_API_KEY || "";
const CACHE_SECONDS = Number(process.env.CACHE_SECONDS || 30);
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

app.use(
  cors({
    origin:
      CORS_ORIGIN === "*"
        ? true
        : CORS_ORIGIN.split(",").map((s) => s.trim()),
  })
);

app.use(express.json({ limit: "1mb" }));

// Static website
app.use(express.static(path.join(__dirname, "public")));

const cache = new Map();

function cacheKey(params) {
  return JSON.stringify(params);
}

function getCached(key) {
  const item = cache.get(key);

  if (!item) return null;

  if (Date.now() - item.time > CACHE_SECONDS * 1000) {
    cache.delete(key);
    return null;
  }

  return item.data;
}

async function fetchGNews(params) {
  if (!API_KEY) {
    return {
      source: "demo",
      live: false,
      articles: [],
      message: "GNEWS_API_KEY is not configured.",
    };
  }

  const url = new URL("https://gnews.io/api/v4/top-headlines");

  url.searchParams.set("apikey", API_KEY);
  url.searchParams.set("lang", "en");
  url.searchParams.set("max", "10");

  if (params.country) {
    url.searchParams.set("country", params.country);
  }

  if (params.category && params.category !== "general") {
    url.searchParams.set("category", params.category);
  }

  const response = await fetch(url);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GNews API ${response.status}: ${text}`);
  }

  return await response.json();
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "GlobeNews",
    live: Boolean(API_KEY),
    newsApiConfigured: Boolean(API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// News API
app.get("/api/news", async (req, res) => {
  const params = {
    country: String(req.query.country || "us").toLowerCase(),
    category: String(req.query.category || "general").toLowerCase(),
  };

  const key = cacheKey(params);
  const cached = getCached(key);

  if (cached) {
    return res.json({
      ...cached,
      cached: true,
    });
  }

  try {
    const data = await fetchGNews(params);

    const result = {
      ...data,
      live: Boolean(API_KEY),
      cached: false,
    };

    cache.set(key, {
      time: Date.now(),
      data: result,
    });

    return res.json(result);
  } catch (error) {
    console.error("News API error:", error);

    return res.status(502).json({
      source: "gnews",
      live: false,
      error: error.message,
      articles: [],
    });
  }
});

// Homepage only — NO wildcard route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Vercel needs the Express app exported.
// Local development can still use `node server.js`.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`GlobeNews running on port ${PORT}`);
    console.log(
      API_KEY
        ? "Live news: configured"
        : "Live news: NOT configured"
    );
  });
}

module.exports = app;