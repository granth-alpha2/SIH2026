# TECHNOLOGY_STACK.md — AgriProfit

For every technology: why it's needed, what uses it, alternatives considered, and
trade-offs. The goal is the **smallest practical stack**, not maximum technology count.

---

## 1. Frontend

### React (Next.js) + TypeScript

- **Used by**: Farmer web app / PWA, admin dashboard.
- **Why**: Next.js gives SSR for fast first load on low-end mobile devices (important
  for rural connectivity), file-based routing, and a large ecosystem. TypeScript
  reduces runtime bugs in a data-heavy app (farm data, recommendations, prices).
- **Alternatives**: Plain React + Vite (simpler, but loses SSR benefits); Flutter (better
  for a true native mobile app, weaker for fast web iteration during a hackathon/MVP).
- **Trade-off**: Slightly higher initial setup complexity than plain React, offset by
  better performance on constrained networks.

### Tailwind CSS

- **Used by**: All frontend styling.
- **Why**: Fast to build a consistent, mobile-first, large-touch-target UI without
  writing extensive custom CSS — important given the accessibility requirements.
- **Alternatives**: Material UI (more opinionated, heavier bundle), plain CSS (slower
  to iterate).

### Google Maps JavaScript API (+ Places, Geocoding, Geometry libraries)

- **Used by**: Farm boundary marking (pin/polygon), area calculation, reverse
  geocoding to district/state.
- **Why**: Most reliable and well-documented mapping API for India-wide coverage;
  Geometry library directly supports polygon area calculation.
- **Alternatives**: Mapbox (comparable, sometimes cheaper at scale), Leaflet +
  OpenStreetMap (free but weaker geocoding accuracy in rural India).
- **Trade-off**: Paid beyond free tier at scale — cost must be monitored as farmer
  count grows; abstracted behind a `maps/` module so it could be swapped later.

---

## 2. Backend

### Node.js (NestJS or Express)

- **Used by**: Core API server (auth, farms, recommendations orchestration,
  notifications).
- **Why**: Strong fit for I/O-heavy orchestration (calling multiple external APIs
  concurrently), large talent pool, good TypeScript support shared with frontend.
- **Alternatives**: Python (FastAPI) for the whole backend — viable, but Python's
  strength is better used in the dedicated ML service; using Node for the API layer
  and Python for ML keeps each service focused.
- **Trade-off**: Running two backend languages (Node + Python) adds operational
  overhead vs. an all-Python stack; justified by clearer separation of concerns.

### Python (FastAPI) — ML/Optimization Service

- **Used by**: Scoring engine, yield/price prediction (Phase 2+), land allocation
  optimization.
- **Why**: Best ecosystem for data science and optimization (pandas, scikit-learn,
  PuLP/OR-Tools).
- **Alternatives**: Keep everything in Node with JS-based ML libraries — significantly
  weaker tooling for this use case.

---

## 3. Database

### PostgreSQL + PostGIS

- **Used by**: All persistent structured data, including farm boundary polygons.
- **Why**: Relational integrity for farmer/farm/crop relationships; PostGIS adds
  first-class geospatial querying (e.g., "which farms are in this district") without a
  separate geo database.
- **Alternatives**: MongoDB (more flexible schema, weaker relational integrity and
  geospatial querying compared to PostGIS); a separate geo database (adds
  unnecessary operational complexity).

### Redis

- **Used by**: Caching external API responses (weather, market prices), session/OTP
  storage, job queue backing store.
- **Why**: Reduces redundant external API calls (cost + latency), supports
  short-lived OTP storage with TTL natively.
- **Alternatives**: In-memory caching per service instance — doesn't work across
  multiple backend instances.

---

## 4. GIS / Mapping

### PostGIS (see above) + Google Maps Geometry library

- **Why together**: Google Maps handles the frontend drawing/UX; PostGIS handles
  backend storage and spatial queries once the polygon is saved.

---

## 5. Weather / Climate APIs

### Candidates: IMD (India Meteorological Department), Open-Meteo, NASA POWER

- **Used by**: 90-day climate suitability scoring.
- **Why multiple**: IMD is the most authoritative for India but may have limited API
  access; Open-Meteo and NASA POWER are free, well-documented fallbacks with global
  coverage — the integration module is designed to combine or fall back between them.
- **Update frequency**: Open-Meteo — hourly/daily forecasts; NASA POWER — daily,
  with a processing lag of a few days for some parameters.
- **Fallback strategy**: If the primary source is unavailable, serve the last cached
  forecast with a "data may be stale" flag rather than failing the request.

---

## 6. Market Price Data

### Agmarknet, e-NAM

- **Used by**: Mandi price trend and volatility analysis.
- **Why**: Official Government of India sources for daily/weekly mandi prices across
  commodities and markets.
- **Caveat**: These are not always available as clean REST APIs; the pipeline may need
  a scheduled scraper/bulk-download job rather than live polling. This should be
  validated early in development, and a scraping approach must respect the source
  site's terms of use.
- **Fallback**: Cached 7/30-day moving averages when a live pull fails.

---

## 7. MSP Data

### data.gov.in / Ministry of Agriculture & Farmers Welfare

- **Used by**: MSP-safety scoring.
- **Why**: Authoritative, official source; updated on a fixed government schedule
  (typically per season), not continuously.
- **Handling**: Treated as "verified/official" data in the UI, distinct from
  "estimated" market price data, per SRS §25 data-labeling requirement.

---

## 8. International Trade Data

### FAOSTAT, UN Comtrade

- **Used by**: International demand-trend signal feeding into the crop score.
- **Why**: Free, well-documented, and widely used for agricultural trade statistics.
- **Update frequency**: Monthly/annual — not real-time; used as a directional signal,
  not a live price feed.
- **Fallback**: If unavailable, the demand-signal component of the score is simply
  omitted (weight redistributed to other factors) rather than blocking the
  recommendation.

---

## 9. AI/ML

### scikit-learn, XGBoost/LightGBM (Phase 2)

- **Used by**: Yield prediction, price forecasting models.
- **Why**: Well-established for structured/tabular agricultural and price data;
  faster to train and easier to explain than deep learning for this data volume.
- **Alternatives**: Deep learning (LSTM/Transformer) for price forecasting —
  considered for a later phase if data volume and non-linearity justify it; overkill
  for the MVP.

### PuLP / Google OR-Tools (Optimization)

- **Used by**: Multi-crop land allocation (Phase 3).
- **Why**: Mature linear/constraint programming libraries that directly model the
  allocation problem (maximize profit subject to water/budget/crop-count
  constraints).
- **Alternatives**: Reinforcement learning — much higher complexity for a problem that
  linear/constraint programming already solves well; only justified if the problem
  becomes highly dynamic/sequential.

### LLM API (e.g., Claude/GPT via API) — AI Assistant

- **Used by**: Conversational crop assistant.
- **Why**: Provides natural-language Q&A grounded in the farmer's specific farm/crop
  context, passed in as structured context with each request (tool-calling / RAG
  pattern), rather than the LLM inventing agronomic facts.
- **Guardrail**: Assistant responses are clearly labeled as AI guidance, not
  professional agricultural advice, per product requirement in SRS §27.

---

## 10. Authentication

### JWT + OTP Provider (e.g., MSG91, Twilio Verify)

- **Why**: OTP-based login is the most accessible authentication method for
  low-literacy, mobile-first farmer users — no password to remember.
- **JWT**: Stateless, scalable session handling for the API layer.

---

## 11. Cloud & Infrastructure

### Docker + Docker Compose (dev) / Kubernetes or managed container service (prod)

- **Why**: Consistent environments across dev/staging/prod; Compose is sufficient for
  hackathon/MVP scale, Kubernetes or a managed equivalent (ECS/Cloud Run) for scale-up.

### CI/CD — GitHub Actions

- **Why**: Free for public/small private repos, tightly integrated with GitHub,
  sufficient for lint/test/build/deploy pipelines described in `PROJECT_STRUCTURE.md`.

### Monitoring — Prometheus + Grafana (or a managed equivalent)

- **Why**: Track API latency, external data source freshness/failures, and job queue
  health — directly supports the "data freshness" and "API monitoring" requirements
  of the admin dashboard.

---

## 12. Testing

- **Unit tests**: Jest (Node), Pytest (Python).
- **Integration tests**: Supertest (API layer) against a test database.
- **E2E tests**: Playwright or Cypress for critical farmer flows (map marking →
  recommendation → plan acceptance).

---

## 13. Summary Decision Table

| Layer | Chosen | Why (one line) |
|---|---|---|
| Frontend | Next.js + TS + Tailwind | Fast, mobile-first, SSR for weak networks |
| Maps | Google Maps API | Best India geocoding + polygon area tooling |
| Backend API | Node.js (NestJS) | Strong for orchestrating multiple external APIs |
| ML/Optimization | Python (FastAPI) | Best ecosystem for scoring, prediction, optimization |
| Database | PostgreSQL + PostGIS | Relational integrity + native geospatial queries |
| Cache/Queue | Redis | Cuts redundant external API calls, backs job queue |
| Auth | JWT + OTP | Accessible login for low-literacy mobile users |
| Deployment | Docker + Compose/K8s | Consistent, scalable environments |
| CI/CD | GitHub Actions | Simple, integrated, sufficient for MVP-to-scale |
