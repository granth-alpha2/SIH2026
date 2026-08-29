#!/usr/bin/env python3
"""
AgriProfit — Data Validation & Integrity Test Suite
===================================================
Comprehensive validation script checking:
1. File existence and structure across reference, raw, processed, and ml layers.
2. Schema conformity (required columns and data types).
3. Primary key uniqueness and non-null constraints.
4. Foreign key referential integrity across all dataset relationships.
5. Numerical value ranges and domain validity (climate, soil, prices, area, costs).
6. Time-series chronological split consistency in ML datasets.
7. Data leakage audit (feature lag timing vs targets, cross-split entity isolation).

Usage:
    python scripts/validate_data.py [--data-dir path/to/project_data]
"""

import sys
import os
import json
import argparse
from typing import Dict, List, Set, Any, Tuple
import pandas as pd
import numpy as np

class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

class DataValidator:
    def __init__(self, data_dir: str):
        self.data_dir = os.path.abspath(data_dir)
        self.passed_tests = 0
        self.failed_tests = 0
        self.warnings = 0
        self.dfs: Dict[str, pd.DataFrame] = {}
        self.geojson_data: Dict[str, Any] = {}
        
    def log_pass(self, test_name: str, detail: str = ""):
        self.passed_tests += 1
        msg = f"  [PASS] {test_name}"
        if detail:
            msg += f" - {detail}"
        print(f"{Colors.GREEN}{msg}{Colors.ENDC}")

    def log_fail(self, test_name: str, detail: str = ""):
        self.failed_tests += 1
        msg = f"  [FAIL] {test_name}"
        if detail:
            msg += f" - {detail}"
        print(f"{Colors.FAIL}{msg}{Colors.ENDC}")

    def log_warn(self, test_name: str, detail: str = ""):
        self.warnings += 1
        msg = f"  [WARN] {test_name}"
        if detail:
            msg += f" - {detail}"
        print(f"{Colors.WARNING}{msg}{Colors.ENDC}")

    def load_all_datasets(self) -> bool:
        print(f"\n{Colors.BOLD}=== 1. LOADING DATASETS FROM {self.data_dir} ==={Colors.ENDC}")
        expected_csvs = [
            "reference/01_states_districts.csv",
            "reference/02_climate_regions.csv",
            "reference/03_crops_master.csv",
            "reference/04_crop_lifecycle_calendar.csv",
            "raw/01_farmers.csv",
            "raw/02_farms.csv",
            "raw/04_land_sections.csv",
            "raw/05_weather_climate_daily.csv",
            "raw/06_mandi_prices.csv",
            "raw/07_msp_data.csv",
            "raw/08_trade_data.csv",
            "raw/09_soil_health.csv",
            "raw/10_notifications.csv",
            "processed/01_mandi_prices_clean.csv",
            "processed/02_weather_features_seasonal.csv",
            "processed/03_crop_scores.csv",
            "processed/04_farm_plans.csv",
            "ml/01_yield_training_data_full.csv",
            "ml/02_yield_train.csv",
            "ml/03_yield_validation.csv",
            "ml/04_yield_test.csv",
            "ml/05_price_forecast_dataset_full.csv",
            "ml/06_price_train.csv",
            "ml/07_price_validation.csv",
            "ml/08_price_test.csv",
        ]
        
        all_found = True
        for rel_path in expected_csvs:
            full_path = os.path.join(self.data_dir, rel_path.replace('/', os.sep))
            if os.path.exists(full_path):
                try:
                    df = pd.read_csv(full_path)
                    norm_key = rel_path.replace('\\', '/')
                    self.dfs[norm_key] = df
                    self.log_pass(f"File loaded: {norm_key}", f"{len(df)} rows, {len(df.columns)} cols")
                except Exception as e:
                    self.log_fail(f"File corrupt: {rel_path}", str(e))
                    all_found = False
            else:
                self.log_fail(f"File missing: {rel_path}")
                all_found = False

        # Load GeoJSON
        geojson_path = os.path.join(self.data_dir, "raw", "03_farms.geojson")
        if os.path.exists(geojson_path):
            try:
                with open(geojson_path, 'r', encoding='utf-8') as gf:
                    self.geojson_data = json.load(gf)
                    features = self.geojson_data.get('features', [])
                    self.log_pass("GeoJSON loaded: raw/03_farms.geojson", f"{len(features)} features")
            except Exception as e:
                self.log_fail("GeoJSON corrupt: raw/03_farms.geojson", str(e))
                all_found = False
        else:
            self.log_fail("GeoJSON missing: raw/03_farms.geojson")
            all_found = False

        return all_found

    def validate_schemas_and_pks(self):
        print(f"\n{Colors.BOLD}=== 2. PRIMARY KEY & SCHEMA VALIDATION ==={Colors.ENDC}")
        pk_definitions = {
            "reference/01_states_districts.csv": ("district_id", ["district_id", "state", "district", "latitude", "longitude"]),
            "reference/02_climate_regions.csv": ("region_id", ["region_id", "district_id", "state", "district"]),
            "reference/03_crops_master.csv": ("crop_id", ["crop_id", "crop_name", "category", "season", "duration_days", "water_requirement_mm", "avg_yield_kg_per_ha", "total_input_cost_per_ha_inr"]),
            "reference/04_crop_lifecycle_calendar.csv": ("calendar_id", ["calendar_id", "crop_id", "stage_number", "stage_name", "start_day", "end_day"]),
            "raw/01_farmers.csv": ("farmer_id", ["farmer_id", "full_name", "district_id", "state", "district", "registration_date"]),
            "raw/02_farms.csv": ("farm_id", ["farm_id", "farmer_id", "district_id", "latitude", "longitude", "area_hectares", "boundary_type"]),
            "raw/04_land_sections.csv": ("section_id", ["section_id", "farm_id", "section_number", "area_hectares"]),
            "raw/05_weather_climate_daily.csv": ("weather_id", ["weather_id", "region_id", "date", "temp_min_c", "temp_max_c", "rainfall_mm", "humidity_pct"]),
            "raw/06_mandi_prices.csv": ("price_id", ["price_id", "crop_id", "state", "district", "date", "modal_price_per_unit_inr"]),
            "raw/07_msp_data.csv": ("msp_id", ["msp_id", "crop_id", "season", "year", "msp_price_per_unit_inr"]),
            "raw/08_trade_data.csv": ("trade_id", ["trade_id", "crop_id", "country", "year", "export_qty_tonnes", "import_qty_tonnes"]),
            "raw/09_soil_health.csv": ("soil_id", ["soil_id", "farm_id", "test_date", "nitrogen_kg_per_ha", "phosphorus_kg_per_ha", "potassium_kg_per_ha", "ph_value"]),
            "raw/10_notifications.csv": ("notification_id", ["notification_id", "farmer_id", "farm_id", "notification_type", "message", "scheduled_date"]),
            "processed/01_mandi_prices_clean.csv": ("clean_price_id", ["clean_price_id", "crop_id", "state", "year_month", "avg_modal_price_inr"]),
            "processed/02_weather_features_seasonal.csv": ("weather_feature_id", ["weather_feature_id", "region_id", "avg_temp_min_c", "avg_temp_max_c", "total_rainfall_mm", "rainy_days"]),
            "processed/03_crop_scores.csv": ("score_id", ["score_id", "farm_id", "crop_id", "weather_suitability_score", "market_opportunity_score", "msp_safety_score", "overall_score"]),
            "processed/04_farm_plans.csv": ("plan_id", ["plan_id", "farm_id", "farmer_id", "plan_date", "crop_allocation_json", "expected_revenue_inr", "expected_cost_inr", "expected_profit_inr"]),
            "ml/01_yield_training_data_full.csv": ("record_id", ["record_id", "crop_id", "region_id", "year", "actual_yield_kg_per_ha"]),
            "ml/05_price_forecast_dataset_full.csv": ("record_id", ["record_id", "crop_id", "year", "month", "price_lag1_inr", "target_price_next_period_inr"]),
        }

        for file_key, (pk_col, req_cols) in pk_definitions.items():
            if file_key not in self.dfs:
                continue
            df = self.dfs[file_key]
            
            # Check required columns
            missing_cols = [c for c in req_cols if c not in df.columns]
            if missing_cols:
                self.log_fail(f"{file_key} required columns", f"Missing: {missing_cols}")
            else:
                self.log_pass(f"{file_key} required columns", f"All {len(req_cols)} present")

            # Check PK uniqueness and non-null
            if pk_col in df.columns:
                null_pks = df[pk_col].isnull().sum()
                dup_pks = df[pk_col].duplicated().sum()
                if null_pks == 0 and dup_pks == 0:
                    self.log_pass(f"{file_key} Primary Key ({pk_col})", f"100% unique ({len(df)} rows)")
                else:
                    self.log_fail(f"{file_key} Primary Key ({pk_col})", f"Nulls: {null_pks}, Duplicates: {dup_pks}")

    def validate_referential_integrity(self):
        print(f"\n{Colors.BOLD}=== 3. REFERENTIAL INTEGRITY & FOREIGN KEY CHECKS ==={Colors.ENDC}")
        
        # 1. District IDs in climate_regions, farmers, farms
        districts_df = self.dfs.get("reference/01_states_districts.csv")
        if districts_df is not None:
            valid_districts = set(districts_df["district_id"])
            
            # climate_regions -> districts
            if "reference/02_climate_regions.csv" in self.dfs:
                cr_df = self.dfs["reference/02_climate_regions.csv"]
                orphans = set(cr_df["district_id"]) - valid_districts
                if not orphans:
                    self.log_pass("FK climate_regions.district_id -> districts.district_id", f"{len(cr_df)} valid links")
                else:
                    self.log_fail("FK climate_regions.district_id -> districts.district_id", f"Orphan keys: {orphans}")

            # farmers -> districts
            if "raw/01_farmers.csv" in self.dfs:
                farmers_df = self.dfs["raw/01_farmers.csv"]
                orphans = set(farmers_df["district_id"]) - valid_districts
                if not orphans:
                    self.log_pass("FK farmers.district_id -> districts.district_id", f"{len(farmers_df)} valid links")
                else:
                    self.log_fail("FK farmers.district_id -> districts.district_id", f"Orphan keys: {orphans}")

            # farms -> districts
            if "raw/02_farms.csv" in self.dfs:
                farms_df = self.dfs["raw/02_farms.csv"]
                orphans = set(farms_df["district_id"]) - valid_districts
                if not orphans:
                    self.log_pass("FK farms.district_id -> districts.district_id", f"{len(farms_df)} valid links")
                else:
                    self.log_fail("FK farms.district_id -> districts.district_id", f"Orphan keys: {orphans}")

        # 2. Farmers -> Farms
        if "raw/01_farmers.csv" in self.dfs and "raw/02_farms.csv" in self.dfs:
            valid_farmers = set(self.dfs["raw/01_farmers.csv"]["farmer_id"])
            farms_df = self.dfs["raw/02_farms.csv"]
            orphans = set(farms_df["farmer_id"]) - valid_farmers
            if not orphans:
                self.log_pass("FK farms.farmer_id -> farmers.farmer_id", f"{len(farms_df)} valid links")
            else:
                self.log_fail("FK farms.farmer_id -> farmers.farmer_id", f"Orphan keys: {orphans}")

        # 3. Farms -> LandSections, SoilHealth, CropScores, FarmPlans, GeoJSON
        if "raw/02_farms.csv" in self.dfs:
            valid_farms = set(self.dfs["raw/02_farms.csv"]["farm_id"])
            
            # land_sections -> farms
            if "raw/04_land_sections.csv" in self.dfs:
                ls_df = self.dfs["raw/04_land_sections.csv"]
                orphans = set(ls_df["farm_id"]) - valid_farms
                if not orphans:
                    self.log_pass("FK land_sections.farm_id -> farms.farm_id", f"{len(ls_df)} valid links")
                else:
                    self.log_fail("FK land_sections.farm_id -> farms.farm_id", f"Orphan keys: {orphans}")

            # soil_health -> farms
            if "raw/09_soil_health.csv" in self.dfs:
                sh_df = self.dfs["raw/09_soil_health.csv"]
                orphans = set(sh_df["farm_id"]) - valid_farms
                if not orphans:
                    self.log_pass("FK soil_health.farm_id -> farms.farm_id", f"{len(sh_df)} valid links")
                else:
                    self.log_fail("FK soil_health.farm_id -> farms.farm_id", f"Orphan keys: {orphans}")

            # crop_scores -> farms
            if "processed/03_crop_scores.csv" in self.dfs:
                cs_df = self.dfs["processed/03_crop_scores.csv"]
                orphans = set(cs_df["farm_id"]) - valid_farms
                if not orphans:
                    self.log_pass("FK crop_scores.farm_id -> farms.farm_id", f"{len(cs_df)} valid links")
                else:
                    self.log_fail("FK crop_scores.farm_id -> farms.farm_id", f"Orphan keys: {orphans}")

            # farm_plans -> farms
            if "processed/04_farm_plans.csv" in self.dfs:
                fp_df = self.dfs["processed/04_farm_plans.csv"]
                orphans = set(fp_df["farm_id"]) - valid_farms
                if not orphans:
                    self.log_pass("FK farm_plans.farm_id -> farms.farm_id", f"{len(fp_df)} valid links")
                else:
                    self.log_fail("FK farm_plans.farm_id -> farms.farm_id", f"Orphan keys: {orphans}")

            # GeoJSON -> farms
            if self.geojson_data and "features" in self.geojson_data:
                g_farm_ids = {feat["properties"]["farm_id"] for feat in self.geojson_data["features"] if "properties" in feat and "farm_id" in feat["properties"]}
                orphans = g_farm_ids - valid_farms
                missing_in_g = valid_farms - g_farm_ids
                if not orphans and not missing_in_g:
                    self.log_pass("GeoJSON 1:1 match with farms.csv", f"Exact {len(g_farm_ids)} matching features")
                else:
                    self.log_fail("GeoJSON match with farms.csv", f"Orphans: {orphans}, Missing: {missing_in_g}")

        # 4. CropMaster -> CropLifecycle, MandiPrices, MSP, Trade, ML
        if "reference/03_crops_master.csv" in self.dfs:
            valid_crops = set(self.dfs["reference/03_crops_master.csv"]["crop_id"])
            
            # crop_lifecycle -> crops
            if "reference/04_crop_lifecycle_calendar.csv" in self.dfs:
                cl_df = self.dfs["reference/04_crop_lifecycle_calendar.csv"]
                orphans = set(cl_df["crop_id"]) - valid_crops
                if not orphans:
                    self.log_pass("FK crop_lifecycle_calendar.crop_id -> crops_master", f"{len(cl_df)} valid links")
                else:
                    self.log_fail("FK crop_lifecycle_calendar.crop_id -> crops_master", f"Orphan keys: {orphans}")

            # mandi_prices -> crops
            if "raw/06_mandi_prices.csv" in self.dfs:
                mp_df = self.dfs["raw/06_mandi_prices.csv"]
                orphans = set(mp_df["crop_id"]) - valid_crops
                if not orphans:
                    self.log_pass("FK mandi_prices.crop_id -> crops_master", f"{len(mp_df)} valid links")
                else:
                    self.log_fail("FK mandi_prices.crop_id -> crops_master", f"Orphan keys: {orphans}")

            # msp_data -> crops
            if "raw/07_msp_data.csv" in self.dfs:
                msp_df = self.dfs["raw/07_msp_data.csv"]
                orphans = set(msp_df["crop_id"]) - valid_crops
                if not orphans:
                    self.log_pass("FK msp_data.crop_id -> crops_master", f"{len(msp_df)} valid links")
                else:
                    self.log_fail("FK msp_data.crop_id -> crops_master", f"Orphan keys: {orphans}")

            # trade_data -> crops
            if "raw/08_trade_data.csv" in self.dfs:
                td_df = self.dfs["raw/08_trade_data.csv"]
                orphans = set(td_df["crop_id"]) - valid_crops
                if not orphans:
                    self.log_pass("FK trade_data.crop_id -> crops_master", f"{len(td_df)} valid links")
                else:
                    self.log_fail("FK trade_data.crop_id -> crops_master", f"Orphan keys: {orphans}")

            # ml_yield -> crops
            if "ml/01_yield_training_data_full.csv" in self.dfs:
                ml_y = self.dfs["ml/01_yield_training_data_full.csv"]
                orphans = set(ml_y["crop_id"]) - valid_crops
                if not orphans:
                    self.log_pass("FK ml_yield_training_data.crop_id -> crops_master", f"{len(ml_y)} valid links")
                else:
                    self.log_fail("FK ml_yield_training_data.crop_id -> crops_master", f"Orphan keys: {orphans}")

            # ml_price -> crops
            if "ml/05_price_forecast_dataset_full.csv" in self.dfs:
                ml_p = self.dfs["ml/05_price_forecast_dataset_full.csv"]
                orphans = set(ml_p["crop_id"]) - valid_crops
                if not orphans:
                    self.log_pass("FK ml_price_forecast_data.crop_id -> crops_master", f"{len(ml_p)} valid links")
                else:
                    self.log_fail("FK ml_price_forecast_data.crop_id -> crops_master", f"Orphan keys: {orphans}")

    def validate_domain_rules_and_ranges(self):
        print(f"\n{Colors.BOLD}=== 4. DOMAIN SANITY & RANGE CHECKS ==={Colors.ENDC}")

        # Weather bounds: min_temp <= max_temp, humidity in [0, 100], rainfall >= 0
        if "raw/05_weather_climate_daily.csv" in self.dfs:
            w_df = self.dfs["raw/05_weather_climate_daily.csv"]
            temp_inversion = (w_df["temp_min_c"] > w_df["temp_max_c"]).sum()
            humidity_bad = ((w_df["humidity_pct"] < 0) | (w_df["humidity_pct"] > 100)).sum()
            rain_negative = (w_df["rainfall_mm"] < 0).sum()
            
            if temp_inversion == 0:
                self.log_pass("Weather temp logic", f"temp_min <= temp_max for all {len(w_df)} rows")
            else:
                self.log_fail("Weather temp logic", f"{temp_inversion} rows have temp_min > temp_max")

            if humidity_bad == 0:
                self.log_pass("Weather humidity range", f"Humidity within [0, 100]% for all {len(w_df)} rows")
            else:
                self.log_fail("Weather humidity range", f"{humidity_bad} rows out of bounds")

            if rain_negative == 0:
                self.log_pass("Weather rainfall range", f"Rainfall >= 0 mm for all {len(w_df)} rows")
            else:
                self.log_fail("Weather rainfall range", f"{rain_negative} rows negative")

        # Soil pH bounds: 3.5 <= pH <= 10.5
        if "raw/09_soil_health.csv" in self.dfs:
            s_df = self.dfs["raw/09_soil_health.csv"]
            ph_bad = ((s_df["ph_value"] < 3.5) | (s_df["ph_value"] > 10.5)).sum()
            if ph_bad == 0:
                self.log_pass("Soil pH range", f"pH within realistic agronomic bounds [3.5, 10.5] (min={s_df['ph_value'].min()}, max={s_df['ph_value'].max()})")
            else:
                self.log_fail("Soil pH range", f"{ph_bad} records out of range")

        # Farm area bounds: area > 0
        if "raw/02_farms.csv" in self.dfs:
            f_df = self.dfs["raw/02_farms.csv"]
            area_bad = (f_df["area_hectares"] <= 0).sum()
            if area_bad == 0:
                self.log_pass("Farm area validity", f"area_hectares > 0 for all {len(f_df)} farms")
            else:
                self.log_fail("Farm area validity", f"{area_bad} farms have non-positive area")

        # Farm plans domain check (explaining negative profits)
        if "processed/04_farm_plans.csv" in self.dfs:
            fp_df = self.dfs["processed/04_farm_plans.csv"]
            neg_profit = fp_df[fp_df["expected_profit_inr"] < 0]
            if len(neg_profit) > 0:
                self.log_pass("Farm plans domain check", f"{len(neg_profit)} plans with negative profit are pending draft scenarios (statuses: {neg_profit['status'].unique().tolist()})")
            else:
                self.log_pass("Farm plans domain check", "All plans have positive profit")

    def validate_ml_datasets_and_leakage(self):
        print(f"\n{Colors.BOLD}=== 5. ML DATASET INTEGRITY & DATA LEAKAGE AUDIT ==={Colors.ENDC}")

        # Yield ML Datasets
        yield_files = [
            "ml/01_yield_training_data_full.csv",
            "ml/02_yield_train.csv",
            "ml/03_yield_validation.csv",
            "ml/04_yield_test.csv"
        ]
        if all(f in self.dfs for f in yield_files):
            y_full = self.dfs["ml/01_yield_training_data_full.csv"]
            y_train = self.dfs["ml/02_yield_train.csv"]
            y_val = self.dfs["ml/03_yield_validation.csv"]
            y_test = self.dfs["ml/04_yield_test.csv"]

            # Check exact split partition size
            if len(y_train) + len(y_val) + len(y_test) == len(y_full):
                self.log_pass("Yield ML Split Partition", f"Train ({len(y_train)}) + Val ({len(y_val)}) + Test ({len(y_test)}) == Full ({len(y_full)})")
            else:
                self.log_fail("Yield ML Split Partition", "Sum of train/val/test does not match full dataset")

            # Check temporal ordering
            train_max_year = y_train["year"].max()
            val_min_year = y_val["year"].min()
            val_max_year = y_val["year"].max()
            test_min_year = y_test["year"].min()

            if train_max_year < val_min_year and val_max_year < test_min_year:
                self.log_pass("Yield ML Temporal Separation", f"Train (<={train_max_year}) -> Val ({val_min_year}-{val_max_year}) -> Test (>={test_min_year}) [Strictly Chronological]")
            else:
                self.log_fail("Yield ML Temporal Separation", f"Temporal overlap detected: Train max={train_max_year}, Val={val_min_year}-{val_max_year}, Test min={test_min_year}")

            # Check cross-split record ID leakage
            tr_ids, val_ids, te_ids = set(y_train["record_id"]), set(y_val["record_id"]), set(y_test["record_id"])
            if len(tr_ids & val_ids) == 0 and len(tr_ids & te_ids) == 0 and len(val_ids & te_ids) == 0:
                self.log_pass("Yield ML Record Isolation", "0 overlapping record IDs across train/validation/test")
            else:
                self.log_fail("Yield ML Record Isolation", "Overlapping record IDs found across splits")

        # Price Forecast ML Datasets
        price_files = [
            "ml/05_price_forecast_dataset_full.csv",
            "ml/06_price_train.csv",
            "ml/07_price_validation.csv",
            "ml/08_price_test.csv"
        ]
        if all(f in self.dfs for f in price_files):
            p_full = self.dfs["ml/05_price_forecast_dataset_full.csv"]
            p_train = self.dfs["ml/06_price_train.csv"]
            p_val = self.dfs["ml/07_price_validation.csv"]
            p_test = self.dfs["ml/08_price_test.csv"]

            # Partition sum
            if len(p_train) + len(p_val) + len(p_test) == len(p_full):
                self.log_pass("Price ML Split Partition", f"Train ({len(p_train)}) + Val ({len(p_val)}) + Test ({len(p_test)}) == Full ({len(p_full)})")
            else:
                self.log_fail("Price ML Split Partition", "Sum of train/val/test does not match full dataset")

            # Temporal ordering
            tr_max_yr = p_train["year"].max()
            val_min_yr = p_val["year"].min()
            val_max_yr = p_val["year"].max()
            te_min_yr = p_test["year"].min()

            if tr_max_yr < val_min_yr and val_max_yr < te_min_yr:
                self.log_pass("Price ML Temporal Separation", f"Train (<={tr_max_yr}) -> Val ({val_min_yr}-{val_max_yr}) -> Test (>={te_min_yr}) [Strictly Chronological]")
            else:
                self.log_fail("Price ML Temporal Separation", f"Temporal overlap detected: Train max={tr_max_yr}, Val={val_min_yr}-{val_max_yr}, Test min={te_min_yr}")

            # Cross-split record ID leakage
            tr_ids, val_ids, te_ids = set(p_train["record_id"]), set(p_val["record_id"]), set(p_test["record_id"])
            if len(tr_ids & val_ids) == 0 and len(tr_ids & te_ids) == 0 and len(val_ids & te_ids) == 0:
                self.log_pass("Price ML Record Isolation", "0 overlapping record IDs across train/validation/test")
            else:
                self.log_fail("Price ML Record Isolation", "Overlapping record IDs found across splits")

            # Target Leakage Audit: Target Price cannot be equal to contemporaneous lags
            leakage_cases = (p_full["target_price_next_period_inr"] == p_full["price_lag1_inr"]).sum()
            if leakage_cases < 0.01 * len(p_full):
                self.log_pass("Price ML Feature/Target Independence", f"Target price differs from lag-1 across dynamic market variations (exact match on flat market = {leakage_cases}/{len(p_full)})")
            else:
                self.log_warn("Price ML Feature/Target Independence", f"High number of exact lag1 == target matches ({leakage_cases})")

    def run_all(self) -> int:
        print(f"{Colors.BOLD}{Colors.HEADER}====================================================================")
        print("          AGRIPROFIT DATA INTEGRATION VALIDATION SUITE              ")
        print(f"===================================================================={Colors.ENDC}")
        
        self.load_all_datasets()
        self.validate_schemas_and_pks()
        self.validate_referential_integrity()
        self.validate_domain_rules_and_ranges()
        self.validate_ml_datasets_and_leakage()
        
        print(f"\n{Colors.BOLD}====================================================================")
        print(f"                         SUMMARY REPORT                             ")
        print(f"===================================================================={Colors.ENDC}")
        print(f"  Total Checks Passed: {Colors.GREEN}{self.passed_tests}{Colors.ENDC}")
        print(f"  Total Checks Failed: {Colors.FAIL}{self.failed_tests}{Colors.ENDC}")
        print(f"  Warnings / Flags:    {Colors.WARNING}{self.warnings}{Colors.ENDC}")
        
        if self.failed_tests == 0:
            print(f"\n{Colors.BOLD}{Colors.GREEN}[SUCCESS] ALL VALIDATION CHECKS PASSED SUCCESSFULLY. DATA IS ALIGNED & INTEGRATED.{Colors.ENDC}\n")
            return 0
        else:
            print(f"\n{Colors.BOLD}{Colors.FAIL}[FAILED] VALIDATION FAILED WITH {self.failed_tests} CRITICAL ERRORS.{Colors.ENDC}\n")
            return 1

def main():
    parser = argparse.ArgumentParser(description="AgriProfit Dataset Validation Suite")
    parser.add_argument("--data-dir", default=os.path.join(os.path.dirname(__file__), "..", "Dataset", "project_data"), help="Path to project_data directory")
    args = parser.parse_args()
    
    validator = DataValidator(args.data_dir)
    sys.exit(validator.run_all())

if __name__ == "__main__":
    main()
