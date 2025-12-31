require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function handleApiError(res, error, fallbackMessage = "Internal server error") {
  console.error("API error:", error?.response?.data || error.message || error);

  if (error.response && error.response.status === 404) {
    return res.status(404).json({
      error: "Resource not found",
    });
  }

  if (error.response && error.response.status === 400) {
    return res.status(400).json({
      error: "Bad request",
      details: error.response.data,
    });
  }

  return res.status(500).json({
    error: fallbackMessage,
  });
}

app.get("/api/weather", async (req, res) => {
  const city = req.query.city;
  if (!city) {
    return res.status(400).json({
      error: "Missing required query parameter: city",
    });
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "Server configuration error: OPENWEATHER_API_KEY not set",
    });
  }

  try {
    const url = "https://api.openweathermap.org/data/2.5/weather";
    const response = await axios.get(url, {
      params: {
        q: city,
        appid: apiKey,
        units: "metric",
      },
    });

    const data = response.data;
    const result = {
      city: data.name,
      coords: {
        lat: data.coord.lat,
        lon: data.coord.lon,
      },
      temperature: data.main.temp,
      feels_like: data.main.feels_like,
      description: data.weather?.[0]?.description || "",
      icon: data.weather?.[0]?.icon || "",
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      wind_speed: data.wind.speed,
      country: data.sys.country,
      rain_3h: data.rain?.["3h"] || 0,
    };

    return res.status(200).json(result);
  } catch (error) {
    return handleApiError(res, error, "Failed to fetch weather data");
  }
});

app.get("/api/news", async (req, res) => {
  const city = req.query.city;
  if (!city) {
    return res.status(400).json({
      error: "Missing required query parameter: city",
    });
  }

  const newsApiKey = process.env.NEWS_API_KEY;
  if (!newsApiKey) {
    return res.status(500).json({
      error: "Server configuration error: NEWS_API_KEY not set",
    });
  }

  try {
    const url = "https://gnews.io/api/v4/search";
    const response = await axios.get(url, {
      params: {
        q: city,
        lang: "en",
        max: 5,
        token: newsApiKey,
      },
    });

    const articles = (response.data.articles || []).map((a) => ({
      title: a.title,
      description: a.description,
      url: a.url,
      source: a.source?.name,
      publishedAt: a.publishedAt,
    }));

    return res.status(200).json({
      city,
      total: articles.length,
      articles,
    });
  } catch (error) {
    return handleApiError(res, error, "Failed to fetch news data");
  }
});

app.get("/api/currency", async (req, res) => {
  const base = req.query.base;  
  const target = req.query.target; 

  if (!base || !target) {
    return res.status(400).json({
      error: "Missing required query parameters: base and target",
    });
  }

  const currencyApiKey = process.env.CURRENCY_API_KEY;
  if (!currencyApiKey) {
    return res.status(500).json({
      error: "Server configuration error: CURRENCY_API_KEY not set",
    });
  }

  try {
    const url = `https://v6.exchangerate-api.com/v6/${currencyApiKey}/latest/USD`;

    const response = await axios.get(url);

    if (response.data.result !== "success") {
      console.error("Exchangerate-API error:", response.data);
      return res.status(502).json({
        error: "Failed to fetch currency data from provider",
        details: response.data["error-type"] || null,
      });
    }

    const rates = response.data.conversion_rates;
    if (!rates || typeof rates[base] !== "number" || typeof rates[target] !== "number") {
      return res.status(404).json({
        error: "Currency rate not found",
      });
    }

    const baseRateAgainstUSD = rates[base];
    const targetRateAgainstUSD = rates[target];
    const rate = targetRateAgainstUSD / baseRateAgainstUSD;

    return res.status(200).json({
      base,
      target,
      rate,
      date: response.data.time_last_update_utc || null,
    });
  } catch (error) {
    return handleApiError(res, error, "Failed to fetch currency data");
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});