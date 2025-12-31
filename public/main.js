const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const errorMessage = document.getElementById("errorMessage");

const weatherContent = document.getElementById("weatherContent");
const newsContent = document.getElementById("newsContent");
const currencyContent = document.getElementById("currencyContent");
const mapContainer = document.getElementById("map");

searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (!city) {
    showError("Please enter a city name.");
    return;
  }
  clearError();
  fetchAllData(city);
});

cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    searchBtn.click();
  }
});

function showError(msg) {
  errorMessage.textContent = msg;
}

function clearError() {
  errorMessage.textContent = "";
}

async function fetchAllData(city) {
  try {
    setLoadingState(true);
    const weatherRes = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
    if (!weatherRes.ok) {
      throw await buildErrorFromResponse(weatherRes);
    }
    const weather = await weatherRes.json();
    renderWeather(weather);
    renderMap(weather.coords.lat, weather.coords.lon);

    const currencyMap = {
      KZ: "KZT",
      US: "USD",
      GB: "GBP",
      RU: "RUB",
      FR: "EUR",
      DE: "EUR",
      ES: "EUR",
      IT: "EUR",
      JP: "JPY",
      CN: "CNY",
    };
    const countryCode = weather.country;
    const baseCurrency = currencyMap[countryCode] || "USD";
    const targetCurrency = "USD";

    const [newsRes, currencyRes] = await Promise.all([
      fetch(`/api/news?city=${encodeURIComponent(city)}`),
      fetch(
        `/api/currency?base=${encodeURIComponent(baseCurrency)}&target=${encodeURIComponent(
          targetCurrency
        )}`
      ),
    ]);

    const news = newsRes.ok ? await newsRes.json() : null;
    const currency = currencyRes.ok ? await currencyRes.json() : null;

    renderNews(news);
    renderCurrency(currency, baseCurrency, targetCurrency);
  } catch (error) {
    console.error("fetchAllData error:", error);
    showError(error.message || "Failed to fetch data");
  } finally {
    setLoadingState(false);
  }
}

async function buildErrorFromResponse(response) {
  let details = "";
  try {
    const data = await response.json();
    details = data.error || JSON.stringify(data);
  } catch {
    details = response.statusText;
  }
  return new Error(`Request failed (${response.status}): ${details}`);
}

function setLoadingState(isLoading) {
  if (isLoading) {
    weatherContent.innerHTML = "<p>Loading weather...</p>";
    newsContent.innerHTML = "<p>Loading news...</p>";
    currencyContent.innerHTML = "<p>Loading currency data...</p>";
  }
}


function renderWeather(data) {
  const iconUrl = data.icon
    ? `https://openweathermap.org/img/wn/${data.icon}@2x.png`
    : "";

  weatherContent.innerHTML = `
    <div class="weather-main">
      <div class="weather-left">
        <h3>${data.city}, ${data.country}</h3>
        <p class="temp">${Math.round(data.temperature)}°C</p>
        <p class="description">${data.description}</p>
        <p class="feels">Feels like: ${Math.round(data.feels_like)}°C</p>
      </div>
      <div class="weather-right">
        ${
          iconUrl
            ? `<img src="${iconUrl}" alt="${data.description}" class="weather-icon" />`
            : ""
        }
        <p>Lat: ${data.coords.lat.toFixed(3)}, Lon: ${data.coords.lon.toFixed(3)}</p>
        <p>Humidity: ${data.humidity}%</p>
        <p>Pressure: ${data.pressure} hPa</p>
        <p>Wind: ${data.wind_speed} m/s</p>
        <p>Rain (last 3h): ${data.rain_3h} mm</p>
      </div>
    </div>
  `;
}

function renderMap(lat, lon) {
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${
    lon - 0.1
  }%2C${lat - 0.1}%2C${lon + 0.1}%2C${lat + 0.1}&layer=mapnik&marker=${lat}%2C${lon}`;

  mapContainer.innerHTML = `
    <iframe
      title="map"
      width="100%"
      height="100%"
      frameborder="0"
      scrolling="no"
      marginheight="0"
      marginwidth="0"
      src="${src}">
    </iframe>
  `;
}

function renderNews(news) {
  if (!news || !news.articles || news.articles.length === 0) {
    newsContent.innerHTML = "<p>No news found for this city.</p>";
    return;
  }

  const articlesHtml = news.articles
    .map(
      (a) => `
      <article class="news-item">
        <h3><a href="${a.url}" target="_blank" rel="noopener noreferrer">${a.title}</a></h3>
        <p>${a.description || ""}</p>
        <p class="news-meta">
          Source: ${a.source || "Unknown"} |
          Published: ${new Date(a.publishedAt).toLocaleString()}
        </p>
      </article>
    `
    )
    .join("");

  newsContent.innerHTML = articlesHtml;
}

function renderCurrency(currency, base, target) {
  if (!currency || !currency.rate) {
    currencyContent.innerHTML = "<p>Currency information is not available.</p>";
    return;
  }

  const invertedRate = 1 / currency.rate;

  currencyContent.innerHTML = `
    <p>Base currency (approx.): <strong>${base}</strong></p>
    <p>Target currency: <strong>${target}</strong></p>
    <p>Exchange rate: <strong>1 ${target} = ${invertedRate.toFixed(2)} ${base}</strong></p>
    <p>Rate date: ${currency.date}</p>
  `;
}