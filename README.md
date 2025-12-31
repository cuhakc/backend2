# Weather & City Info (Assignment 2)

This project is Assignment 2 for the Backend / Web course.  
The goal is to build a small full‑stack application that integrates multiple APIs on the server side, processes the data, and displays it in a clean, responsive UI.

The application lets users:

- Search for a **city**
- See **real-time weather** (OpenWeatherMap)
- See the city on an **interactive map** (OpenStreetMap)
- Read **local news** related to the city (GNews API)
- View **currency information** using **Exchangerate‑API**

All external APIs are called **only on the backend**; the frontend never exposes any API keys.

---

## 1. Project Structure

```text
project-root/
  package.json
  server.js           # Core backend logic (Express server + API routes)
  .env                # Environment variables with API keys (NOT in Git)
  public/
    index.html        # UI layout (no business logic)
    styles.css        # Styling + responsive design
    main.js           # Frontend logic, calls only our backend APIs
  README.md
```

Key points:

- All server‑side logic and API calls are in `server.js`.
- Frontend logic (DOM updates, fetch calls to `/api/...`) is in `public/main.js`.
- `index.html` only contains markup and static structure (no inline JS logic).
- The server runs on **port 3000** as required.

---

## 2. Technologies Used

- **Backend**
  - Node.js
  - Express
  - Axios (HTTP client)
  - dotenv (environment variables)
  - CORS (for safe local development)

- **Frontend**
  - Plain HTML, CSS, and vanilla JavaScript
  - OpenStreetMap embed (no key required)

- **External APIs (server side only)**
  - [OpenWeatherMap](https://openweathermap.org/api) – weather data
  - [GNews API](https://gnews.io/) – news data
  - [Exchangerate‑API](https://www.exchangerate-api.com/) – currency data

---

## 3. Setup Instructions

### 3.1 Prerequisites

- Node.js (LTS version recommended)
- npm
- Internet connection (for external APIs)

### 3.2 Clone and install

```bash
git clone https://github.com/cuhakc/backend2.git
cd backend2
npm install
```

### 3.3 Environment variables

Create a `.env` file in the **project root** (same folder as `server.js`):

```env
OPENWEATHER_API_KEY=your_openweather_key_here
NEWS_API_KEY=your_gnews_api_key_here
CURRENCY_API_KEY=your_exchangerate_api_key_here
```

> **Important:**  
> - `.env` is NOT committed to GitHub.
> - All API keys are only used on the server and **never** in the frontend code.

### 3.4 Run the application

```bash
npm start
```

The server will start on:

```text
http://localhost:3000
```

Open that URL in your browser.

---

## 4. Application Functionality

### 4.1 User flow

1. User enters a **city name** (e.g., “Almaty”, “Astana”, “London”) and clicks **Search**.
2. Frontend (`main.js`) sends requests to backend:
   - `GET /api/weather?city=<city>`
   - `GET /api/news?city=<city>`
   - `GET /api/currency?base=<countryCurrency>&target=USD`
3. Backend (`server.js`) calls external APIs, processes the responses, and returns clean JSON back to the frontend.
4. Frontend updates:
   - **Weather card:** temperature, feels‑like, description, icon, coordinates, humidity, pressure, wind speed, rain volume, country code.
   - **Map card:** map centered on latitude/longitude.
   - **News card:** latest local news headlines.
   - **Currency card:** exchange rate (e.g., `1 USD = N KZT`) and last update date.

---

## 5. Backend API Design

### 5.1 `/api/weather`

**Method:** `GET`  
**Query parameters:**

- `city` – city name (required), e.g. `Astana`

**Example request:**

```http
GET /api/weather?city=Astana
```

**External API used:**

- OpenWeatherMap – `https://api.openweathermap.org/data/2.5/weather`

**Sample response:**

```json
{
  "city": "Astana",
  "coords": {
    "lat": 43.2565,
    "lon": 76.9285
  },
  "temperature": -3.12,
  "feels_like": -9,
  "description": "snow",
  "icon": "13d",
  "humidity": 93,
  "pressure": 1007,
  "wind_speed": 5,
  "country": "KZ",
  "rain_3h": 0
}
```

**Error responses:**

- `400 Bad Request` – missing `city`:
  ```json
  { "error": "Missing required query parameter: city" }
  ```
- `404 Not Found` – invalid city name:
  ```json
  { "error": "Resource not found" }
  ```
- `500 Internal Server Error` – misconfiguration or provider error:
  ```json
  { "error": "Failed to fetch weather data" }
  ```

---

### 5.2 `/api/news`

**Method:** `GET`  
**Query parameters:**

- `city` – city name (required)

**Example request:**

```http
GET /api/news?city=Astana
```

**External API used:**

- GNews – `https://gnews.io/api/v4/search`

**Sample response:**

```json
{
  "city": "Astana",
  "total": 3,
  "articles": [
    {
      "title": "Astana Financial Centre Boosts Economy with $6B Investments",
      "description": "...",
      "url": "https://example.com/article1",
      "source": "EUROPE SAYS",
      "publishedAt": "2025-12-26T15:24:23Z"
    },
    ...
  ]
}
```

**Error responses:**

- `400 Bad Request` – missing `city`:
  ```json
  { "error": "Missing required query parameter: city" }
  ```
- `500 Internal Server Error` – invalid key / provider problem:
  ```json
  { "error": "Failed to fetch news data" }
  ```

---

### 5.3 `/api/currency`

**Method:** `GET`  
**Query parameters:**

- `base` – base currency code (e.g. `KZT`)
- `target` – target currency code (e.g. `USD`)

**Example request:**

```http
GET /api/currency?base=KZT&target=USD
```

**External API used:**

- Exchangerate‑API – pattern:

  ```text
  https://v6.exchangerate-api.com/v6/<CURRENCY_API_KEY>/latest/USD
  ```

  The backend always requests `latest/USD` and then computes:

  ```text
  1 base = (targetRate / baseRate) target
  ```

**Sample response:**

```json
{
  "base": "KZT",
  "target": "USD",
  "rate": 0.002,
  "date": "Wed, 31 Dec 2025 00:00:02 +0000"
}
```

On the frontend we display the inverse:

```text
1 USD = 500.00 KZT   (example)
```

**Error responses:**

- `400 Bad Request` – missing `base` or `target`:
  ```json
  { "error": "Missing required query parameters: base and target" }
  ```
- `404 Not Found` – unsupported currency code:
  ```json
  { "error": "Currency rate not found" }
  ```
- `500 Internal Server Error` – invalid API key / provider issue:
  ```json
  { "error": "Failed to fetch currency data" }
  ```

---

## 6. API Testing with Postman

All **backend** endpoints were tested with Postman:

- `GET /api/weather`
- `GET /api/news`
- `GET /api/currency`

Only server‑side routes were tested. External APIs were **not** called directly from Postman.

### 6.1 `/api/weather` tests

1. **Valid request**

   - Request: `GET http://localhost:3000/api/weather?city=Astana`
   - Result: `200 OK`
   - JSON contains `city`, `coords.lat`, `coords.lon`, `temperature`, `feels_like`, `description`, `icon`, `humidity`, `pressure`, `wind_speed`, `country`, `rain_3h`.

2. **400 Bad Request – missing city**

   - Request: `GET http://localhost:3000/api/weather`
   - Result: `400 Bad Request`
   - Body: `{ "error": "Missing required query parameter: city" }`

3. **404 Not Found – invalid city**

   - Request: `GET http://localhost:3000/api/weather?city=ThisCityDoesNotExist123`
   - Result: `404 Not Found`
   - Body: `{ "error": "Resource not found" }`

4. **500 Internal Server Error – misconfigured key (simulated)**

   - Temporarily removed `OPENWEATHER_API_KEY` from `.env`.
   - Request: `GET /api/weather?city=Almaty`
   - Result: `500 Internal Server Error`
   - Body: `{ "error": "Server configuration error: OPENWEATHER_API_KEY not set" }`

**Screenshots:**

- `screenshots/postman-weather.png`

---

### 6.2 `/api/news` tests

1. **Valid request**

   - Request: `GET http://localhost:3000/api/news?city=Astana`
   - Result: `200 OK`
   - JSON structure:
     - `city`
     - `total`
     - `articles[]` with `title`, `description`, `url`, `source`, `publishedAt`.

2. **400 Bad Request – missing city**

   - Request: `GET http://localhost:3000/api/news`
   - Result: `400 Bad Request`
   - Body: `{ "error": "Missing required query parameter: city" }`

3. **500 Internal Server Error – invalid NEWS_API_KEY (simulated)**

   - Changed `NEWS_API_KEY` to an invalid string in `.env`.
   - Request: `GET /api/news?city=Astana`
   - Result: `500 Internal Server Error`
   - Body includes `{ "error": "Failed to fetch news data" }`.

**Screenshots:**

- `screenshots/postman-news.png`

---

### 6.3 `/api/currency` tests

1. **Valid request**

   - Request: `GET http://localhost:3000/api/currency?base=KZT&target=USD`
   - Result: `200 OK`
   - JSON structure:
     - `base`
     - `target`
     - `rate` (number)
     - `date` (string)

2. **400 Bad Request – missing parameters**

   - Request: `GET http://localhost:3000/api/currency`
   - Result: `400 Bad Request`
   - Body: `{ "error": "Missing required query parameters: base and target" }`

3. **404 Not Found – unsupported code**

   - Request: `GET http://localhost:3000/api/currency?base=XXX&target=USD`
   - Result: `404 Not Found`
   - Body: `{ "error": "Currency rate not found" }`

4. **500 Internal Server Error – invalid CURRENCY_API_KEY (simulated)**

   - Set `CURRENCY_API_KEY` to an incorrect value.
   - Request: `GET /api/currency?base=KZT&target=USD`
   - Result: server returns 500 and `{ "error": "Failed to fetch currency data" }`.

**Screenshots:**

- `screenshots/postman-currency.png`

---

## 7. Design and Implementation Decisions

### 7.1 Separation of Concerns

- **Backend** is responsible for:
  - Interacting with external APIs.
  - Hiding API keys using environment variables.
  - Validating query parameters.
  - Handling errors and returning clear HTTP status codes.
  - Providing a clean, unified JSON format to the frontend.

- **Frontend** is responsible for:
  - User input and UI.
  - Calling only `/api/...` endpoints on the same origin.
  - Rendering cards for weather, map, news, and currency.

### 7.2 Map Integration

- Used **OpenStreetMap** embed via `<iframe>` generated from coordinates.
- No API key is needed.
- This satisfies the “geolocation and mapping” requirement by visually showing the city location based on latitude and longitude.

### 7.3 Responsive UI and Styling

- Layout is based on CSS Grid and Flexbox.
- Media queries collapse 2‑column layout to 1‑column on smaller screens.
- Cards (Weather, Map, News, Currency) have consistent styling, padding, and shadows for clear visual hierarchy.

### 7.4 Security and API Keys

- `.env` holds:
  - `OPENWEATHER_API_KEY`
  - `NEWS_API_KEY`
  - `CURRENCY_API_KEY`
- Keys are only read in `server.js` via `process.env`.
- Frontend (`main.js`) never contains or logs keys; it only uses relative URLs like `/api/weather`.

---

## 8. How to Defend the Project

During defense, I can explain:

- **Route flow:**  
  User → `/` → `index.html` → JS → `/api/weather|news|currency` → external APIs → JSON → DOM updates.
- **HTTP concepts:**
  - Use of methods (`GET`), query parameters, and status codes (`200`, `400`, `404`, `500`).
- **Why server‑side APIs:**
  - Protects keys.
  - Centralizes error handling and validation.
  - Provides a single, consistent format to the frontend.
- **Error handling:**
  - `handleApiError` function to standardize responses.
  - Different responses for missing parameters, invalid city/currency, and configuration issues.
- **Responsive design:**
  - How CSS grid + media queries adapt layout to different screen sizes.

---

## 9. How to Run Tests Again

1. Start server: `npm start`.
2. Open Postman.
3. Use the following base URL:
   ```text
   http://localhost:3000
   ```
4. Run the test requests described in section **6**.
5. Compare the results with the expected status codes and JSON shapes.

---

**Author:** `cuhakc`  
**Course:** Assignment 2 – APIs, Backend & Frontend Integration
