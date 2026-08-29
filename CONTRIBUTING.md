# Contributing to AgriProfit

Thank you for contributing to **AgriProfit — AI-Powered Smart Crop & Farm Profit Optimization Platform**.

---

## 1. Development Workflow

1. Fork and clone the repository.
2. Install dependencies in `frontend`:
   ```bash
   cd frontend
   npm install
   ```
3. Run local development server:
   ```bash
   npm run dev
   ```

---

## 2. Code Quality & Standards

Before submitting a Pull Request, verify:
- **TypeScript:** `npx tsc --noEmit` passes with 0 errors.
- **ESLint:** `npm run lint` passes with 0 errors/warnings.
- **Automated Tests:** All 6 test suites pass:
  ```bash
  npx tsx ../scripts/test_auth.ts
  npx tsx ../scripts/test_preferences_crops_weather.ts
  npx tsx ../scripts/test_market_recommendations_simulation.ts
  npx tsx ../scripts/test_portfolio_dashboard_planner.ts
  npx tsx ../scripts/test_notifications_assistant.ts
  npx tsx ../scripts/test_admin_and_health.ts
  python ../scripts/validate_data.py
  ```
- **Build:** `npm run build` generates all routes cleanly.

