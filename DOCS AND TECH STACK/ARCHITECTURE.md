# AgriProfit MVP Production Architecture

## 1. Architecture Decision

The current repository is a small Next.js App Router application with one farm API
route, a PostgreSQL client, and a PostGIS farm migration. The compatible MVP should
keep Next.js as the full-stack application initially:

- Frontend: Next.js App Router, React, and strict TypeScript.
- REST API: Next.js Route Handlers under `frontend/src/app/api`.
- Database: PostgreSQL with PostGIS.
- Persistence: a repository layer using the existing `pg` dependency.
- Cache and jobs: Redis only for external-data caching and scheduled refreshes.
- Recommendation engine: deterministic TypeScript services for the MVP.
- Separate Node or Python services: defer until scale or workload requires extraction.

This preserves the existing stack and avoids adding a second server before the domain
has enough complexity to justify it.

## 2. Folder Structure

```text
SIH2026/
|-- database/
|   |-- migrations/
|   |-- seeds/
|   `-- schemas/
|-- frontend/
|   `-- src/
|       |-- app/
|       |   |-- (public)/login/
|       |   |-- (farmer)/dashboard/
|       |   |-- (farmer)/farms/
|       |   |-- (farmer)/recommendations/
|       |   |-- (farmer)/crop-plan/
|       |   |-- (farmer)/notifications/
|       |   |-- (farmer)/assistant/
|       |   |-- admin/
|       |   `-- api/
|       |       |-- auth/
|       |       |-- farms/
|       |       |-- crops/
|       |       |-- weather/
|       |       |-- markets/
|       |       |-- msp/
|       |       |-- recommendations/
|       |       |-- farm-plans/
|       |       |-- notifications/
|       |       `-- assistant/
|       |-- components/
|       |-- features/
|       |   |-- auth/
|       |   |-- farms/
|       |   |-- recommendations/
|       |   `-- assistant/
|       `-- lib/
|           |-- auth/
|           |-- db/
|           |-- providers/
|           |-- services/
|           |-- types/
|           `-- validation/
```

Route handlers should only handle HTTP concerns. Domain services should contain
business rules, repositories should contain SQL, and provider adapters should hide
external API formats.

## 3. Data Flow

```text
Next.js UI
  -> REST route handler
  -> authentication and request validation
  -> domain service
  -> PostgreSQL/PostGIS and Redis when useful
  -> external provider adapter when required
  -> deterministic scoring/profit/allocation service
  -> persisted response with source and freshness metadata
  -> UI
```

For a recommendation request, the service loads the authenticated farmer's farm and
preferences, obtains normalized crop, weather, market, and MSP data, calculates
transparent scores and financial estimates, applies allocation constraints, persists
the input/result snapshot, and returns explanations, confidence, source, and
`lastUpdated` metadata.

## 4. REST API

Authentication endpoints are public; all other endpoints require an authenticated
session and ownership checks.

```text
POST   /api/auth/request-otp
POST   /api/auth/verify-otp
POST   /api/auth/logout
GET    /api/auth/session

GET    /api/farms
POST   /api/farms
GET    /api/farms/:id
PUT    /api/farms/:id
DELETE /api/farms/:id
POST   /api/farms/:id/sections
PUT    /api/farms/:id/sections/:sectionId
DELETE /api/farms/:id/sections/:sectionId

GET    /api/crops
GET    /api/crops/:id
GET    /api/weather/:farmId
GET    /api/markets/:cropId
GET    /api/msp/:cropId

POST   /api/recommendations
GET    /api/recommendations/:id
POST   /api/farm-plans
GET    /api/farm-plans/:id
PUT    /api/farm-plans/:id/allocation

GET    /api/notifications
PUT    /api/notifications/:id/read
POST   /api/assistant/conversations
GET    /api/assistant/conversations/:id
POST   /api/assistant/conversations/:id/messages
```

Use a consistent error response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The farm boundary is invalid."
  }
}
```

## 5. Database Entities

The MVP schema should contain these related entities:

- `users`: phone, name, role, language preference, timestamps.
- `farms`: owner, name, area, center, PostGIS polygon, timestamps.
- `farm_sections`: farm, crop, area, and percentage.
- `farmer_preferences`: risk, water, investment, preferred/excluded crops, and soil metadata.
- `crops` and `crop_parameters`: crop identity and agronomic/economic parameters.
- `weather_observations` and `weather_forecasts`: normalized weather values and source metadata.
- `market_prices`: crop, market, region, price, date, and source.
- `msp_records`: crop, season, value, effective date, and official source.
- `recommendations`: farm, input snapshot, result snapshot, confidence, and timestamps.
- `crop_allocations`: recommendation, crop, area, revenue, cost, profit, and ROI.
- `farm_plans`: accepted recommendation and status.
- `notifications`: user, related farm/plan, type, message, read state, and timestamps.
- `assistant_conversations` and `assistant_messages`: authorized context, messages, and timestamps.

Farm polygons remain `GEOGRAPHY(POLYGON, 4326)`. PostGIS validates and calculates
the server-side area; client-side map calculations are only immediate feedback.
Foreign keys, ownership indexes, timestamps, and appropriate uniqueness/check
constraints are required.

## 6. Frontend Routes

```text
/                         Public entry or login
/login                    OTP login
/dashboard                Farmer overview
/farms                    Farm list
/farms/new                Farm mapping and setup
/farms/:id                Farm details and preferences
/recommendations          Ranked recommendations
/recommendations/:id      Scores, explanations, and allocation
/crop-plan                Accepted plan and lifecycle timeline
/notifications            In-app notification feed
/assistant                Contextual crop assistant
/admin                    Protected admin dashboard
```

The current dashboard navigation should become route navigation while preserving the
existing visual language.

## 7. Environment Variables

Server-only variables:

```env
DATABASE_URL=
REDIS_URL=
JWT_SECRET=
OTP_PROVIDER_API_KEY=
WEATHER_API_KEY=
MARKET_API_KEY=
MSP_API_KEY=
LLM_API_KEY=
```

Browser-exposed variables:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_API_BASE_URL=
```

The Google Maps key must be restricted by allowed domains, APIs, and quota because it
is required by the browser SDK. JWT, database, OTP, weather, market, MSP, and LLM
secrets must never use the `NEXT_PUBLIC_` prefix. An `.env.example` should contain
names only and no credentials.

## 8. Deployment

For the MVP:

- Deploy the Next.js frontend and Route Handler API to Vercel or one Next.js container.
- Use managed PostgreSQL with PostGIS as the system of record.
- Add managed Redis only when cache or job requirements exist.
- Keep all third-party provider calls server-side.
- Use a scheduled platform job or small worker for data refreshes.

At larger scale, extract the API and worker without changing the frontend contracts:

```text
Vercel frontend -> Node.js API -> PostgreSQL/PostGIS
                              -> Redis
                              -> background worker
                              -> optional Python ML service
```

The first implementation order should be database and authentication foundations,
then farm ownership and preferences, then crop/profit/recommendation services, then
provider integrations, plans, notifications, assistant, and finally admin and
production operations.