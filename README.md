# AgriProfit — AI-Powered Smart Crop & Farm Profit Optimization Platform

> A decision-support platform that helps farmers decide **what to grow, where to grow it,
> when to grow it, and how to manage it**, by combining land data, live climate data,
> market/MSP prices, and international demand signals into a single AI-driven
> recommendation and profit-simulation engine.

---

## 1. Vision

Most Indian farmers plan their crop cycle using incomplete, delayed, or informal
information — last season's price, a neighbor's choice, or a trader's advice. This leads
to price crashes from over-planting popular crops, missed better-paying alternatives,
and avoidable financial risk.

**AgriProfit's vision** is to give every farmer, on their own land, an AI-generated,
explainable, and risk-aware farm plan that maximizes **expected profit and financial
stability** — not just yield or one metric like current price.

---

## 2. Problem Statement

Farmers currently lack a single tool that combines:

- Farm-specific location and land area
- Short-term (90-day) climate forecast for that exact region
- Live/recent MSP and mandi price data
- Historical price trend and volatility
- International demand/trade signals for the crop
- Realistic input cost estimates
- Risk factors (weather, pest, price volatility, procurement availability)

As a result, crop selection today is largely intuition-driven rather than data-driven,
and farmers bear avoidable financial risk.

---

## 3. Solution

AgriProfit lets a farmer:

1. Mark their farm boundary on a map (Google Maps API — pin or polygon draw).
2. Optionally divide the land into sections.
3. Set preferences (risk appetite, water availability, investment capacity, crops to
   avoid).
4. Receive an AI-generated **multi-crop allocation plan** — not a single crop — ranked
   by expected profit, weather suitability, market opportunity, and risk.
5. See a full profit breakdown (expected revenue, cost, profit, ROI, break-even).
6. Get a stage-by-stage crop lifecycle calendar with irrigation/fertilizer/pest guidance.
7. Receive ongoing notifications (irrigation reminders, price alerts, disease-risk
   alerts).
8. Ask an AI crop assistant contextual questions about their specific farm and crop
   stage.

---

## 4. Target Users

- **Primary**: Individual/smallholder farmers (via mobile-first app).
- **Secondary**: Farmer Producer Organizations (FPOs), agricultural extension officers,
  and cooperative societies who advise multiple farmers.
- **Tertiary**: Government agricultural departments (aggregated, anonymized analytics).

---

## 5. Core Features

| Feature | Summary |
|---|---|
| Farm mapping | Google Maps pin/polygon land marking, auto area calculation |
| Land division | Split farm into sections for multi-crop allocation |
| 90-day climate analysis | Region-specific weather suitability scoring per crop |
| Crop discovery engine | Database of crops with agronomic + economic attributes |
| Market price analysis | Mandi price trends, volatility, expected harvest-time price |
| MSP / fallback analysis | MSP comparison and procurement-safety scoring (not a guarantee) |
| International trade signal | FAOSTAT/UN Comtrade-based demand trend as a market signal |
| Profit calculation engine | Revenue, cost, profit, ROI, break-even per crop and per farm |
| Risk-adjusted scoring | Weather, price, disease, and market risk combined into one score |
| Multi-crop portfolio allocation | Optimized land split across multiple crops, farmer-editable |
| Crop lifecycle calendar | Stage-by-stage crop-care timeline with alerts |
| Notifications | Irrigation, weather, disease, and price alerts |
| AI crop assistant | Contextual chatbot using farm/crop/weather/stage data |
| Admin dashboard | Dataset, API, and recommendation-quality monitoring |

---

## 6. Farmer Workflow (Summary)

```
Register/Login (OTP)
    → Mark farm on map (pin/polygon)
    → Confirm area, divide land (optional)
    → Set preferences (risk, water, investment, excluded crops)
    → System analyzes region: weather, market, MSP, trade demand
    → AI generates ranked multi-crop portfolio recommendation
    → Farmer reviews, edits allocation, accepts plan
    → System generates crop lifecycle calendar + notifications
    → Farmer receives ongoing alerts and can query AI assistant
    → At harvest, farmer logs actual results (feeds back into model)
```

See `PROJECT_STRUCTURE.md` for the technical breakdown of each step.

---

## 7. Architecture Overview

```
Google Maps API ──► Farm Boundary Service
                              │
Weather/Climate API ──┐       │
Market/MSP Data ───────┼──► Data Integration Layer ──► Recommendation
Trade Data (FAOSTAT) ──┘       (cleaning, caching,        & Optimization
Crop Database ─────────────►   normalization)              Engine
                                                                │
                                                                ▼
                                                     Farmer Dashboard / App
                                                                │
                                                                ▼
                                                     Notifications + AI Assistant
```

Full architecture and module breakdown: see `PROJECT_STRUCTURE.md`.
Full technology rationale: see `TECHNOLOGY_STACK.md`.
Full requirements specification: see `SRS.md`.

---

## 8. AI/ML Functionality

- **Phase 1 (MVP)**: Transparent rule-based / weighted scoring model combining
  weather suitability, market opportunity, MSP safety, and cost into an explainable
  0–100 crop score. No black-box ML in the critical recommendation path at this stage.
- **Phase 2**: Statistical/ML models for yield prediction and price forecasting, layered
  on top of the rule-based scores.
- **Phase 3**: Portfolio-optimization algorithms (linear/constraint programming) for
  land allocation, plus an LLM-based conversational assistant for farmer queries.

Every recommendation includes an explanation: which data was used, what was assumed,
and a confidence indicator. See SRS §22–26 for details.

---

## 9. Data Sources (Summary)

| Data | Example Source | Type |
|---|---|---|
| Land geocoding & maps | Google Maps Platform | Live, paid (free tier available) |
| Weather / climate | IMD, Open-Meteo, NASA POWER | Live, free/public |
| MSP | data.gov.in / Dept. of Agriculture & Farmers Welfare | Periodic, official |
| Mandi prices | Agmarknet, e-NAM | Daily, official |
| International trade demand | FAOSTAT, UN Comtrade | Monthly/annual, free |
| Soil data | Soil Health Card (data.gov.in) | Periodic, official |
| Crop agronomic data | ICAR, state agri-university datasets | Static/curated |

Full source-by-source detail, update frequency, and fallback strategy: see `SRS.md` §18–21.

---

## 10. Installation (Local Development)

### Prerequisites

- Node.js ≥ 18, Python ≥ 3.10
- PostgreSQL ≥ 14 with PostGIS extension
- Redis ≥ 6
- Docker & Docker Compose (recommended)

### Steps

```bash
git clone <repo-url>
cd smart-farm-platform

# Copy and fill environment variables
cp .env.example .env

# Start dependencies (Postgres, Redis)
docker compose up -d db redis

# Backend
cd backend
npm install
npm run migrate
npm run dev

# Frontend
cd ../frontend
npm install
npm run dev

# ML service (optional in MVP)
cd ../ml
pip install -r requirements.txt --break-system-packages
python serve.py
```

---

## 11. Environment Variables (Key Ones)

```env
# Maps
GOOGLE_MAPS_API_KEY=

# Weather
WEATHER_API_KEY=

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/agriprofit
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=
OTP_PROVIDER_API_KEY=

# AI Assistant
LLM_API_KEY=
```

All keys are kept server-side only; see Security section below and `SRS.md` §31.

---

## 12. API Overview

See `PROJECT_STRUCTURE.md` §API Structure and `SRS.md` §16 for the full REST API
reference. Core endpoint groups: `/api/auth`, `/api/farms`, `/api/weather`,
`/api/markets`, `/api/msp`, `/api/crops`, `/api/recommendations`, `/api/farm-plans`,
`/api/notifications`, `/api/assistant`.

---

## 13. Database

PostgreSQL + PostGIS for geospatial farm boundary storage. Full schema and entity
relationships: see `PROJECT_STRUCTURE.md` §Database Architecture.

---

## 14. Deployment

- Containerized via Docker; orchestrated with Docker Compose (small scale) or
  Kubernetes (larger scale).
- CI/CD via GitHub Actions: lint → test → build → deploy.
- Cloud-agnostic design; reference deployment target is AWS (ECS/RDS/ElastiCache) or
  equivalent GCP/Azure services.

Details: `TECHNOLOGY_STACK.md` §Deployment.

---

## 15. Security

- JWT-based authentication, OTP for farmer login.
- All third-party API keys stored server-side, never exposed to frontend.
- Role-based access control (farmer / FPO admin / platform admin).
- HTTPS everywhere, encrypted credentials at rest, rate-limited public APIs, audit
  logging for admin actions.

Full detail: `SRS.md` §31–32.

---

## 16. Future Roadmap

- Satellite-based crop health monitoring (NDVI)
- IoT/soil-sensor integration
- Image-based pest/disease detection
- Loan and crop-insurance recommendation module
- Direct FPO/e-NAM market-linkage integration
- Multi-language voice interface

---

## 17. Limitations

- Recommendations are **estimates**, not guarantees — actual yield, prices, and MSP
  procurement depend on real-world conditions outside the platform's control.
- Some government data sources are not real-time APIs and may require scheduled
  batch ingestion; freshness varies by source.
- Weather and price forecasts carry inherent uncertainty, especially beyond ~90 days.
- The platform does not currently facilitate the actual sale/export of produce; it only
  provides market-demand and price signals.

---

## 18. Disclaimer

AgriProfit is a **decision-support tool**, not a financial or agronomic guarantee. It
does not guarantee crop prices, yields, profit, or MSP procurement. Farmers should use
the platform's output alongside local agricultural extension advice and their own
judgment. All financial figures shown are estimates based on available data and
explicitly labeled as such.

---

## 19. License

To be determined by the team (e.g., MIT for the codebase; verify licensing terms of
each third-party dataset/API individually before production use).
