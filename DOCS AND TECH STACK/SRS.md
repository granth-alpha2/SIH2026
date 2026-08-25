# SRS.md — Software Requirements Specification

## AgriProfit: AI-Powered Smart Crop & Farm Profit Optimization Platform

Version 1.0 (Draft)

---

## 1. Introduction

This document specifies the functional and non-functional requirements for
AgriProfit, a platform that helps farmers decide what to grow, where, when, and how
to manage it, with the objective of maximizing expected profit and financial
stability while controlling risk.

## 2. Purpose

To provide a complete, implementable specification that development teams can use as
the foundation for building the platform, and that evaluators (e.g., hackathon judges)
can use to assess technical completeness and feasibility.

## 3. Scope

The system covers: farmer onboarding, farm boundary mapping, land division, regional
agricultural data analysis, crop recommendation and profit simulation, multi-crop land
allocation, crop lifecycle guidance, notifications, an AI assistant, and an admin
dashboard for data/system monitoring. It does not cover direct produce sale/export
execution, payment processing, or physical logistics — these are explicitly out of
scope for v1.

## 4. Problem Statement

See `README.md` §2. In summary: farmers lack a single, data-driven tool combining
land-specific climate, market, MSP, and trade-demand data to guide crop and land-use
decisions, leading to avoidable financial risk.

## 5. Product Vision

Every farmer, regardless of technical literacy, can mark their land on a map and
receive an explainable, risk-aware, multi-crop plan that maximizes expected profit and
reduces the chance and impact of significant loss.

## 6. Objectives

1. Provide accurate, farm-specific land and regional data via mapping and geospatial
   tools.
2. Integrate live/near-live climate, market, MSP, and international trade data.
3. Generate explainable, risk-adjusted crop recommendations and multi-crop land
   allocations.
4. Provide full profit simulation (revenue, cost, profit, ROI, break-even) per crop
   and per farm.
5. Guide farmers through the full crop lifecycle with actionable, timely notifications.
6. Support informed decision-making without overstating certainty of any prediction.

## 7. Stakeholders

- Farmers (primary end users)
- FPOs / cooperative admins
- Government agricultural departments (data consumers/partners)
- Platform administrators / data engineers
- Development team

## 8. User Types

| Role | Description | Access |
|---|---|---|
| Farmer | Primary user, manages own farms and plans | Own data only |
| FPO Admin | Manages multiple farmers' data on their behalf | Assigned farmers only |
| Platform Admin | Manages datasets, APIs, system health | Full system access |

## 9. Functional Requirements

### 9.1 Authentication
- FR-1: System shall allow registration/login via mobile number + OTP.
- FR-2: System shall support Hindi, English, and extensible regional languages.

### 9.2 Farm Setup
- FR-3: System shall allow farm location selection via current GPS location or manual
  map search.
- FR-4: System shall allow drawing/editing a polygon boundary and shall auto-calculate
  area.
- FR-5: System shall store farm boundary, area, and derived administrative region
  (state/district).
- FR-6: System shall allow dividing farm area into 1–N sections, equally or by custom
  percentage/area, editable by the farmer.

### 9.3 Regional Analysis
- FR-7: System shall retrieve and display region-specific soil, climate, and historical
  yield data where available.
- FR-8: System shall retrieve mandi price data, MSP, and nearby procurement center
  information for the farm's region.

### 9.4 Climate Analysis
- FR-9: System shall analyze approximately the next 90 days of forecast climate data
  for the farm's location.
- FR-10: System shall compute a 0–100 Weather Suitability Score per candidate crop and
  provide a human-readable explanation.

### 9.5 Crop Discovery & Scoring
- FR-11: System shall maintain a crop database with agronomic and economic attributes
  (see §14 data model).
- FR-12: System shall compute, per candidate crop: Profit Score, Weather Score, Market
  Score, Risk Score, MSP Safety Score, Demand Score, and a combined Overall Score.

### 9.6 Market & MSP Analysis
- FR-13: System shall analyze historical price trends (1/3/6/12 months, where data
  available) and compute price volatility.
- FR-14: System shall compute an Expected Harvest Price estimate per crop.
- FR-15: System shall retrieve official MSP per applicable crop and compute a
  Price-Safety indicator (Expected Price vs. MSP), with a clear disclaimer that MSP
  procurement is not guaranteed.

### 9.7 International Trade Data
- FR-16: System shall retrieve international trade/demand indicators per crop from
  public datasets and factor them into the Demand Score, clearly labeled as a directional
  signal, not an export guarantee.

### 9.8 Profit Calculation
- FR-17: System shall calculate, per crop and per section: Expected Yield, Expected
  Revenue, Estimated Cost (seeds, fertilizer, pesticide, labor, irrigation, machinery,
  fuel, transport, storage, misc.), Expected Profit, ROI, Break-even Price, and
  Break-even Yield.
- FR-18: System shall aggregate profit/cost/revenue across all sections into a total
  farm-level summary.

### 9.9 Multi-Crop Allocation
- FR-19: System shall recommend a land allocation across multiple crops (not a single
  crop) based on combined score, farmer preferences, and constraints.
- FR-20: System shall allow the farmer to manually edit the recommended allocation
  and re-run profit calculations accordingly.

### 9.10 Preferences & Constraints
- FR-21: System shall allow farmers to specify risk preference, water availability,
  investment capacity, labor availability, preferred number of crops, and specific
  crops to exclude, and shall respect these as hard/soft constraints in the
  recommendation.

### 9.11 Crop Lifecycle
- FR-22: System shall generate a stage-by-stage lifecycle timeline for each selected
  crop, including sowing, growth stages, irrigation/fertilizer guidance, and harvest
  window.

### 9.12 Notifications
- FR-23: System shall generate notifications for irrigation timing, weather risk,
  disease risk, harvest approach, and notable price movements, based only on available
  data (not presented as certain fact).

### 9.13 AI Assistant
- FR-24: System shall provide a chat interface where farmers can ask crop-specific
  questions, with responses contextualized to the farmer's farm, crop, stage, and
  recent weather; shall support optional image upload for visual issue description.
- FR-25: System shall clearly distinguish AI-generated guidance from professional
  agricultural advice.

### 9.14 Explainability
- FR-26: Every recommendation shall include a plain-language explanation of the score
  components, data used, assumptions made, and a confidence indicator.

### 9.15 Admin
- FR-27: System shall provide an admin dashboard for monitoring dataset freshness,
  API health, recommendation statistics, and error logs.

### 9.16 History & Feedback
- FR-28: System shall allow farmers to log actual harvest results (yield, sale price),
  and this data shall be available for future model improvement (Phase 2+).

## 10. Non-Functional Requirements

See §28–30 below for full detail (performance, scalability, availability,
reliability, maintainability, accessibility).

## 11. System Architecture

See `PROJECT_STRUCTURE.md` §1–7 for the full architecture diagrams and module
breakdown. Summary: Frontend (Next.js) → Backend API (Node) → Data Integration Layer
→ External APIs (Maps, Weather, Market, MSP, Trade) + ML/Optimization Service
(Python) → PostgreSQL/PostGIS + Redis.

## 12. User Workflows

See `README.md` §6 for the primary farmer workflow, and `PROJECT_STRUCTURE.md` §9 for
the backend recommendation flow.

## 13. Use Cases

### UC-1: Mark Farm Boundary
- **Actor**: Farmer
- **Precondition**: Logged in
- **Flow**: Farmer selects "Add Farm" → chooses current location or manual search →
  drops pin or draws polygon → system calculates area → farmer confirms → farm saved.
- **Postcondition**: Farm record created with boundary, area, region.

### UC-2: Generate Crop Recommendation
- **Actor**: Farmer
- **Precondition**: Farm exists with boundary and preferences set
- **Flow**: Farmer requests recommendation → system gathers weather/market/MSP/trade
  data → scoring + optimization run → ranked multi-crop plan with profit breakdown
  returned.
- **Postcondition**: Recommendation stored; farmer can accept or modify.

### UC-3: Modify Land Allocation
- **Actor**: Farmer
- **Flow**: Farmer adjusts section-to-crop assignment or area split on the dashboard →
  system recalculates profit/risk in real time.

### UC-4: Ask AI Assistant
- **Actor**: Farmer
- **Flow**: Farmer opens chat → asks a question (optionally with an image) → system
  passes farm/crop/stage context + query to the LLM → contextual answer returned with
  an "AI guidance, not professional advice" label.

### UC-5: Receive Notification
- **Actor**: System (automated) → Farmer
- **Flow**: Scheduled job detects a relevant condition (e.g., rain forecast, price
  spike) → notification generated and pushed to farmer.

### UC-6: Admin Monitors Data Health
- **Actor**: Platform Admin
- **Flow**: Admin opens dashboard → views API/data-source status → investigates any
  flagged staleness or failure.

## 14. Functional Modules

Auth, Farm Management, Regional Data Aggregation, Climate Analysis, Crop Database,
Market/MSP Analysis, Trade Data Analysis, Profit Engine, Risk Scoring, Optimization/
Allocation Engine, Crop Lifecycle, Notifications, AI Assistant, Admin/Monitoring.

## 15. Database Requirements

### Key Entities and Fields (abridged; full DDL to be defined during implementation)

**Users**: id (PK), phone, name, role, language_pref, created_at

**Farmers**: id (PK), user_id (FK→Users), state, district

**Farms**: id (PK), farmer_id (FK→Farmers), name, area_acres, region_state,
region_district, created_at

**FarmBoundaries**: id (PK), farm_id (FK→Farms), polygon (PostGIS geometry),
centroid_lat, centroid_lng, elevation

**LandSections**: id (PK), farm_id (FK→Farms), area_acres, percentage,
current_crop_id (FK→Crops, nullable)

**Crops**: id (PK), name, category, sowing_period, harvest_period,
duration_days, temp_min, temp_max, rainfall_min, rainfall_max, soil_types,
water_requirement, typical_cost_per_acre, msp_applicable (bool)

**CropRequirements**: id (PK), crop_id (FK→Crops), stage_name, stage_order,
duration_days, irrigation_guidance, fertilizer_guidance, pest_risk_notes

**CropPrices**: id (PK), crop_id (FK→Crops), region, price, unit, source,
recorded_at

**MSPRecords**: id (PK), crop_id (FK→Crops), season, msp_value, effective_date,
source_reference

**WeatherData**: id (PK), region/lat_lng, date, temp_min, temp_max, rainfall,
humidity, source, fetched_at

**MarketData**: id (PK), crop_id (FK→Crops), mandi_name, region, price,
recorded_at

**TradeData**: id (PK), crop_id (FK→Crops), country, export_volume,
import_volume, year, source

**CropRecommendations**: id (PK), farm_id (FK→Farms), generated_at,
input_snapshot (JSON), result_snapshot (JSON), overall_confidence

**CropAllocations**: id (PK), recommendation_id (FK), land_section_id (FK),
crop_id (FK), area_acres, expected_revenue, expected_cost, expected_profit, roi

**CropLifecycle**: id (PK), allocation_id (FK→CropAllocations), stage_name,
start_date, end_date, status

**FarmActivities**: id (PK), allocation_id (FK), activity_type, scheduled_date,
completed (bool)

**Notifications**: id (PK), farmer_id (FK), type, message, created_at, read (bool)

**Expenses**: id (PK), allocation_id (FK), category, amount, recorded_at

**HarvestRecords**: id (PK), allocation_id (FK), actual_yield, harvest_date

**Sales**: id (PK), harvest_record_id (FK), sale_price, quantity, buyer_type,
sale_date

**UserPreferences**: id (PK), farmer_id (FK), risk_preference, water_availability,
investment_capacity, labor_availability, preferred_crop_count, excluded_crops (array)

### Relationships
- Farmer 1—N Farms; Farm 1—1 FarmBoundary; Farm 1—N LandSections
- Farm 1—N CropRecommendations; CropRecommendation 1—N CropAllocations
- CropAllocation 1—N CropLifecycle stages, 1—N FarmActivities, 1—N Expenses
- CropAllocation 1—1 HarvestRecord (post-harvest); HarvestRecord 1—N Sales

### Indexing
- Geospatial index (GiST) on `FarmBoundaries.polygon`
- Composite index on `(crop_id, region, recorded_at)` for MarketData/WeatherData
  time-series queries
- Index on `Notifications(farmer_id, read)` for fast unread-count queries

## 16. API Requirements

### Representative Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/verify-otp

POST   /api/farms
GET    /api/farms/:id
PUT    /api/farms/:id
DELETE /api/farms/:id
POST   /api/farms/:id/boundary
GET    /api/farms/:id/area
POST   /api/farms/:id/sections

GET    /api/weather/:farmId
GET    /api/markets/:crop?region=
GET    /api/msp/:crop
GET    /api/crops
GET    /api/crops/:id/lifecycle

POST   /api/recommendations           { farmId, preferences }
GET    /api/recommendations/:farmId

POST   /api/farm-plans                { recommendationId, allocationEdits }
GET    /api/farm-plans/:id

GET    /api/notifications
POST   /api/assistant/chat            { farmId, message, imageUrl? }

GET    /api/admin/data-health
GET    /api/admin/recommendation-stats
```

For each endpoint: standard JWT bearer auth (except `/auth/*`), JSON request/response,
input validation via schema (e.g., Zod/Joi or Pydantic), and standardized error
response shape: `{ error: { code, message } }`.

## 17. GIS Requirements

- Store all farm boundaries as PostGIS `POLYGON` geometries in WGS84 (SRID 4326).
- Support area calculation server-side (as a source of truth) in addition to
  client-side Google Maps Geometry calculation, to guard against client tampering.
- Support spatial queries: "which farms fall within district X", "nearest procurement
  center to farm centroid."

## 18. Weather Requirements

- Data required: daily min/max temperature, rainfall, humidity, and where available,
  extreme-event forecasts (heatwave, cold wave, heavy rainfall/storm).
- Source: IMD (preferred, official); Open-Meteo and NASA POWER as free fallback/
  supplementary sources.
- Update frequency: at least every 12 hours.
- Fallback: serve last cached forecast, flagged as potentially stale, if all sources
  fail.

## 19. Market Data Requirements

- Data required: daily/weekly mandi price per crop per region.
- Source: Agmarknet, e-NAM.
- Update frequency: daily where source permits; may require scheduled scraping if no
  clean API is available — to be validated during implementation.
- Fallback: 7/30-day moving average from cached data.

## 20. MSP Requirements

- Data required: current MSP value per applicable crop, effective season/date.
- Source: Ministry of Agriculture & Farmers Welfare / data.gov.in.
- Update frequency: per official government announcement (typically seasonal); system
  shall periodically check for updates rather than assume a fixed refresh interval.
- MSP shall always be labeled as "official/verified" data in the UI.

## 21. International Trade Data Requirements

- Data required: export/import volumes and trends per crop, by country/region.
- Source: FAOSTAT, UN Comtrade.
- Update frequency: monthly/annual (source-dependent); used only as a directional
  demand signal in the Demand Score, never as a live price feed or export guarantee.

## 22. AI/ML Requirements

- Phase 1: deterministic, explainable weighted-scoring model (no black-box ML in the
  core recommendation path).
- Phase 2: statistical/ML yield and price prediction models, evaluated against
  historical held-out data before being used to influence scores.
- All ML-derived figures shall be labeled "AI prediction" and distinguished from
  "verified" or "estimated" (non-ML) data per §25/27.

## 23. Recommendation Engine

Combines Weather Score, Market Score, MSP Safety Score, Demand Score, Profit Score,
and Risk Score into an Overall Score (0–100) via a configurable weighted formula
(weights tunable per region/season based on observed outcomes in Phase 2+). Every
score is accompanied by the underlying factor breakdown for explainability (FR-26).

## 24. Crop Allocation Algorithm

Phase 1: greedy/weighted allocation — top-scoring crops assigned land proportional to
score, capped by farmer's preferred number of crops and constraints. Phase 3: formal
linear/constraint programming (objective and constraints as specified in the master
prompt §13), implemented via PuLP or OR-Tools, to jointly maximize expected profit and
minimize risk subject to water, budget, labor, and crop-count constraints.

## 25. Profit Calculation

As specified in FR-17/FR-18. Formulas:

```
Expected Revenue = Expected Yield × Expected Selling Price
Expected Profit  = Expected Revenue − Total Estimated Cost
ROI (%)          = (Expected Profit / Total Estimated Cost) × 100
Break-even Price = Total Estimated Cost / Expected Yield
Break-even Yield = Total Estimated Cost / Expected Selling Price
```

## 26. Risk Analysis

Risk Score composed of: weather risk (variance/extreme-event probability), price
volatility (historical std. deviation), disease/pest risk (crop-specific historical
incidence), input-cost volatility, and market/procurement-availability risk. Higher
composite risk reduces the Overall Score even if raw expected profit is high, per the
"risk-adjusted, not maximum raw profit" product principle.

## 27. Crop Lifecycle Management

Each crop's lifecycle is broken into ordered stages (e.g., land prep, sowing,
germination, vegetative growth, flowering, maturity, harvest) with per-stage guidance
on irrigation, fertilizer, pest/disease monitoring, and expected development
indicators, driven by `CropRequirements` data (§15).

## 28. Notification System

Rule-based triggers (Phase 1) evaluated by scheduled jobs against current weather,
crop stage, and price data; each notification references the specific data point that
triggered it and avoids presenting forecasts as certainties (e.g., "rain is expected,"
not "it will rain").

## 29. AI Assistant

Implemented as an LLM API integration with structured context injection (farm
location, current crop, crop stage, recent weather, recent notifications) per request.
Supports optional image upload for visual crop-issue description (routed to a
vision-capable model call). All responses carry a persistent "AI guidance, not a
substitute for professional agricultural advice" notice in the UI.

## 30. Admin Dashboard

Provides: farmer/farm counts, crop distribution, dataset freshness per source, API
error rates, recommendation-generation latency, and (Phase 2+) recommendation
accuracy vs. logged actual harvest results.

## 31. Security Requirements

- JWT-based auth with short-lived access tokens and rotated refresh tokens.
- OTP-based login (no farmer passwords).
- RBAC across farmer / FPO admin / platform admin roles.
- All external API keys (Maps, Weather, MSP, Trade, LLM) stored server-side only,
  injected via environment variables, never exposed in frontend bundles or client
  requests.
- Input validation on every API endpoint; parameterized queries only (no raw SQL
  string concatenation).
- Rate limiting on public-facing endpoints (especially OTP request and AI assistant
  endpoints, to prevent abuse/cost overrun).
- HTTPS enforced everywhere; database credentials and secrets stored in a secrets
  manager, not in source control.
- Audit logging for all admin actions (data edits, user role changes).

## 32. Privacy Requirements

- Farmer personal data (phone number, farm location) treated as sensitive; access
  restricted to the farmer, their explicitly linked FPO admin (if any), and platform
  admins.
- Analytics (§30, §36) use aggregated/anonymized data wherever farmer-level detail is
  not required.
- Farmers shall be able to request deletion of their account and associated data,
  subject to applicable legal/record-keeping requirements.

## 33. Performance Requirements

- Dashboard initial load: target < 3 seconds on a typical 4G connection.
- Map interactions (pan/zoom/pin-drop): target < 100ms input-to-render latency.
- Recommendation generation: target response within 5–10 seconds (including external
  API calls); long-running cases handled asynchronously with a "generating your plan"
  state rather than blocking the UI.

## 34. Scalability Requirements

Architecture shall support scaling from pilot (hundreds of farmers) to 10,000+ and
eventually 100,000+ farmers primarily via: stateless backend instances behind a load
balancer, read replicas for PostgreSQL, Redis caching of external API responses to
reduce per-request external calls, and horizontal scaling of the ML/optimization
service independently of the main API.

## 35. Availability Requirements

Target 99.5% uptime for the core API and dashboard in production (excluding planned
maintenance windows), with graceful degradation (see §36) rather than full outage when
a single external data source fails.

## 36. Error Handling

External API failures (Maps, Weather, Market, MSP, Trade, LLM) shall not crash core
functionality. Each integration implements: timeout + retry with backoff, circuit
breaker to avoid repeated calls to a failing source, and fallback to cached data with
a visible "data may be outdated" indicator to the farmer where relevant.

## 37. Logging and Monitoring

Structured logging (request ID, user ID where applicable, external API call outcomes)
centralized for search/alerting. Monitoring dashboards (Prometheus/Grafana or managed
equivalent) track API latency, error rates, job queue health, and external data source
freshness, feeding the admin dashboard described in §30.

## 38. Testing Requirements

- Unit tests for all scoring, profit-calculation, and allocation logic (pure
  functions, high coverage target).
- Integration tests for each external API adapter, including simulated failure
  scenarios.
- End-to-end tests for the critical farmer flow: register → mark farm → set
  preferences → get recommendation → accept plan.
- Regression tests before any change to the scoring/allocation weighting logic, given
  its direct impact on farmer-facing recommendations.

## 39. Deployment Requirements

Containerized services (frontend, backend, ML service, workers) deployed via CI/CD
(lint → test → build → deploy to staging → manual promotion to production), as
detailed in `TECHNOLOGY_STACK.md` §11 and `PROJECT_STRUCTURE.md` §10.

## 40. Future Enhancements

Satellite-based crop health (NDVI) monitoring, IoT/soil sensor integration,
image-based pest/disease detection, crop-insurance and loan recommendations, direct
e-NAM/FPO market-linkage integration, multi-language voice interface, reinforcement-
learning-based dynamic recommendations (only if justified by data volume/complexity).

## 41. Assumptions

- Farmers have access to a basic smartphone with internet connectivity, at least
  intermittently.
- Government data sources (MSP, Agmarknet) remain publicly accessible in their current
  form; any access changes will require pipeline updates.
- Google Maps API usage remains within a cost envelope acceptable for the target user
  base, or an alternative provider is substituted if not.

## 42. Constraints

- Reliance on third-party data sources whose update frequency and API availability
  are outside the platform's control.
- Regional/hyperlocal weather and price data may be approximated at district level
  where farm-exact data is unavailable.
- Budget and infrastructure constraints of a hackathon/early-stage MVP limit initial
  scale and the sophistication of Phase 1 ML.

## 43. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Government API/data source becomes unavailable or changes format | High | Modular integration adapters; cached fallback data |
| Farmer over-trusts predictions as guarantees | High | Explicit disclaimers, confidence indicators, "estimate" labeling throughout UI |
| Google Maps costs scale poorly with user growth | Medium | Usage monitoring; abstracted maps module allows provider swap |
| Low-quality or sparse regional data leads to poor recommendations | Medium | Confidence scoring; flag low-data regions explicitly |
| Farmer data privacy breach | High | RBAC, encryption, audit logging, minimal data retention |

## 44. Limitations

See `README.md` §17. The system cannot guarantee real-world outcomes and does not
currently handle produce sale/export execution.

## 45. Agricultural/Financial Disclaimers

All yield, price, revenue, cost, profit, and ROI figures presented by the system are
**estimates** derived from available data and modeling assumptions. They are not
guarantees of actual outcomes. MSP figures are official but procurement is subject to
government rules, eligibility, and local conditions outside the platform's control.
Farmers should consult local agricultural extension services and use their own
judgment alongside the platform's output.

## 46. Acceptance Criteria (MVP)

- [ ] Farmer can register/login via OTP.
- [ ] Farmer can mark a farm boundary on the map and see auto-calculated area.
- [ ] Farmer can divide land into sections.
- [ ] Farmer can set preferences (risk, water, investment, excluded crops).
- [ ] System returns a multi-crop recommendation with per-crop score breakdown and
      explanation.
- [ ] System displays full profit breakdown (revenue, cost, profit, ROI) per crop and
      per farm total.
- [ ] Farmer can edit the recommended allocation and see profit figures update.
- [ ] Farmer can view a crop lifecycle timeline for each selected crop.
- [ ] Farmer receives at least one type of automated notification (e.g., irrigation
      reminder) based on real data.
- [ ] Farmer can ask the AI assistant a question and receive a contextual response
      labeled as AI guidance.
- [ ] Admin can view basic data-source health status.
- [ ] All monetary/yield figures in the UI are visibly labeled as estimates.
