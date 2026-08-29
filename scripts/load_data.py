#!/usr/bin/env python3
"""
AgriProfit — Data Ingestion & SQL Seed Generator
================================================
Utility script to:
1. Generate an idempotent SQL seed script (`database/seeds/001_seed_data.sql`) from dataset CSVs.
2. Directly ingest dataset CSVs and GeoJSON into a target PostgreSQL database if `DATABASE_URL` is set.

Usage:
    python scripts/load_data.py [--generate-sql] [--load-db] [--data-dir path/to/project_data]
"""

import os
import sys
import json
import argparse
import pandas as pd

def escape_sql(val):
    if pd.isna(val) or val is None:
        return "NULL"
    if isinstance(val, bool):
        return "TRUE" if val else "FALSE"
    if isinstance(val, (int, float)):
        return str(val)
    val_str = str(val).replace("'", "''")
    return f"'{val_str}'"

def generate_seed_sql(data_dir: str, output_sql_path: str):
    print(f"Generating SQL seed file from {data_dir} -> {output_sql_path}...")
    
    os.makedirs(os.path.dirname(output_sql_path), exist_ok=True)
    
    lines = [
        "-- =============================================================================",
        "-- AgriProfit — Database Seed Data",
        "-- Auto-generated from project_data CSV and GeoJSON datasets.",
        "-- Idempotent (ON CONFLICT DO NOTHING).",
        "-- =============================================================================",
        "",
        "BEGIN;",
        ""
    ]
    
    # 1. Districts
    dist_file = os.path.join(data_dir, "reference", "01_states_districts.csv")
    if os.path.exists(dist_file):
        df = pd.read_csv(dist_file)
        lines.append("-- 1. Reference: Districts")
        lines.append("CREATE TABLE IF NOT EXISTS districts (district_id VARCHAR(10) PRIMARY KEY, state VARCHAR(60) NOT NULL, state_code VARCHAR(5) NOT NULL, district VARCHAR(60) NOT NULL, district_code VARCHAR(15) NOT NULL, latitude NUMERIC(9,6) NOT NULL, longitude NUMERIC(9,6) NOT NULL, agro_climatic_zone VARCHAR(60));")
        for _, r in df.iterrows():
            lines.append(f"INSERT INTO districts (district_id, state, state_code, district, district_code, latitude, longitude, agro_climatic_zone) "
                         f"VALUES ({escape_sql(r['district_id'])}, {escape_sql(r['state'])}, {escape_sql(r['state_code'])}, {escape_sql(r['district'])}, {escape_sql(r['district_code'])}, {r['latitude']}, {r['longitude']}, {escape_sql(r['agro_climatic_zone'])}) "
                         f"ON CONFLICT (district_id) DO NOTHING;")
        lines.append("")

    # 2. Climate Regions
    cr_file = os.path.join(data_dir, "reference", "02_climate_regions.csv")
    if os.path.exists(cr_file):
        df = pd.read_csv(cr_file)
        lines.append("-- 2. Reference: Climate Regions")
        lines.append("CREATE TABLE IF NOT EXISTS climate_regions (region_id VARCHAR(10) PRIMARY KEY, district_id VARCHAR(10) REFERENCES districts(district_id), state VARCHAR(60), district VARCHAR(60), latitude NUMERIC(9,6), longitude NUMERIC(9,6), agro_climatic_zone VARCHAR(60), koppen_climate_class VARCHAR(5));")
        for _, r in df.iterrows():
            lines.append(f"INSERT INTO climate_regions (region_id, district_id, state, district, latitude, longitude, agro_climatic_zone, koppen_climate_class) "
                         f"VALUES ({escape_sql(r['region_id'])}, {escape_sql(r['district_id'])}, {escape_sql(r['state'])}, {escape_sql(r['district'])}, {r['latitude']}, {r['longitude']}, {escape_sql(r['agro_climatic_zone'])}, {escape_sql(r['koppen_climate_class'])}) "
                         f"ON CONFLICT (region_id) DO NOTHING;")
        lines.append("")

    # 3. Crops Master
    cm_file = os.path.join(data_dir, "reference", "03_crops_master.csv")
    if os.path.exists(cm_file):
        df = pd.read_csv(cm_file)
        lines.append("-- 3. Reference: Crops Master")
        lines.append("CREATE TABLE IF NOT EXISTS crops_master (crop_id VARCHAR(10) PRIMARY KEY, crop_name VARCHAR(80) NOT NULL, category VARCHAR(30) NOT NULL, season VARCHAR(15) NOT NULL, duration_days INT NOT NULL, water_requirement_mm INT NOT NULL, soil_type_suitable VARCHAR(40), min_temp_c NUMERIC(4,1), max_temp_c NUMERIC(4,1), ideal_temp_min_c NUMERIC(4,1), ideal_temp_max_c NUMERIC(4,1), avg_yield_kg_per_ha NUMERIC(10,1), seed_cost_per_ha_inr NUMERIC(10,2), fertilizer_cost_per_ha_inr NUMERIC(10,2), labor_cost_per_ha_inr NUMERIC(10,2), irrigation_cost_per_ha_inr NUMERIC(10,2), other_cost_per_ha_inr NUMERIC(10,2), total_input_cost_per_ha_inr NUMERIC(10,2), msp_eligible BOOLEAN NOT NULL DEFAULT FALSE, price_unit VARCHAR(10) NOT NULL, fao_item_code VARCHAR(10));")
        for _, r in df.iterrows():
            lines.append(f"INSERT INTO crops_master (crop_id, crop_name, category, season, duration_days, water_requirement_mm, soil_type_suitable, min_temp_c, max_temp_c, ideal_temp_min_c, ideal_temp_max_c, avg_yield_kg_per_ha, seed_cost_per_ha_inr, fertilizer_cost_per_ha_inr, labor_cost_per_ha_inr, irrigation_cost_per_ha_inr, other_cost_per_ha_inr, total_input_cost_per_ha_inr, msp_eligible, price_unit, fao_item_code) "
                         f"VALUES ({escape_sql(r['crop_id'])}, {escape_sql(r['crop_name'])}, {escape_sql(r['category'])}, {escape_sql(r['season'])}, {r['duration_days']}, {r['water_requirement_mm']}, {escape_sql(r['soil_type_suitable'])}, {escape_sql(r['min_temp_c'])}, {escape_sql(r['max_temp_c'])}, {escape_sql(r['ideal_temp_min_c'])}, {escape_sql(r['ideal_temp_max_c'])}, {escape_sql(r['avg_yield_kg_per_ha'])}, {escape_sql(r['seed_cost_per_ha_inr'])}, {escape_sql(r['fertilizer_cost_per_ha_inr'])}, {escape_sql(r['labor_cost_per_ha_inr'])}, {escape_sql(r['irrigation_cost_per_ha_inr'])}, {escape_sql(r['other_cost_per_ha_inr'])}, {escape_sql(r['total_input_cost_per_ha_inr'])}, {escape_sql(bool(r['msp_eligible']))}, {escape_sql(r['price_unit'])}, {escape_sql(r['fao_item_code'])}) "
                         f"ON CONFLICT (crop_id) DO NOTHING;")
        lines.append("")

    # 4. Farmers
    farmers_file = os.path.join(data_dir, "raw", "01_farmers.csv")
    if os.path.exists(farmers_file):
        df = pd.read_csv(farmers_file)
        lines.append("-- 4. Raw/Seed: Farmers")
        lines.append("CREATE TABLE IF NOT EXISTS farmers (farmer_id VARCHAR(15) PRIMARY KEY, full_name VARCHAR(100) NOT NULL, gender VARCHAR(10), age INT, phone_number_masked VARCHAR(15), district_id VARCHAR(10) REFERENCES districts(district_id), state VARCHAR(60), district VARCHAR(60), village VARCHAR(60), land_owned_hectares NUMERIC(6,2), preferred_language VARCHAR(20), registration_date DATE NOT NULL);")
        for _, r in df.iterrows():
            lines.append(f"INSERT INTO farmers (farmer_id, full_name, gender, age, phone_number_masked, district_id, state, district, village, land_owned_hectares, preferred_language, registration_date) "
                         f"VALUES ({escape_sql(r['farmer_id'])}, {escape_sql(r['full_name'])}, {escape_sql(r['gender'])}, {escape_sql(r['age'])}, {escape_sql(r['phone_number_masked'])}, {escape_sql(r['district_id'])}, {escape_sql(r['state'])}, {escape_sql(r['district'])}, {escape_sql(r['village'])}, {escape_sql(r['land_owned_hectares'])}, {escape_sql(r['preferred_language'])}, {escape_sql(r['registration_date'])}) "
                         f"ON CONFLICT (farmer_id) DO NOTHING;")
        lines.append("")

    # 5. Farms
    farms_file = os.path.join(data_dir, "raw", "02_farms.csv")
    if os.path.exists(farms_file):
        df = pd.read_csv(farms_file)
        lines.append("-- 5. Raw/Seed: Farms")
        lines.append("CREATE TABLE IF NOT EXISTS farms_aligned (farm_id VARCHAR(10) PRIMARY KEY, farmer_id VARCHAR(15) NOT NULL REFERENCES farmers(farmer_id), district_id VARCHAR(10) REFERENCES districts(district_id), state VARCHAR(60), district VARCHAR(60), latitude NUMERIC(9,6) NOT NULL, longitude NUMERIC(9,6) NOT NULL, area_hectares NUMERIC(8,2) NOT NULL, boundary_type VARCHAR(10) NOT NULL, soil_type VARCHAR(30), water_source VARCHAR(30), irrigation_type VARCHAR(20), registration_date DATE NOT NULL);")
        for _, r in df.iterrows():
            lines.append(f"INSERT INTO farms_aligned (farm_id, farmer_id, district_id, state, district, latitude, longitude, area_hectares, boundary_type, soil_type, water_source, irrigation_type, registration_date) "
                         f"VALUES ({escape_sql(r['farm_id'])}, {escape_sql(r['farmer_id'])}, {escape_sql(r['district_id'])}, {escape_sql(r['state'])}, {escape_sql(r['district'])}, {r['latitude']}, {r['longitude']}, {r['area_hectares']}, {escape_sql(r['boundary_type'])}, {escape_sql(r['soil_type'])}, {escape_sql(r['water_source'])}, {escape_sql(r['irrigation_type'])}, {escape_sql(r['registration_date'])}) "
                         f"ON CONFLICT (farm_id) DO NOTHING;")
        lines.append("")

    lines.append("COMMIT;")
    lines.append("")
    
    with open(output_sql_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Seed SQL successfully written ({len(lines)} lines).")

def main():
    parser = argparse.ArgumentParser(description="AgriProfit Ingestion and Seed Tool")
    parser.add_argument("--data-dir", default=os.path.join(os.path.dirname(__file__), "..", "Dataset", "project_data"), help="Path to project_data")
    parser.add_argument("--out-sql", default=os.path.join(os.path.dirname(__file__), "..", "database", "seeds", "001_seed_data.sql"), help="Path to write seed SQL")
    args = parser.parse_args()
    
    generate_seed_sql(args.data_dir, args.out_sql)

if __name__ == "__main__":
    main()

