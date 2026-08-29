# AgriProfit — AI-Powered Smart Crop & Farm Profit Optimization Platform

> A production-grade decision-support monorepo platform that empowers Indian farmers to decide **what to grow, where to grow it, when to grow it, and how to manage it** by combining spatial PostGIS land mapping, live Open-Meteo agro-meteorology, APMC mandi market trends, Government MSP floor benchmarks, deterministic multi-factor recommendation scoring, interactive profit simulations, Python FastAPI ML yield & price models, and a context-aware multimodal AI agronomist.

---

## 📁 Production Monorepo Architecture

```text
AgriProfit/
├── frontend/                         # Next.js 16 + React + TypeScript App
│   ├── app/                          # App Router pages & API routes
│   ├── components/                   # UI components (FarmMapPicker, RecommendationDashboard)
│   ├── lib/                          # Client services, auth, simulation engines
│   └── public/                       # Static assets, icons, markers
│
├── ml-service/                       # Python 3.11+ / FastAPI ML Microservice
│   ├── app/                          # FastAPI app (routes, models, pipelines, schemas)
│   ├── models_artifacts/             # Serialized models (yield_model.pkl, price_model.pkl)
│   ├── tests/                        # Pytest unit tests for ML models
│   ├── requirements.txt              # ML dependencies
│   └── Dockerfile                    # Container definition
│
├── data/                             # Agricultural Datasets
│   ├── raw/                          # Raw ICAR/Agmarknet/IMD datasets (weather, soil, mandi, MSP)
│   ├── processed/                    # Feature-engineered training data
│   ├── reference/                    # 28-District master, ICAR crop master catalog
│   ├── external/                     # CACP & FAOSTAT benchmarks
│   └── README.md                     # Data dictionary and lineage documentation
│
├── database/                         # PostgreSQL + PostGIS Layer
│   ├── init.sql                      # Main database initialization
│   ├── migrations/                   # Numbered migrations (001_ to 006_)
│   ├── seeds/                        # Initial seed data (crops.sql, msp.sql)
│   ├── SCHEMA.md                     # Database schema specification
│   └── MIGRATION.md                  # Migration instructions
│
├── services/                         # Shared Reusable Domain Services
│   ├── geospatial/                   # Spherical area & boundary calculations
│   ├── weather/                      # Open-Meteo API integration
│   ├── markets/                      # APMC mandi pricing & MSP safety catalog
│   ├── recommendation/               # 4-Part strategic portfolio optimizer
│   └── assistant/                    # Context telemetry & multimodal vision
│
├── tests/                            # Automated Integration Tests
│   ├── integration/                  # End-to-end integration test suites
│   └── fixtures/                     # Test mock payloads and coordinates
│
├── docs/                             # Consolidated Technical Documentation
│   ├── API_DOCUMENTATION.md          # REST API endpoints & payload contracts
│   ├── ARCHITECTURE.md               # System design & data flow architecture
│   ├── ML_ARCHITECTURE.md            # Machine learning pipeline documentation
│   ├── DATABASE.md                   # Relational & spatial database schemas
│   ├── DATA_DICTIONARY.md            # 22-dataset data dictionary
│   ├── DEPLOYMENT.md                 # Docker Compose & cloud deployment guide
│   └── TESTING.md                    # Test execution instructions
│
├── infrastructure/                   # Nginx & Docker configs
│   ├── docker/                       # Dockerfiles for web and ML services
│   └── nginx/                        # Nginx reverse proxy configuration
│
├── .github/workflows/                # GitHub Actions CI/CD pipelines
├── docker-compose.yml                # Multi-service development compose stack
├── docker-compose.prod.yml           # Production container orchestration
└── nginx.conf                        # Root reverse proxy config
```

---

## 🚀 Quick Start (SIH 2026 Judge Demonstration)

### 1. Local Development (Next.js + Python ML)

```bash
# Terminal 1: Start Next.js Frontend
cd frontend
npm install
npm run dev

# Terminal 2: Start Python ML Microservice
python ml-service/app/main.py
```
* **Frontend Application:** **[http://localhost:3000](http://localhost:3000)**
* **ML API Docs & Swagger:** **[http://localhost:8000/docs](http://localhost:8000/docs)**

---

### 2. One-Click SIH Judge Demo Login
1. On the login screen (`/login`), click **"⚡ One-Click SIH Judge / Demo Login"**.
2. Experience the complete 11-step end-to-end workflow:
   - **Step 1:** Authentication (`/login`)
   - **Step 2:** Spatial Farm Mapping with **"📍 Use My Location"** & Area Calculation (`/farms`)
   - **Step 3:** Farmer Preferences & Water Access (`/preferences`)
   - **Step 4:** 7-Day Live Weather & 90-Day Climate Baseline (`/weather`)
   - **Step 5:** APMC Mandi Watch & MSP Floor Protection (`/markets`)
   - **Step 6:** Curated Crop Discovery Database (`/crops`)
   - **Step 7:** ML-Optimized 4-Part Portfolio Recommendations & Financial Simulation (`/recommendations`)
   - **Step 8:** Crop Lifecycle Milestone Timeline (`/crop-plan`)
   - **Step 9:** 5-Category Advisory Notification Inbox (`/notifications`)
   - **Step 10:** Real-Time AI Agronomist & Leaf Disease Vision Scanner (`/assistant`)
   - **Step 11:** Admin & Data Quality Telemetry Center (`/admin`)

---

## 🐳 Docker Production Stack

Launch all services (Nginx + Next.js + FastAPI ML + PostGIS + Redis) in one command:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

---

## 🧪 Automated Testing & Quality Assurance

```bash
# Run all integration test suites
npx --prefix frontend tsx tests/integration/test_farms.ts
npx --prefix frontend tsx tests/integration/test_portfolio.ts
npx --prefix frontend tsx tests/integration/test_markets.ts
npx --prefix frontend tsx tests/integration/test_weather.ts
npx --prefix frontend tsx tests/integration/test_auth.ts

# TypeScript Validation (0 Errors)
npx --prefix frontend tsc --noEmit
```
