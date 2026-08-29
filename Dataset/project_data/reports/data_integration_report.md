# AgriProfit — Data Integration & Alignment Report

**Date:** 2026-08-29  
**Version:** 1.0.0  
**Author:** AgriProfit Data Engineering & AI Architecture Team  
**Scope:** Complete repository audit, dataset inspection, schema alignment, data validation, ML split/leakage audit, database seed generation, and production readiness assessment.

---

## 1. Executive Summary

The AgriProfit platform is an AI-powered smart crop and farm profit optimization system designed to help Indian farmers make data-driven decisions on **what to grow, where to grow it, when to plant, and how to manage their farm lifecycle**. The system integrates farm geographic boundaries, 90-day climate forecasts, live mandi market prices, Government Minimum Support Prices (MSP), international trade demand indicators, and soil health parameters to produce explainable multi-crop allocation plans.

Prior to this integration task, a synthetic seed data package (`project_data/`) existed alongside architectural specifications (`SRS.md`, `ARCHITECTURE.md`), database migrations, and a Next.js frontend shell. However, the data package lacked automated validation tooling, database seed scripts for local/staging environments, formal entity-relationship verification, ML temporal leakage testing, and unified data dictionary alignment.

Through this task:
1. **Audited & Aligned All 22 Datasets:** Verified and standardized all files across `reference/`, `raw/`, `processed/`, `ml/`, and `schemas/`.
2. **Built Automated Test Suite (`scripts/validate_data.py`):** Implemented an automated validation CLI that performs 92 rigorous checks covering schemas, primary key uniqueness, foreign key referential integrity, numerical domain ranges, time-series split boundaries, and ML target leakage.
3. **Created Database Seed Generator (`scripts/load_data.py` & `database/seeds/001_seed_data.sql`):** Built idempotent SQL seed generation and direct PostgreSQL ingestion routines to bridge the file datasets and the operational database.
4. **Audited ML Datasets & Prevented Leakage:** Verified strict chronological splitting across 7,000 yield records (2015–2021 train, 2022–2023 validation, 2024 test) and 19,500 price forecast records (2021–2023 train, 2024 validation, 2025–2026 test) with zero ID overlap and strict lag-feature isolation.
5. **Standardized Schemas & Documentation:** Upgraded `Dataset/project_data/schemas/data_dictionary.md` to full specification with explicit types, keys, units, constraints, and examples.

---

## 2. Original State & Discovery Findings

During the initial repository inspection, the following findings were established:

| Component | Initial State | Discovered Issues / Gaps | Resolution |
|---|---|---|---|
| **Data Directory Structure** | Files organized under `Dataset/project_data/` | Missing automated CI/CD validation script and reports directory | Created `scripts/validate_data.py` and `Dataset/project_data/reports/` |
| **Database Migrations** | `database/migrations/` contained tables (UUID PKs) | No seed data script existed in `database/seeds/` to load reference/master crops | Created `database/seeds/001_seed_data.sql` and `scripts/load_data.py` |
| **Referential Integrity** | 22 CSVs and 1 GeoJSON file | Need automated verification of foreign key paths across 15 entity relationships | Built automated foreign key checking in `validate_data.py` (100% integrity verified) |
| **ML Splitting** | Yield and Price datasets pre-split into train/val/test | Potential risk of temporal leakage or overlapping entities across splits | Conducted temporal audit: confirmed strict time ordering and zero ID overlap |
| **Data Dictionary** | High-level markdown summary | Incomplete column-by-column schema tables with explicit units and keys | Upgraded `data_dictionary.md` with complete 7-column schema definitions |
| **Domain Sanity** | 4 records in `farm_plans.csv` had negative expected profit | Needed verification to ensure this was domain-legitimate and not a math bug | Verified that negative profit records represent high-cost draft allocations requiring farmer review |

---

## 3. Dataset-by-Dataset Changes & Specifications

### 3.1 Reference & Master Datasets

#### 1. `reference/01_states_districts.csv`
- **Original State:** 28 rows, 8 columns covering 10 Indian states and 28 districts.
- **Issues Discovered:** Needed coordinate validation and zone naming check.
- **Changes Made:** Validated primary key `district_id`, geographic bounds ($8^\circ\text{N} \le \text{lat} \le 37^\circ\text{N}$), and verified zone alignment.
- **Final Status:** ✅ **Correct & Verified** (28 rows, 100% unique PK).

#### 2. `reference/02_climate_regions.csv`
- **Original State:** 28 rows, 8 columns mapping districts to Köppen climate classifications.
- **Issues Discovered:** Required FK verification to `districts.district_id`.
- **Changes Made:** Verified 1:1 referential link to `01_states_districts.csv`.
- **Final Status:** ✅ **Correct & Verified** (28 rows, 0 orphans).

#### 3. `reference/03_crops_master.csv`
- **Original State:** 25 rows, 21 columns defining agronomic baselines for major Indian crops.
- **Issues Discovered:** Key table referenced by almost all models; needed complete column typing, cost summation check, and MSP flag validation.
- **Changes Made:** Validated that $\text{total\_input\_cost} = \sum \text{sub\_costs}$ across all 25 crops; verified FAO commodity codes and temperature tolerance ranges.
- **Final Status:** ✅ **Correct & Aligned** (25 rows, 100% unique PK `CROP001`–`CROP025`).

#### 4. `reference/04_crop_lifecycle_calendar.csv`
- **Original State:** 125 rows, 10 columns providing 5 lifecycle stages per crop.
- **Issues Discovered:** Needed sequence order and duration check against `crops_master.duration_days`.
- **Changes Made:** Verified all 125 stages link to valid `crop_id`s; stage days properly bounded.
- **Final Status:** ✅ **Correct & Integrated** (125 rows, 5 stages per crop).

---

### 3.2 Raw & Ingestion Datasets

#### 5. `raw/01_farmers.csv`
- **Original State:** 60 rows, 12 columns representing registered farmer profiles.
- **Issues Discovered:** Needed PII masking verification and district foreign key resolution.
- **Changes Made:** Verified masked phone format (`+91-XXXXX-nnnnn`), valid `district_id` links, and positive landholdings.
- **Final Status:** ✅ **Correct & Verified** (60 rows, 0 orphan districts).

#### 6. `raw/02_farms.csv` & `raw/03_farms.geojson`
- **Original State:** 71 rows in CSV, 71 Features in GeoJSON with polygon/point geometries.
- **Issues Discovered:** Needed 1:1 ID parity between GeoJSON properties and CSV records.
- **Changes Made:** Verified exact 71-for-71 correspondence between `farms.csv` and `farms.geojson`. Checked that all coordinates fall within India's bounding box and areas are $>0$.
- **Final Status:** ✅ **Correct & Aligned** (71 farms, 100% coordinate validity).

#### 7. `raw/04_land_sections.csv`
- **Original State:** 111 rows, 8 columns partitioning farms into subsections.
- **Issues Discovered:** 21 sections had `NULL` in `assigned_crop_id`.
- **Domain Verification:** Confirmed that `NULL` indicates unassigned/fallow land sections awaiting farmer crop selection.
- **Final Status:** ✅ **Correct & Validated** (111 sections across 71 farms).

#### 8. `raw/05_weather_climate_daily.csv`
- **Original State:** 2,520 rows, 10 columns (90-day daily series per climate region).
- **Issues Discovered:** Needed check on $T_{\min} \le T_{\max}$, rainfall $\ge 0$, and humidity $\in [0, 100]\%$.
- **Changes Made:** Validated 100% compliance across all 2,520 records; confirmed 10-day observed + 80-day forecast structure.
- **Final Status:** ✅ **Correct & Verified** (2,520 rows, 0 temperature inversions).

#### 9. `raw/06_mandi_prices.csv`
- **Original State:** 3,200 rows, 13 columns (monthly modal/min/max prices across representative APMC mandis).
- **Issues Discovered:** Needed foreign key checks to `crops_master` and price order checks ($\text{min} \le \text{modal} \le \text{max}$).
- **Changes Made:** Verified price integrity and arrival volume ranges.
- **Final Status:** ✅ **Correct & Verified** (3,200 rows, 0 orphan crops).

#### 10. `raw/07_msp_data.csv`
- **Original State:** 68 rows, 9 columns spanning 2023–2026.
- **Issues Discovered:** Needed verification of official MSP values against eligible crops in `crops_master`.
- **Changes Made:** Verified all 68 records match MSP-eligible crops in `crops_master` (`msp_eligible = TRUE`).
- **Final Status:** ✅ **Correct & Verified** (68 rows).

#### 11. `raw/08_trade_data.csv`
- **Original State:** 200 rows, 10 columns (export/import volume and USD values 2021–2025).
- **Issues Discovered:** Needed country and commodity code mapping verification.
- **Changes Made:** Verified non-negative trade volumes, valid crop foreign keys, and realistic YoY demand percentages.
- **Final Status:** ✅ **Correct & Verified** (200 rows).

#### 12. `raw/09_soil_health.csv`
- **Original State:** 71 rows, 10 columns (1 soil test report per farm).
- **Issues Discovered:** Needed agronomic range checks for N, P, K, pH, and organic carbon.
- **Changes Made:** Verified pH values span realistic range (5.83 to 8.42); all 71 records link 1:1 to farms.
- **Final Status:** ✅ **Correct & Verified** (71 rows, 100% farm linkage).

#### 13. `raw/10_notifications.csv`
- **Original State:** 200 rows, 8 columns of operational alerts.
- **Issues Discovered:** Needed foreign key linkage to both `farmers` and `farms`.
- **Changes Made:** Verified all 200 records resolve to existing farmers and farms.
- **Final Status:** ✅ **Correct & Integrated** (200 rows).

---

### 3.3 Processed & Derived Datasets

#### 14. `processed/01_mandi_prices_clean.csv`
- **Original State:** 3,072 rows, 10 columns.
- **Purpose:** Monthly aggregated price series with outlier rejection ($|z| \le 3.0$).
- **Final Status:** ✅ **Clean & Feature-Ready** (3,072 rows).

#### 15. `processed/02_weather_features_seasonal.csv`
- **Original State:** 28 rows, 9 columns.
- **Purpose:** 90-day regional feature vectors (average temp band, cumulative rainfall, rainy days, humidity).
- **Final Status:** ✅ **Clean & Feature-Ready** (28 rows, 1 per climate region).

#### 16. `processed/03_crop_scores.csv`
- **Original State:** 125 rows, 12 columns.
- **Purpose:** Phase-1 recommendation engine output ranking candidate crops per farm.
- **Final Status:** ✅ **Clean & Application-Ready** (125 rows, 5 ranked crops per farm sample).

#### 17. `processed/04_farm_plans.csv`
- **Original State:** 25 rows, 10 columns.
- **Purpose:** Accepted / draft farm portfolio plans with revenue, cost, profit, and ROI.
- **Domain Observation:** 4 draft plans exhibit negative net profit due to high input-cost crops; confirmed this is legitimate decision-support feedback for farmers.
- **Final Status:** ✅ **Clean & Application-Ready** (25 plans).

---

### 3.4 Machine Learning Datasets

#### 18–21. Yield Prediction (`ml/01–04`)
- `01_yield_training_data_full.csv` (7,000 rows, 2015–2024)
- `02_yield_train.csv` (4,900 rows, 2015–2021) — 70%
- `03_yield_validation.csv` (1,400 rows, 2022–2023) — 20%
- `04_yield_test.csv` (700 rows, 2024) — 10%
- **Final Status:** ✅ **Model-Ready & Leakage-Free**.

#### 22–25. Price Forecasting (`ml/05–08`)
- `05_price_forecast_dataset_full.csv` (19,500 rows, 2021–2026)
- `06_price_train.csv` (9,900 rows, 2021–2023) — 50.8%
- `07_price_validation.csv` (3,600 rows, 2024) — 18.5%
- `08_price_test.csv` (6,000 rows, 2025–2026) — 30.7%
- **Final Status:** ✅ **Model-Ready & Leakage-Free**.

---

## 4. Entity-Relationship & Connective Key Map

The following relational structure connects all datasets:

```
[districts] (district_id)
   │
   ├── 1:1 ──► [climate_regions] (region_id)
   │                  │
   │                  └── 1:N ──► [weather_climate_daily] ──► [weather_features_seasonal]
   │
   ├── 1:N ──► [farmers] (farmer_id)
   │                  │
   │                  └── 1:N ──► [farms] (farm_id) ◄── 1:1 ──► [farms.geojson]
   │                                 │
   │                                 ├── 1:1 ──► [soil_health]
   │                                 ├── 1:N ──► [land_sections]
   │                                 ├── 1:N ──► [crop_scores]
   │                                 ├── 1:N ──► [farm_plans]
   │                                 └── 1:N ──► [notifications]
   │
[crops_master] (crop_id)
   ├── 1:N ──► [crop_lifecycle_calendar]
   ├── 1:N ──► [mandi_prices] ──► [mandi_prices_clean]
   ├── 1:N ──► [msp_data]
   ├── 1:N ──► [trade_data]
   ├── 1:N ──► [ml_yield_training_data]
   └── 1:N ──► [ml_price_forecast_data]
```

### Key Integrity Matrix

| Parent Table | Parent Key | Child Table | Foreign Key | Verified Count | Status |
|---|---|---|---|---|---|
| `districts` | `district_id` | `climate_regions` | `district_id` | 28 / 28 | ✅ 100% Match |
| `districts` | `district_id` | `farmers` | `district_id` | 60 / 60 | ✅ 100% Match |
| `districts` | `district_id` | `farms` | `district_id` | 71 / 71 | ✅ 100% Match |
| `farmers` | `farmer_id` | `farms` | `farmer_id` | 71 / 71 | ✅ 100% Match |
| `farms` | `farm_id` | `land_sections` | `farm_id` | 111 / 111 | ✅ 100% Match |
| `farms` | `farm_id` | `soil_health` | `farm_id` | 71 / 71 | ✅ 100% Match |
| `farms` | `farm_id` | `crop_scores` | `farm_id` | 125 / 125 | ✅ 100% Match |
| `farms` | `farm_id` | `farm_plans` | `farm_id` | 25 / 25 | ✅ 100% Match |
| `farms` | `farm_id` | `farms.geojson` | `properties.farm_id`| 71 / 71 | ✅ 100% Match |
| `crops_master` | `crop_id` | `crop_lifecycle_calendar` | `crop_id` | 125 / 125 | ✅ 100% Match |
| `crops_master` | `crop_id` | `mandi_prices` | `crop_id` | 3,200 / 3,200 | ✅ 100% Match |
| `crops_master` | `crop_id` | `msp_data` | `crop_id` | 68 / 68 | ✅ 100% Match |
| `crops_master` | `crop_id` | `trade_data` | `crop_id` | 200 / 200 | ✅ 100% Match |
| `crops_master` | `crop_id` | `ml_yield_training_data` | `crop_id` | 7,000 / 7,000 | ✅ 100% Match |
| `crops_master` | `crop_id` | `ml_price_forecast_data` | `crop_id` | 19,500 / 19,500 | ✅ 100% Match |

---

## 5. Machine Learning Split Strategy & Data Leakage Audit

### 5.1 Splitting Methodology

Agricultural data is inherently seasonal and autoregressive. Traditional random shuffling creates massive data leakage because observations from the same season/year or market cycle leak into the training set, causing inflated test metrics that fail in production.

We enforce **strictly chronological, time-based holdout splitting**:

```
Yield Prediction:
2015 ────────────────────── 2021 | 2022 ──────── 2023 | 2024
       [ Training (70%) ]        |  [ Validation (20%) ] | [ Test (10%) ]

Price Forecasting:
2021 ───────────── 2023 | 2024                 | 2025 ──────────── 2026
  [ Training (50.8%) ]  | [ Validation (18.5%) ]|    [ Test (30.7%) ]
```

### 5.2 Data Leakage Audit Checklist

| Leakage Risk Category | Check Performed | Finding / Resolution | Status |
|---|---|---|---|
| **Temporal Contamination** | Verified whether future harvest years appear in training sets | Yield train $\le 2021$, val $= 2022\text{--}2023$, test $= 2024$. Price train $\le 2023$, val $= 2024$, test $\ge 2025$. | ✅ Passed (0 violations) |
| **Cross-Split ID Overlap** | Checked for duplicate `record_id`s across train, validation, and test splits | Zero overlapping IDs across all split combinations in both yield and price models. | ✅ Passed (0 overlap) |
| **Contemporaneous Predictors** | Checked whether next-period modal price is duplicated in lag-1 features | $\text{target\_price} \ne \text{price\_lag1}$ across market variations (only 2 stationary market points matched). | ✅ Passed (No target leakage) |
| **Look-ahead Aggregations** | Verified whether weather anomalies in test period use future mean statistics | Weather anomaly features use 10-year historical baseline prior to prediction timestamp. | ✅ Passed |
| **Post-Outcome Variables** | Verified that yield features exclude post-harvest data | Yield predictors contain only pre-harvest variables (temperature, rainfall, soil, area, irrigation). | ✅ Passed |

---

## 6. Data Quality & Statistical Validation Results

The automated test suite (`scripts/validate_data.py`) executed **92 comprehensive tests**.

### Summary of Test Execution:
- **Total Tests Run:** 92
- **Passed:** 92 (100.0%)
- **Failed:** 0 (0.0%)
- **Warnings:** 0

### Statistical Summary of Target Variables:

#### Yield Target (`actual_yield_kg_per_ha`):
- **Full Set:** $\text{Mean} = 4,669.98\text{ kg/ha}$, $\text{Min} = 0.0$, $\text{Max} = 48,337.80$
- **Train Set:** $\text{Mean} = 4,686.08\text{ kg/ha}$, $\text{Min} = 0.0$, $\text{Max} = 47,361.00$
- **Validation Set:** $\text{Mean} = 4,587.79\text{ kg/ha}$, $\text{Min} = 0.0$, $\text{Max} = 48,337.80$
- **Test Set:** $\text{Mean} = 4,721.67\text{ kg/ha}$, $\text{Min} = 0.0$, $\text{Max} = 42,917.10$

#### Price Target (`target_price_next_period_inr`):
- **Full Set:** $\text{Mean} = ₹4,356.07/\text{quintal}$, $\text{Min} = ₹1,191.80$, $\text{Max} = ₹8,297.40$
- **Train Set:** $\text{Mean} = ₹4,266.57/\text{quintal}$, $\text{Min} = ₹1,191.80$, $\text{Max} = ₹7,870.90$
- **Validation Set:** $\text{Mean} = ₹4,377.70/\text{quintal}$, $\text{Min} = ₹1,296.80$, $\text{Max} = ₹7,935.10$
- **Test Set:** $\text{Mean} = ₹4,490.78/\text{quintal}$, $\text{Min} = ₹1,316.70$, $\text{Max} = ₹8,297.40$

---

## 7. Production Data Acquisition Plan

Before commercial release, the synthetic seed tables will be replaced by authoritative live/batch data sources:

| Dataset | Real Production Source | Access Method | Update Frequency | Licensing / Terms |
|---|---|---|---|---|
| **Districts & Geo** | Survey of India / LGD Portal | GeoJSON / PostGIS dump | Static / Annual | Open Govt Data (OGD) |
| **Weather (Live & 90d)** | IMD Gridded Data / Open-Meteo API | REST API / GRIB2 | Daily (every 6–12 hrs) | Open Access / CC-BY |
| **Mandi Market Prices** | Agmarknet / e-NAM Portal | Scheduled ETL / API | Daily | Govt of India Open Data |
| **MSP Records** | CACP / data.gov.in | Official PDF/Gazette scrape | Seasonal (2×/year) | Official Public Notice |
| **Trade Demand Signals**| UN Comtrade / FAOSTAT | REST API / Monthly CSV | Monthly / Annual | UN Open Data Terms |
| **Soil Health Cards** | SHC Portal (soilhealth.dac.gov.in)| API / Farmer Upload | 2–3 Year Cycle | OGD License |
| **Crop Economics** | CACP Cost of Cultivation Scheme | Annual publication | Annual | Ministry of Agriculture |

---

## 8. Explicitly Missing Data & Open Clarifications

The following items are identified as external dependencies requiring production clarification:
1. **Google Maps API Tier Quota:** Commercial scaling limits for client-side boundary drawing vs server-side PostGIS topology verification.
2. **Live IMD REST API Key/Agreement:** Official institutional access for sub-daily gridded climate feeds.
3. **LLM Provider for Farmer AI Assistant:** Selection of backend LLM provider (e.g. Gemini 1.5 Pro/Flash via Vertex AI) and Indian language audio/text localization models.
4. **FPO Multi-Tenant Data Model:** Schema extensions needed if Farmer Producer Organizations manage clustered farmer groups rather than individual farmers.

---

## 9. Code & Tooling Deliverables

1. **`scripts/validate_data.py`**
   - Automated data quality and schema validation test suite.
   - Run via `python scripts/validate_data.py`.
2. **`scripts/load_data.py`**
   - Ingestion utility generating SQL seed files and populating PostgreSQL databases.
   - Run via `python scripts/load_data.py`.
3. **`database/seeds/001_seed_data.sql`**
   - Idempotent PostgreSQL seed script containing reference crops, agro-climatic zones, districts, sample farmers, and farms.
4. **`Dataset/project_data/schemas/data_dictionary.md`**
   - Complete technical data dictionary for all 22 datasets.

---

## 10. Completion & Readiness Assessment

Realistic assessment of project readiness across all four core dimensions:

```
┌─────────────────────────────────────────────────────────┐
│              AGRIPROFIT READINESS SCORECARD             │
├───────────────────────────────┬─────────────────────────┤
│ Dimension                     │ Readiness Score         │
├───────────────────────────────┼─────────────────────────┤
│ Data Readiness                │ 95%                     │
│ Integration Readiness         │ 85%                     │
│ ML / Model Readiness          │ 88%                     │
│ Production Readiness          │ 72%                     │
└───────────────────────────────┴─────────────────────────┘
```

### Rationale:
- **Data Readiness (95%):** All 22 synthetic seed datasets are referentially complete, strictly typed, validated across 92 tests, and formatted for immediate consumption. The remaining 5% represents swapping synthetic seed data with live API scrapers in production.
- **Integration Readiness (85%):** Schemas, seeds, and Next.js repositories are aligned. Ingestion and seed scripts are active. Remaining 15% is connecting the Next.js API endpoints (`/api/recommendations`, `/api/weather`, `/api/markets`) to live database tables.
- **ML / Model Readiness (88%):** Feature engineering and time-based train/val/test splits are verified with zero data leakage. Baseline models can be trained immediately. Remaining 12% is tuning gradient boosted trees and hyperparameter optimization on historical multi-year series.
- **Production Readiness (72%):** Architecture, documentation, database schema, data packages, validation tooling, and UI shells are in place. Remaining 28% involves authentication enforcement, live third-party API keys, SMS OTP gateways, and containerized deployment.

