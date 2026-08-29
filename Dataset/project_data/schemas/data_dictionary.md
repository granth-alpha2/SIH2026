# AgriProfit — Data Dictionary

**Package Version:** 1.0.0 · **Schema Version:** 1.0.0 · **Last Updated:** 2026-08-29  
**Data Owner:** AgriProfit Data & AI Engineering Team  
**Designation:** All row-level data in this package is **SYNTHETIC** development/seed data, algorithmically generated to match realistic Indian agricultural statistics, value ranges, and strict relational integrity. Reference datasets (agro-climatic zones, state/district codes, baseline agronomic parameters) are curated from public domain sources (ICAR, IMD, CACP) and must be verified against official authoritative feeds prior to commercial production deployment.

---

## Table of Contents

1. [Reference / Master Datasets](#1-reference--master-datasets)
   - [01_states_districts.csv](#11-reference01_states_districtscsv)
   - [02_climate_regions.csv](#12-reference02_climate_regionscsv)
   - [03_crops_master.csv](#13-reference03_crops_mastercsv)
   - [04_crop_lifecycle_calendar.csv](#14-reference04_crop_lifecycle_calendarcsv)
2. [Raw / Ingestion Datasets](#2-raw--ingestion-datasets)
   - [01_farmers.csv](#21-raw01_farmerscsv)
   - [02_farms.csv](#22-raw02_farmscsv)
   - [03_farms.geojson](#23-raw03_farmsgeojson)
   - [04_land_sections.csv](#24-raw04_land_sectionscsv)
   - [05_weather_climate_daily.csv](#25-raw05_weather_climate_dailycsv)
   - [06_mandi_prices.csv](#26-raw06_mandi_pricescsv)
   - [07_msp_data.csv](#27-raw07_msp_datacsv)
   - [08_trade_data.csv](#28-raw08_trade_datacsv)
   - [09_soil_health.csv](#29-raw09_soil_healthcsv)
   - [10_notifications.csv](#210-raw10_notificationscsv)
3. [Processed / Feature & Output Datasets](#3-processed--feature--output-datasets)
   - [01_mandi_prices_clean.csv](#31-processed01_mandi_prices_cleancsv)
   - [02_weather_features_seasonal.csv](#32-processed02_weather_features_seasonalcsv)
   - [03_crop_scores.csv](#33-processed03_crop_scorescsv)
   - [04_farm_plans.csv](#34-processed04_farm_planscsv)
4. [Machine Learning Datasets](#4-machine-learning-datasets)
   - [01–04 Yield Prediction Datasets](#41-ml0104-yield-prediction-datasets)
   - [05–08 Price Forecasting Datasets](#42-ml0508-price-forecasting-datasets)

---

## 1. Reference / Master Datasets

### 1.1 `reference/01_states_districts.csv`
- **Purpose:** Canonical geospatial master of administrative states, districts, HQ coordinates, and ICAR agro-climatic zones.
- **Source:** Survey of India / Census of India / ICAR Planning Commission Agro-Climatic Regional Planning.
- **Update Frequency:** Static (reviewed annually for administrative reorganization).
- **Synthetic vs Real:** Real-world district names, coordinates, and ICAR zone boundaries.

| Column | Type | Required | Key | Unit | Description | Example |
|---|---|---|---|---|---|---|
| `district_id` | String | Yes | PK | — | Standard alphanumeric district identifier | `DIST001` |
| `state` | String | Yes | — | — | State name | `Punjab` |
| `state_code` | String | Yes | — | — | Two-letter ISO/postal state code | `PB` |
| `district` | String | Yes | — | — | District name | `Bathinda` |
| `district_code` | String | Yes | — | — | Standard state-district slug | `PB-BAT` |
| `latitude` | Float | Yes | — | Deg N | District centroid / HQ latitude (WGS84) | `30.211000` |
| `longitude` | Float | Yes | — | Deg E | District centroid / HQ longitude (WGS84) | `74.945500` |
| `agro_climatic_zone` | String | Yes | — | — | Official ICAR agro-climatic zone classification | `Trans-Gangetic Plains Region` |

---

### 1.2 `reference/02_climate_regions.csv`
- **Purpose:** Connects administrative districts to meteorological climate grid cells and Köppen climate classifications.
- **Source:** IMD / Köppen-Geiger Climate Classification of India / Open-Meteo Grid.
- **Update Frequency:** Static.
- **Relationships:** `district_id` references `districts.district_id`.

| Column | Type | Required | Key | Unit | Description | Example |
|---|---|---|---|---|---|---|
| `region_id` | String | Yes | PK | — | Climate region identifier (1:1 with district in MVP) | `REG001` |
| `district_id` | String | Yes | FK | — | References `reference/01_states_districts.csv` | `DIST001` |
| `state` | String | Yes | — | — | State name | `Punjab` |
| `district` | String | Yes | — | — | District name | `Bathinda` |
| `latitude` | Float | Yes | — | Deg N | Grid cell reference latitude | `30.211000` |
| `longitude` | Float | Yes | — | Deg E | Grid cell reference longitude | `74.945500` |
| `agro_climatic_zone` | String | Yes | — | — | Agro-climatic zone name | `Trans-Gangetic Plains Region` |
| `koppen_climate_class`| String | Yes | — | — | Köppen climate classification code | `BSh` |

---

### 1.3 `reference/03_crops_master.csv`
- **Purpose:** Core agronomic and economic reference catalog defining temperature tolerance, water requirements, costs, expected yield, and MSP eligibility.
- **Source:** ICAR Crop Packages of Practices / CACP Cost of Cultivation Scheme / State Agri Universities.
- **Update Frequency:** Annual review.
- **Importance:** Critical backbone entity joined by almost all models and APIs.

| Column | Type | Required | Key | Unit | Description | Example |
|---|---|---|---|---|---|---|
| `crop_id` | String | Yes | PK | — | Primary crop identifier | `CROP001` |
| `crop_name` | String | Yes | — | — | Common English crop name | `Wheat` |
| `category` | String | Yes | — | — | Agricultural category (Cereal, Pulse, Oilseed, Cash Crop, Vegetable, Fruit, Spice) | `Cereal` |
| `season` | String | Yes | — | — | Primary Indian agricultural cropping season (Kharif, Rabi, Zaid, Perennial) | `Rabi` |
| `duration_days` | Integer | Yes | — | Days | Sowing-to-harvest maturity duration | `120` |
| `water_requirement_mm` | Integer | Yes | — | mm | Total crop water requirement over lifecycle | `450` |
| `soil_type_suitable` | String | Yes | — | — | Dominant suitable soil type | `Alluvial` |
| `min_temp_c` | Float | Yes | — | °C | Absolute minimum survivable temperature | `5.0` |
| `max_temp_c` | Float | Yes | — | °C | Absolute maximum survivable temperature | `32.0` |
| `ideal_temp_min_c` | Float | Yes | — | °C | Optimal minimum growth temperature | `15.0` |
| `ideal_temp_max_c` | Float | Yes | — | °C | Optimal maximum growth temperature | `25.0` |
| `avg_yield_kg_per_ha` | Float | Yes | — | kg/ha | National benchmark average yield | `3500.0` |
| `seed_cost_per_ha_inr`| Float | Yes | — | ₹/ha | Estimated seed cost per hectare | `3200.00` |
| `fertilizer_cost_per_ha_inr` | Float | Yes | — | ₹/ha | Estimated fertilizer / nutrient cost per hectare | `6500.00` |
| `labor_cost_per_ha_inr` | Float | Yes | — | ₹/ha | Estimated labor & operations cost per hectare | `12000.00` |
| `irrigation_cost_per_ha_inr` | Float | Yes | — | ₹/ha | Estimated irrigation / power cost per hectare | `4000.00` |
| `other_cost_per_ha_inr` | Float | Yes | — | ₹/ha | Machinery, transport, and misc. cost per hectare | `4500.00` |
| `total_input_cost_per_ha_inr` | Float | Yes | — | ₹/ha | Total cost of cultivation per hectare | `30200.00` |
| `msp_eligible` | Boolean | Yes | — | — | Flag indicating whether central MSP applies | `TRUE` |
| `price_unit` | String | Yes | — | — | Trading / quotation unit | `Quintal` |
| `fao_item_code` | String | No | — | — | FAOSTAT / UN Comtrade commodity code | `0015` |

---

### 1.4 `reference/04_crop_lifecycle_calendar.csv`
- **Purpose:** Defines 5 standard growth stages per crop with day offsets, irrigation advice, fertilizer schedules, and disease risk notes.
- **Source:** ICAR Extension agronomic guidelines.
- **Update Frequency:** Annual review.
- **Relationships:** `crop_id` references `crops_master.crop_id`.

| Column | Type | Required | Key | Unit | Description | Example |
|---|---|---|---|---|---|---|
| `calendar_id` | String | Yes | PK | — | Lifecycle stage record identifier | `CAL0001` |
| `crop_id` | String | Yes | FK | — | References `crops_master.crop_id` | `CROP001` |
| `crop_name` | String | Yes | — | — | Common crop name for display convenience | `Wheat` |
| `stage_number` | Integer | Yes | — | — | Stage sequence number (1 to 5) | `1` |
| `stage_name` | String | Yes | — | — | Stage name (Land Prep, Sowing, Vegetative, Flowering, Maturity) | `Land Preparation & Sowing` |
| `start_day` | Integer | Yes | — | Days | Stage start offset from sowing | `0` |
| `end_day` | Integer | Yes | — | Days | Stage end offset from sowing | `20` |
| `irrigation_guidance` | Text | Yes | — | — | Stage-specific watering advice | `Pre-sowing irrigation (palewa) required...` |
| `fertilizer_guidance` | Text | Yes | — | — | Stage-specific nutrient application advice | `Basal dose: 50% Nitrogen, 100% P & K...` |
| `pest_disease_risk_note` | Text | Yes | — | — | Pest and disease vulnerability warnings | `Monitor for termite and seed rot...` |

---

## 2. Raw / Ingestion Datasets

### 2.1 `raw/01_farmers.csv`
- **Purpose:** User account profiles for registered farmers.
- **Source:** In-app farmer onboarding.
- **Update Frequency:** Real-time on registration.

| Column | Type | Required | Key | Unit | Description | Example |
|---|---|---|---|---|---|---|
| `farmer_id` | String | Yes | PK | — | Unique farmer identifier | `FARM_USR0001` |
| `full_name` | String | Yes | — | — | Farmer's full name | `Gurpreet Singh` |
| `gender` | String | No | — | — | Gender | `Male` |
| `age` | Integer | No | — | Years | Age | `46` |
| `phone_number_masked` | String | Yes | — | — | Masked mobile contact (PII safe) | `+91-XXXXX-12045` |
| `district_id` | String | Yes | FK | — | References `districts.district_id` | `DIST001` |
| `state` | String | Yes | — | — | State of residence | `Punjab` |
| `district` | String | Yes | — | — | District of residence | `Bathinda` |
| `village` | String | No | — | — | Village / Taluk name | `Bhitiwala` |
| `land_owned_hectares` | Float | Yes | — | ha | Total landholding | `2.40` |
| `preferred_language` | String | Yes | — | — | UI language preference code | `pa` |
| `registration_date` | Date | Yes | — | YYYY-MM-DD | Date of profile creation | `2024-01-10` |

---

### 2.2 `raw/02_farms.csv` & `raw/03_farms.geojson`
- **Purpose:** Georeferenced farm plots with centroid coordinates, calculated area, soil, and water access metadata.
- **Source:** Google Maps API drawing tool / GPS capture.
- **Update Frequency:** Real-time.

| Column | Type | Required | Key | Unit | Description | Example |
|---|---|---|---|---|---|---|
| `farm_id` | String | Yes | PK | — | Unique farm identifier | `FARM0001` |
| `farmer_id` | String | Yes | FK | — | References `farmers.farmer_id` | `FARM_USR0001` |
| `district_id` | String | Yes | FK | — | References `districts.district_id` | `DIST001` |
| `state` | String | Yes | — | — | State name | `Punjab` |
| `district` | String | Yes | — | — | District name | `Bathinda` |
| `latitude` | Float | Yes | — | Deg N | Plot centroid latitude (WGS84) | `30.214500` |
| `longitude` | Float | Yes | — | Deg E | Plot centroid longitude (WGS84) | `74.948200` |
| `area_hectares` | Float | Yes | — | ha | Plot area calculated server-side | `1.04` |
| `boundary_type` | String | Yes | — | — | Boundary geometry type (`polygon` or `pin`) | `polygon` |
| `soil_type` | String | Yes | — | — | Primary soil classification | `Alluvial` |
| `water_source` | String | Yes | — | — | Primary irrigation source (Canal, Borewell, Rainfed) | `Canal` |
| `irrigation_type` | String | Yes | — | — | System type (Drip, Flood, Sprinkler) | `Flood` |
| `registration_date` | Date | Yes | — | YYYY-MM-DD | Farm registration date | `2024-01-24` |

---

### 2.3 `raw/04_land_sections.csv`
- **Purpose:** Farm land partitioning supporting multi-crop portfolio allocation.
- **Source:** Farmer land subdivision tool.
- **Update Frequency:** Seasonal / On-demand.

| Column | Type | Required | Key | Unit | Description | Example |
|---|---|---|---|---|---|---|
| `section_id` | String | Yes | PK | — | Section identifier | `SEC0001` |
| `farm_id` | String | Yes | FK | — | References `farms.farm_id` | `FARM0001` |
| `section_number` | Integer | Yes | — | — | Sequence index within the farm | `1` |
| `area_hectares` | Float | Yes | — | ha | Section area (sums to farm area) | `0.60` |
| `soil_type` | String | Yes | — | — | Section soil type | `Alluvial` |
| `irrigation_type` | String | Yes | — | — | Section irrigation system | `Flood` |
| `assigned_crop_id` | String | No | FK | — | References `crops_master.crop_id` (null if unassigned) | `CROP001` |
| `assigned_crop_name` | String | No | — | — | Name of assigned crop | `Wheat` |

---

### 2.4 `raw/05_weather_climate_daily.csv`
- **Purpose:** 90-day daily temperature, rainfall, humidity, and wind records (observed history + forecast).
- **Source:** Open-Meteo / NASA POWER / IMD Gridded Weather.
- **Update Frequency:** Daily rolling refresh.

| Column | Type | Required | Key | Unit | Description | Example |
|---|---|---|---|---|---|---|
| `weather_id` | String | Yes | PK | — | Daily weather record identifier | `WTH000001` |
| `region_id` | String | Yes | FK | — | References `climate_regions.region_id` | `REG001` |
| `date` | Date | Yes | — | YYYY-MM-DD | Observation / forecast date | `2026-06-01` |
| `temp_min_c` | Float | Yes | — | °C | Daily minimum temperature | `26.4` |
| `temp_max_c` | Float | Yes | — | °C | Daily maximum temperature | `39.8` |
| `rainfall_mm` | Float | Yes | — | mm | Total daily precipitation | `0.0` |
| `humidity_pct` | Float | Yes | — | % | Daily average relative humidity (0–100) | `42.1` |
| `wind_speed_kmph` | Float | Yes | — | km/h | Daily average wind speed | `14.2` |
| `forecast_type` | String | Yes | — | — | Data provenance (`observed` or `forecast`) | `observed` |
| `source` | String | Yes | — | — | Data provider name | `Open-Meteo API / IMD Model` |

---

### 2.5 `raw/06_mandi_prices.csv`
- **Purpose:** Mandi-level modal, minimum, and maximum arrival prices with trade volumes.
- **Source:** Agmarknet / e-NAM Daily Price Bulletins.
- **Update Frequency:** Daily.

| Column | Type | Required | Key | Unit | Description | Example |
|---|---|---|---|---|---|---|
| `price_id` | String | Yes | PK | — | Price transaction identifier | `PRC000001` |
| `crop_id` | String | Yes | FK | — | References `crops_master.crop_id` | `CROP001` |
| `crop_name` | String | Yes | — | — | Crop name | `Wheat` |
| `state` | String | Yes | — | — | Market state | `Punjab` |
| `district` | String | Yes | — | — | Market district | `Bathinda` |
| `mandi_name` | String | Yes | — | — | APMC Mandi market name | `Bathinda Mandi` |
| `date` | Date | Yes | — | YYYY-MM-DD | Trading date | `2024-01-15` |
| `min_price_per_unit_inr` | Float | Yes | — | ₹/unit | Lowest traded price | `2210.00` |
| `max_price_per_unit_inr` | Float | Yes | — | ₹/unit | Highest traded price | `2380.00` |
| `modal_price_per_unit_inr`| Float | Yes | — | ₹/unit | Most frequent modal transaction price | `2295.00` |
| `unit` | String | Yes | — | — | Pricing quantity unit | `Quintal` |
| `arrivals_tonnes` | Float | Yes | — | Tonnes | Market arrival volume | `420.5` |
| `source` | String | Yes | — | — | Official source agency | `Agmarknet` |

---

### 2.6 `raw/07_msp_data.csv`
- **Purpose:** Central Government Minimum Support Prices by season and year.
- **Source:** Ministry of Agriculture & Farmers Welfare / CACP.
- **Update Frequency:** 1–2 times annually (per Kharif/Rabi cabinet notification).

| Column | Type | Required | Key | Unit | Description | Example |
|---|---|---|---|---|---|---|
| `msp_id` | String | Yes | PK | — | MSP record identifier | `MSP001` |
| `crop_id` | String | Yes | FK | — | References `crops_master.crop_id` | `CROP001` |
| `crop_name` | String | Yes | — | — | Crop name | `Wheat` |
| `season` | String | Yes | — | — | Sowing season | `Rabi` |
| `year` | Integer | Yes | — | Year | Marketing season year | `2024` |
| `msp_price_per_unit_inr`| Float | Yes | — | ₹/unit | Official announced MSP | `2275.00` |
| `unit` | String | Yes | — | — | Weight unit | `Quintal` |
| `announced_date` | Date | Yes | — | YYYY-MM-DD | Official gazette notification date | `2023-10-18` |
| `source` | String | Yes | — | — | Source reference | `CACP / Dept. of Agriculture` |

---

### 2.7 `raw/08_trade_data.csv`
- **Purpose:** International export/import quantities, values, and YoY demand growth indicators.
- **Source:** FAOSTAT / UN Comtrade / DGCIS India.
- **Update Frequency:** Monthly to annual.

| Column | Type | Required | Key | Unit | Description | Example |
|---|---|---|---|---|---|---|
| `trade_id` | String | Yes | PK | — | Trade record identifier | `TRD0001` |
| `crop_id` | String | Yes | FK | — | References `crops_master.crop_id` | `CROP001` |
| `crop_name` | String | Yes | — | — | Crop name | `Wheat` |
| `country` | String | Yes | — | — | Destination or origin trading partner country | `Bangladesh` |
| `year` | Integer | Yes | — | Year | Trade year | `2023` |
| `export_qty_tonnes` | Float | Yes | — | Tonnes | Total export volume from India | `125000.0` |
| `import_qty_tonnes` | Float | Yes | — | Tonnes | Total import volume into India | `0.0` |
| `trade_value_usd` | Float | Yes | — | USD | Total value of trade in US Dollars | `38500000.00` |
| `yoy_demand_change_pct` | Float | Yes | — | % | Year-over-year percentage change in export demand | `12.40` |
| `source` | String | Yes | — | — | UN Comtrade / DGCIS | `UN Comtrade` |

---

### 2.8 `raw/09_soil_health.csv`
- **Purpose:** Laboratory soil chemical composition tests per farm (NPK, pH, Organic Carbon).
- **Source:** Government Soil Health Card Scheme / Agri Lab testing.
- **Update Frequency:** Every 2–3 years per farm.

| Column | Type | Required | Key | Unit | Description | Example |
|---|---|---|---|---|---|---|
| `soil_id` | String | Yes | PK | — | Soil sample identifier | `SOIL0001` |
| `farm_id` | String | Yes | FK | — | References `farms.farm_id` | `FARM0001` |
| `test_date` | Date | Yes | — | YYYY-MM-DD | Soil test laboratory report date | `2024-03-15` |
| `nitrogen_kg_per_ha` | Float | Yes | — | kg/ha | Available Nitrogen content | `185.4` |
| `phosphorus_kg_per_ha` | Float | Yes | — | kg/ha | Available Phosphorus content | `22.1` |
| `potassium_kg_per_ha` | Float | Yes | — | kg/ha | Available Potassium content | `265.0` |
| `ph_value` | Float | Yes | — | pH | Soil acidity/alkalinity measure (0–14) | `7.40` |
| `organic_carbon_pct` | Float | Yes | — | % | Soil Organic Carbon percentage | `0.58` |
| `soil_type` | String | Yes | — | — | Soil classification | `Alluvial` |
| `source` | String | Yes | — | — | Soil Health Card Portal / Lab | `Soil Health Card Scheme` |

---

### 2.9 `raw/10_notifications.csv`
- **Purpose:** Operational alerts and crop stage guidance dispatched to farmers.
- **Source:** Generated automatically by the rules engine and weather monitoring service.
- **Update Frequency:** Real-time / Event-driven.

| Column | Type | Required | Key | Unit | Description | Example |
|---|---|---|---|---|---|---|
| `notification_id` | String | Yes | PK | — | Notification identifier | `NOTIF00001` |
| `farmer_id` | String | Yes | FK | — | References `farmers.farmer_id` | `FARM_USR0001` |
| `farm_id` | String | Yes | FK | — | References `farms.farm_id` | `FARM0001` |
| `notification_type` | String | Yes | — | — | Category (irrigation, weather, disease, market, crop_stage) | `irrigation` |
| `message` | Text | Yes | — | — | Plain text alert message | `Palewa irrigation recommended for Wheat...` |
| `scheduled_date` | Date | Yes | — | YYYY-MM-DD | Trigger date for the alert | `2026-06-30` |
| `priority` | String | Yes | — | — | Priority level (`High`, `Medium`, `Low`) | `High` |
| `status` | String | Yes | — | — | Delivery state (`unread`, `read`, `pending`) | `unread` |

---

## 3. Processed / Feature & Output Datasets

### 3.1 `processed/01_mandi_prices_clean.csv`
- **Purpose:** Monthly cleaned, deduplicated, and outlier-filtered price series per crop and state.
- **Transformation:** Aggregated from `raw/06_mandi_prices.csv` with z-score filter ($|z| \le 3.0$).

| Column | Type | Required | Key | Unit | Description | Example |
|---|---|---|---|---|---|---|
| `clean_price_id` | String | Yes | PK | — | Cleaned record identifier | `CPRC00001` |
| `crop_id` | String | Yes | FK | — | References `crops_master.crop_id` | `CROP001` |
| `crop_name` | String | Yes | — | — | Crop name | `Wheat` |
| `state` | String | Yes | — | — | State name | `Punjab` |
| `year_month` | String | Yes | — | YYYY-MM | Calendar year and month | `2024-01` |
| `avg_modal_price_inr` | Float | Yes | — | ₹/unit | Average modal price | `2295.00` |
| `min_price_inr` | Float | Yes | — | ₹/unit | Lowest observed price in month | `2210.00` |
| `max_price_inr` | Float | Yes | — | ₹/unit | Highest observed price in month | `2380.00` |
| `total_arrivals_tonnes` | Float | Yes | — | Tonnes | Sum of market arrivals in month | `1250.5` |
| `n_source_records` | Integer | Yes | — | — | Number of daily mandi price rows aggregated | `3` |

---

### 3.2 `processed/02_weather_features_seasonal.csv`
- **Purpose:** 90-day aggregated climate feature vector consumed by the Weather Suitability Scoring module.
- **Transformation:** Rolling window aggregation of `raw/05_weather_climate_daily.csv`.

| Column | Type | Required | Key | Unit | Description | Example |
|---|---|---|---|---|---|---|
| `weather_feature_id` | String | Yes | PK | — | Feature record identifier | `WFEAT001` |
| `region_id` | String | Yes | FK | — | References `climate_regions.region_id` | `REG001` |
| `avg_temp_min_c` | Float | Yes | — | °C | Average minimum temperature over 90 days | `25.4` |
| `avg_temp_max_c` | Float | Yes | — | °C | Average maximum temperature over 90 days | `38.2` |
| `total_rainfall_mm` | Float | Yes | — | mm | Cumulative rainfall over 90 days | `145.0` |
| `rainy_days` | Integer | Yes | — | Days | Number of days with rainfall $\ge 2.5\text{ mm}$ | `12` |
| `avg_humidity_pct` | Float | Yes | — | % | Average relative humidity | `48.5` |
| `window_start` | Date | Yes | — | YYYY-MM-DD | Feature window start date | `2026-06-01` |
| `window_end` | Date | Yes | — | YYYY-MM-DD | Feature window end date | `2026-08-29` |

---

### 3.3 `processed/03_crop_scores.csv`
- **Purpose:** Explainable multi-factor crop suitability recommendations generated by the Phase-1 recommendation engine.
- **Source:** Output of Scoring Engine combining Weather, Market, MSP Safety, and Cost Risk.

| Column | Type | Required | Key | Unit | Description | Example |
|---|---|---|---|---|---|---|
| `score_id` | String | Yes | PK | — | Score record identifier | `SCR00001` |
| `farm_id` | String | Yes | FK | — | References `farms.farm_id` | `FARM0001` |
| `crop_id` | String | Yes | FK | — | References `crops_master.crop_id` | `CROP001` |
| `crop_name` | String | Yes | — | — | Candidate crop name | `Wheat` |
| `weather_suitability_score` | Float | Yes | — | 0–100 | Climate suitability score | `92.4` |
| `market_opportunity_score` | Float | Yes | — | 0–100 | Mandi trend and trade score | `84.0` |
| `msp_safety_score` | Float | Yes | — | 0–100 | Price floor protection score | `95.0` |
| `risk_score` | Float | Yes | — | 0–100 | Agronomic & cost risk factor | `22.5` |
| `overall_score` | Float | Yes | — | 0–100 | Weighted overall score | `88.2` |
| `rank_within_farm` | Integer | Yes | — | Rank | Relative rank of crop for this farm | `1` |
| `explanation` | Text | Yes | — | — | Plain-language factor explanation | `Excellent temperature match with high MSP floor safety...` |
| `generated_date` | Date | Yes | — | YYYY-MM-DD | Recommendation generation timestamp | `2026-08-29` |

---

### 3.4 `processed/04_farm_plans.csv`
- **Purpose:** Accepted farm-level multi-crop allocation plans with projected revenue, cost, net profit, and ROI.
- **Source:** Land allocation optimizer / Farmer confirmation.

| Column | Type | Required | Key | Unit | Description | Example |
|---|---|---|---|---|---|---|
| `plan_id` | String | Yes | PK | — | Plan identifier | `PLAN0001` |
| `farm_id` | String | Yes | FK | — | References `farms.farm_id` | `FARM0001` |
| `farmer_id` | String | Yes | FK | — | References `farmers.farmer_id` | `FARM_USR0001` |
| `plan_date` | Date | Yes | — | YYYY-MM-DD | Plan creation date | `2026-08-29` |
| `crop_allocation_json` | JSON | Yes | — | — | Serialized array of section crop assignments | `[{"section_id": "SEC0001", "crop_id": "CROP001", "area_hectares": 0.60, ...}]` |
| `expected_revenue_inr` | Float | Yes | — | ₹ | Farm-level projected gross revenue | `68400.00` |
| `expected_cost_inr` | Float | Yes | — | ₹ | Farm-level projected total input cost | `31400.00` |
| `expected_profit_inr` | Float | Yes | — | ₹ | Farm-level net profit ($\text{Revenue} - \text{Cost}$) | `37000.00` |
| `expected_roi_pct` | Float | Yes | — | % | Return on Investment ($\frac{\text{Profit}}{\text{Cost}} \times 100$) | `117.8` |
| `status` | String | Yes | — | — | Plan status (`Active - Accepted by Farmer`, `Draft - Pending Farmer Confirmation`) | `Active - Accepted by Farmer` |

---

## 4. Machine Learning Datasets

### 4.1 `ml/01–04` Yield Prediction Datasets
- **Objective:** Supervised regression estimating crop yield ($\text{kg/ha}$) based on weather, soil, and management features.
- **Split Strategy:** Strict chronological time-based split:
  - **Train (`02_yield_train.csv`):** 2015–2021 (4,900 rows, 70%)
  - **Validation (`03_yield_validation.csv`):** 2022–2023 (1,400 rows, 20%)
  - **Test (`04_yield_test.csv`):** 2024 (700 rows, 10%)
- **Data Leakage Mitigation:** No future weather or post-harvest observations are present in predictors. Zero record ID overlap across splits.

| Column | Role | Type | Description |
|---|---|---|---|
| `record_id` | ID (PK) | String | Unique observation ID |
| `crop_id` | ID (FK) | String | References `crops_master.crop_id` |
| `crop_name` | Feature | String | Crop name |
| `region_id` | ID (FK) | String | References `climate_regions.region_id` |
| `state` | Feature | String | State |
| `year` | Temporal | Integer | Harvest year (defines train/val/test boundary) |
| `avg_temp_c` | Feature | Float | Season average temperature (°C) |
| `total_rainfall_mm` | Feature | Float | Season cumulative rainfall (mm) |
| `soil_ph` | Feature | Float | Soil pH level |
| `nitrogen_kg_per_ha` | Feature | Float | Soil Nitrogen (kg/ha) |
| `irrigation_type` | Feature | String | Irrigation system type |
| `area_hectares` | Feature | Float | Cultivated area |
| `actual_yield_kg_per_ha` | **Label** | Float | **Target variable: Actual crop yield (kg/ha)** |

---

### 4.2 `ml/05–08` Price Forecasting Datasets
- **Objective:** Time-series autoregressive regression predicting next-month mandi modal price ($\text{INR/unit}$).
- **Split Strategy:** Strict chronological time-based split:
  - **Train (`06_price_train.csv`):** 2021–2023 (9,900 rows, 50.8%)
  - **Validation (`07_price_validation.csv`):** 2024 (3,600 rows, 18.5%)
  - **Test (`08_price_test.csv`):** 2025–2026 (6,000 rows, 30.7%)
- **Data Leakage Mitigation:** Features strictly include prior lagged prices (`price_lag1_inr`, `price_lag2_inr`, `price_lag3_inr`), historical rainfall anomaly, and past trade demand index. No contemporaneous or future pricing is included in the feature vector.

| Column | Role | Type | Description |
|---|---|---|---|
| `record_id` | ID (PK) | String | Unique forecast record ID |
| `crop_id` | ID (FK) | String | References `crops_master.crop_id` |
| `crop_name` | Feature | String | Crop name |
| `state` | Feature | String | Market state |
| `year` | Temporal | Integer | Feature observation year |
| `month` | Temporal | Integer | Feature observation month (1–12) |
| `price_lag1_inr` | Feature | Float | Modal price 1 month prior (₹/unit) |
| `price_lag2_inr` | Feature | Float | Modal price 2 months prior (₹/unit) |
| `price_lag3_inr` | Feature | Float | Modal price 3 months prior (₹/unit) |
| `rainfall_anomaly_mm` | Feature | Float | Precipitation departure from 10-year mean (mm) |
| `trade_demand_index` | Feature | Float | International export demand strength index (0–100) |
| `target_price_next_period_inr` | **Label** | Float | **Target variable: Next period modal price (₹/unit)** |
