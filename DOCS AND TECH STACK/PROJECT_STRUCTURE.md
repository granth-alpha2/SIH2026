# PROJECT_STRUCTURE.md — AgriProfit

Complete technical breakdown of the codebase layout and module architecture.

---

## 1. Top-Level Directory Structure

```
smart-farm-platform/
│
├── frontend/                  # React/Next.js farmer-facing web + PWA app
│   ├── components/            # Reusable UI components (buttons, cards, forms)
│   ├── pages/                 # Route-level pages (login, dashboard, farm-map...)
│   ├── layouts/                # Page shells (mobile-first layout, admin layout)
│   ├── hooks/                  # Custom React hooks (useFarm, useRecommendation)
│   ├── services/                # API client wrappers (axios/fetch instances)
│   ├── maps/                    # Google Maps components (pin drop, polygon draw)
│   ├── dashboard/                # Farm plan, profit breakdown, lifecycle views
│   └── i18n/                      # Hindi/English/regional language files
│
├── backend/                    # Core application API server
│   ├── controllers/             # HTTP request handlers
│   ├── services/                  # Business logic (recommendation, profit calc)
│   ├── models/                     # ORM models / entities
│   ├── repositories/                # Data access layer (DB queries)
│   ├── routes/                       # Express/FastAPI route definitions
│   ├── middleware/                    # Auth, validation, rate-limiting, logging
│   ├── integrations/                   # External API clients (Maps, Weather, MSP, Trade)
│   └── utils/                           # Shared helpers (geo calc, formatting)
│
├── ml/                          # Machine learning & optimization service
│   ├── datasets/                  # Cached/raw datasets for training
│   ├── preprocessing/              # Data cleaning & feature engineering
│   ├── models/                      # Trained model artifacts
│   ├── training/                     # Training scripts/notebooks
│   ├── prediction/                    # Inference services (yield, price)
│   └── optimization/                   # Land allocation optimization algorithms
│
├── database/                    # Schema & migrations
│   ├── migrations/                 # Versioned schema changes
│   ├── seeds/                       # Seed data (crop database, sample regions)
│   └── schemas/                      # ER diagrams / schema documentation
│
├── data-pipeline/                # Scheduled data ingestion jobs
│   ├── weather/                    # Weather API polling & caching
│   ├── market/                      # Mandi price ingestion (Agmarknet/e-NAM)
│   ├── msp/                          # MSP data ingestion
│   └── trade/                         # FAOSTAT / UN Comtrade batch ingestion
│
├── docs/                          # Documentation
│   ├── README.md
│   ├── SRS.md
│   ├── PROJECT_STRUCTURE.md
│   └── TECHNOLOGY_STACK.md
│
├── tests/                          # Unit, integration, and e2e tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docker/                          # Dockerfiles & compose configs
│   ├── frontend.Dockerfile
│   ├── backend.Dockerfile
│   ├── ml.Dockerfile
│   └── docker-compose.yml
│
└── README.md
```

---

## 2. Frontend Architecture

- **Framework**: Next.js (React + TypeScript) for SSR/SEO on public pages and fast
  client-side navigation on the app dashboard.
- **State management**: React Query for server-state (API data, caching, revalidation);
  local component state via hooks for UI-only state.
- **Maps layer**: A dedicated `maps/` module wraps the Google Maps JavaScript SDK —
  handles pin drop, polygon drawing, area calculation (via the Geometry library), and
  boundary editing, decoupled from the rest of the UI so the maps provider could be
  swapped later if needed.
- **i18n**: All farmer-facing strings routed through an i18n layer (e.g., `next-intl` or
  `react-i18next`) with Hindi and English as launch languages; additional regional
  languages added as translation files without code changes.
- **Design principle**: Mobile-first, large touch targets, icon-heavy, minimal text,
  offline-tolerant caching for previously loaded farm plans (using React Query's cache,
  **not** localStorage/sessionStorage, per platform constraints).

### Key Screens → Component Mapping

| Screen | Primary Components |
|---|---|
| Login/Register | `AuthForm`, `OtpInput` |
| Farm Map | `MapCanvas`, `PolygonDrawTool`, `PinMarker` |
| Land Division | `LandSectionEditor`, `AreaSlider` |
| Preferences | `RiskSelector`, `WaterAvailabilityInput`, `CropExclusionList` |
| Recommendations | `CropScoreCard`, `PortfolioAllocationChart` |
| Farm Plan Dashboard | `ProfitSummary`, `RiskBadge`, `AllocationMapOverlay` |
| Crop Lifecycle | `TimelineStepper`, `StageDetailCard` |
| Notifications | `NotificationFeed` |
| AI Assistant | `ChatWindow`, `ImageUploadForCropIssue` |

---

## 3. Backend Architecture

- **Pattern**: Layered architecture — Controller → Service → Repository — to keep
  business logic (e.g., profit calculation, scoring) independent of HTTP and DB
  concerns, making it testable and reusable by the ML service if needed.
- **Framework choice**: Node.js (NestJS or Express) for the main API; a separate Python
  (FastAPI) microservice for ML/optimization workloads, since Python has the stronger
  ecosystem for that part. The two communicate over internal REST/gRPC.
- **Integrations module**: Each external data source (Maps, Weather, MSP, Market,
  Trade) has its own adapter with a consistent interface (`fetch()`, `normalize()`,
  `cache()`), so a source can be replaced without touching business logic.
- **Background jobs**: Celery (Python) or BullMQ (Node) for scheduled data refresh
  (daily mandi prices, weekly climate updates, monthly trade data).

### Recommendation Flow (Backend)

```
FarmController.requestRecommendation()
    → FarmService.getFarmContext(farmId)
    → WeatherIntegration.getForecast(location, 90d)
    → MarketIntegration.getPrices(region, crops)
    → MSPIntegration.getMSP(crops)
    → TradeIntegration.getDemandSignal(crops)
    → CropRepository.getCandidateCrops(region)
    → ScoringService.score(crop, weather, market, msp, trade, cost)
    → OptimizationService.allocate(scoredCrops, farmArea, preferences)
    → ProfitService.calculate(allocation)
    → RecommendationRepository.save(result)
    → return FarmPlanResponse
```

---

## 4. ML/Optimization Architecture

- **Phase 1**: Deterministic weighted-scoring module (Python) — no trained model
  required; scores computed from normalized inputs (weather suitability 0–100, market
  opportunity 0–100, MSP safety 0–100, risk 0–100) combined via configurable weights.
- **Phase 2**: Scikit-learn/XGBoost models for yield and price prediction, trained on
  historical mandi and yield data, served via a `prediction/` FastAPI endpoint.
- **Phase 3**: Land-allocation optimization using linear/integer programming
  (e.g., PuLP or OR-Tools) to split land across crops subject to constraints (water,
  budget, farmer exclusions, max/min crops).

---

## 5. Database Architecture

PostgreSQL with the PostGIS extension for storing farm boundary polygons and
performing geospatial queries (e.g., "which region does this farm fall into").

### Core Entities (see `SRS.md` §15 for full field-level schema)

```
Users, Farmers, Farms, FarmBoundaries, LandSections,
Crops, CropRequirements, CropPrices, MSPRecords,
WeatherData, MarketData, TradeData,
CropRecommendations, CropAllocations, CropLifecycle,
FarmActivities, Notifications, Expenses,
HarvestRecords, Sales, UserPreferences
```

Relationships follow a standard pattern: `Farmer 1—N Farms`, `Farm 1—N LandSections`,
`LandSection N—1 Crop` (via `CropAllocations`), `Farm 1—N CropRecommendations`
(historical log of every recommendation run, for analytics and model improvement).

---

## 6. Data Pipeline Architecture

Each pipeline in `data-pipeline/` runs as an independent scheduled job:

| Pipeline | Frequency | Source | Failure Handling |
|---|---|---|---|
| Weather | Every 6–12 hrs | IMD / Open-Meteo / NASA POWER | Fallback to last cached value; alert on staleness > 24h |
| Market prices | Daily | Agmarknet / e-NAM | Retry with backoff; fallback to 7-day moving average |
| MSP | On official update (manual trigger + periodic check) | data.gov.in | Never auto-expire; flagged as "official" data |
| Trade data | Monthly | FAOSTAT / UN Comtrade | Batch download; used only as directional signal |

All ingested data is normalized into a common internal schema before reaching the
recommendation engine, so the scoring logic never depends on a specific source's raw
format.

---

## 7. API Structure

Grouped by domain (full request/response contracts in `SRS.md` §16):

```
/api/auth/*            → registration, login, OTP verification
/api/farms/*           → CRUD for farms, boundary, area, land sections
/api/weather/*         → forecast retrieval for a farm/region
/api/markets/*         → price trend retrieval for a crop/region
/api/msp/*             → MSP lookup for a crop
/api/crops/*           → crop database browsing, lifecycle info
/api/recommendations/* → generate/retrieve farm plan recommendations
/api/farm-plans/*      → accepted/active farm plans
/api/notifications/*   → notification feed
/api/assistant/*       → AI chat endpoint
/api/admin/*           → admin dashboard endpoints (dataset/API health)
```

---

## 8. Authentication Flow

```
Farmer enters mobile number
    → OTP sent via provider
    → Farmer enters OTP
    → Backend verifies OTP → issues JWT (access + refresh token)
    → JWT used for all subsequent authenticated requests
    → Refresh token rotated on use; access token short-lived (e.g., 15 min)
```

Admin users authenticate via a separate email/password + MFA flow with
role-based access control (RBAC) distinguishing `farmer`, `fpo_admin`, `platform_admin`.

---

## 9. Recommendation Flow (End-to-End)

```
1. Farmer completes farm setup + preferences
2. Frontend calls POST /api/recommendations
3. Backend gathers context (weather, market, MSP, trade, crop DB)
4. Scoring service computes per-crop scores
5. Optimization service allocates land across top-scoring crops
   respecting farmer constraints (water, budget, excluded crops)
6. Profit service computes revenue/cost/profit/ROI per crop and total
7. Result persisted + returned to frontend with explanation payload
8. Farmer reviews on dashboard, can edit allocation and re-submit
9. On acceptance, a CropLifecycle timeline + Notification schedule is generated
```

---

## 10. Deployment Structure

```
docker-compose.yml
  ├── frontend (Next.js, port 3000)
  ├── backend (Node/NestJS, port 4000)
  ├── ml-service (FastAPI, port 5000)
  ├── db (PostgreSQL + PostGIS, port 5432)
  ├── redis (port 6379)
  └── worker (Celery/BullMQ background jobs)
```

Production deployment mirrors this via managed cloud services (e.g., ECS/Cloud Run for
containers, managed Postgres with PostGIS, managed Redis), fronted by a load balancer
and CDN for static frontend assets. CI/CD pipeline: lint → unit test → build image →
integration test → deploy to staging → manual promote to production.
