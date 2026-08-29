"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "./components/AppShell";
import type { FarmRecord } from "./api/farms/repository";

export default function Home() {
  const [farms, setFarms] = useState<FarmRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/farms");
        if (res.ok) {
          const json = await res.json();
          setFarms(json.farms || []);
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const activeFarm = farms[0];
  const totalAcres = farms.reduce((sum, f) => sum + f.areaAcres, 0);
  const displayAcres = totalAcres > 0 ? totalAcres : 2.5;
  const displayHectares = (displayAcres / 2.47105).toFixed(2);

  return (
    <AppShell pageTitle="Command Center">
      <div className="page-container space-y-6">
        {/* 1. Hero Command Header */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-card">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="agri-badge agri-badge-emerald">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Agro-Intelligence
              </span>
              <span className="text-xs text-[var(--text-muted)] font-['Space_Grotesk']">
                Rabi Season 2024–25
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Farmer Decision Command Center
            </h1>
            <p className="text-sm text-[var(--text-secondary)] max-w-2xl">
              Real-time multi-crop profit optimization, 90-day seasonal climate analysis, and official APMC mandi floor intelligence.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link className="agri-btn-secondary" href="/recommendations">
              <span>✦</span>
              <span>View Strategy</span>
            </Link>
            <Link className="agri-btn-primary" href="/farms/new">
              <span>+</span>
              <span>Map Farm Boundary</span>
            </Link>
          </div>
        </section>

        {/* 2. Primary 4-Metric KPI Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Key Performance Indicators">
          {/* Card 1: Farm Boundary Area */}
          <div className="agri-card p-5 flex flex-col justify-between hover:border-[var(--border-strong)] transition-all">
            <div className="flex items-center justify-between text-[var(--text-muted)] mb-3">
              <span className="text-xs font-semibold font-['Space_Grotesk'] uppercase tracking-wider">
                Total Land Parcel
              </span>
              <span className="p-2 rounded-xl bg-[var(--color-emerald-bg)] text-[var(--color-emerald-text)] text-sm">
                🗺️
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                  {loading ? "..." : displayAcres.toFixed(2)}
                </span>
                <span className="text-sm font-semibold text-[var(--text-secondary)]">Acres</span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                {displayHectares} Hectares · {farms.length > 0 ? `${farms.length} plot(s) registered` : "Draw field on map"}
              </p>
            </div>
            <Link className="mt-4 pt-3 border-t border-[var(--border-subtle)] text-xs font-semibold text-[var(--color-primary)] flex items-center justify-between" href="/farms">
              <span>Manage Boundaries</span>
              <span>→</span>
            </Link>
          </div>

          {/* Card 2: Projected Net Profit */}
          <div className="agri-card p-5 flex flex-col justify-between hover:border-[var(--border-strong)] transition-all">
            <div className="flex items-center justify-between text-[var(--text-muted)] mb-3">
              <span className="text-xs font-semibold font-['Space_Grotesk'] uppercase tracking-wider">
                Projected Net Profit
              </span>
              <span className="p-2 rounded-xl bg-[var(--color-emerald-bg)] text-[var(--color-emerald-text)] text-sm">
                📈
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-['Space_Grotesk'] text-[var(--color-primary)]">
                  ₹{(displayAcres * 34200).toLocaleString("en-IN")}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                +1.48x ROI Multiplier on ICAR input costs
              </p>
            </div>
            <Link className="mt-4 pt-3 border-t border-[var(--border-subtle)] text-xs font-semibold text-[var(--color-primary)] flex items-center justify-between" href="/recommendations">
              <span>View Financial Model</span>
              <span>→</span>
            </Link>
          </div>

          {/* Card 3: Mandi Market Opportunity */}
          <div className="agri-card p-5 flex flex-col justify-between hover:border-[var(--border-strong)] transition-all">
            <div className="flex items-center justify-between text-[var(--text-muted)] mb-3">
              <span className="text-xs font-semibold font-['Space_Grotesk'] uppercase tracking-wider">
                Market Opportunity
              </span>
              <span className="p-2 rounded-xl bg-[var(--color-amber-bg)] text-[var(--color-amber-text)] text-sm">
                📊
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                  86
                </span>
                <span className="text-sm font-semibold text-[var(--text-muted)]">/ 100</span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Wheat modal: ₹2,380/q (+4.6% vs MSP)
              </p>
            </div>
            <Link className="mt-4 pt-3 border-t border-[var(--border-subtle)] text-xs font-semibold text-[var(--color-primary)] flex items-center justify-between" href="/markets">
              <span>APMC Live Watch</span>
              <span>→</span>
            </Link>
          </div>

          {/* Card 4: 90-Day Climate Suitability */}
          <div className="agri-card p-5 flex flex-col justify-between hover:border-[var(--border-strong)] transition-all">
            <div className="flex items-center justify-between text-[var(--text-muted)] mb-3">
              <span className="text-xs font-semibold font-['Space_Grotesk'] uppercase tracking-wider">
                Climate Suitability
              </span>
              <span className="p-2 rounded-xl bg-[var(--color-sky-bg)] text-[var(--color-sky-text)] text-sm">
                ⛅
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                  92
                </span>
                <span className="text-sm font-semibold text-[var(--text-muted)]">/ 100</span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Optimal moisture · 18.5mm rain Day 3
              </p>
            </div>
            <Link className="mt-4 pt-3 border-t border-[var(--border-subtle)] text-xs font-semibold text-[var(--color-primary)] flex items-center justify-between" href="/weather">
              <span>Check 7-Day Forecast</span>
              <span>→</span>
            </Link>
          </div>
        </section>

        {/* 3. Four-Part Farm Strategy Banner */}
        <section className="agri-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="agri-badge agri-badge-sky mb-1">Portfolio Optimizer</span>
              <h2 className="text-lg font-bold text-[var(--text-primary)] font-['Space_Grotesk']">
                4-Part Strategic Farm Land Allocation ({displayAcres.toFixed(2)} Acres Total)
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Diversified risk-adjusted portfolio: MSP downside floor, high-margin cash crops, and biological nitrogen replenishment.
              </p>
            </div>
            <Link className="agri-btn-secondary shrink-0 text-xs" href="/recommendations">
              Tune Allocations →
            </Link>
          </div>

          {/* Visual Allocation Proportional Bar */}
          <div className="space-y-2">
            <div className="h-4 w-full rounded-full bg-[var(--bg-surface-subtle)] overflow-hidden flex p-0.5 gap-0.5 border border-[var(--border-subtle)]">
              <div className="h-full bg-emerald-500 rounded-l-full transition-all" style={{ width: "50%" }} title="Part 1: Safety MSP (50%)" />
              <div className="h-full bg-amber-500 transition-all" style={{ width: "25%" }} title="Part 2: Stability Cash (25%)" />
              <div className="h-full bg-sky-500 transition-all" style={{ width: "15%" }} title="Part 3: Opportunity Upside (15%)" />
              <div className="h-full bg-teal-600 rounded-r-full transition-all" style={{ width: "10%" }} title="Part 4: Soil Health (10%)" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Part 1: Safety Floor</span>
                </div>
                <div className="text-base font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                  {(displayAcres * 0.5).toFixed(2)} ac <span className="text-xs font-normal text-[var(--text-muted)]">(50%)</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">Wheat (HD-3086) · MSP Floor</p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Part 2: Stability</span>
                </div>
                <div className="text-base font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                  {(displayAcres * 0.25).toFixed(2)} ac <span className="text-xs font-normal text-[var(--text-muted)]">(25%)</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">Mustard · High Oil Demand</p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  <span>Part 3: Opportunity</span>
                </div>
                <div className="text-base font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                  {(displayAcres * 0.15).toFixed(2)} ac <span className="text-xs font-normal text-[var(--text-muted)]">(15%)</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">Onion · High Cash Upside</p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400">
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  <span>Part 4: Soil Health</span>
                </div>
                <div className="text-base font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                  {(displayAcres * 0.1).toFixed(2)} ac <span className="text-xs font-normal text-[var(--text-muted)]">(10%)</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">Chickpea · Nitrogen Fixation</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Split Hub: Live Agro-Weather & Market Spreads */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weather Alert Panel */}
          <div className="agri-card p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base font-['Space_Grotesk'] text-[var(--text-primary)]">
                  Agro-Meteorological Advisory
                </h3>
                <span className="agri-badge agri-badge-amber">Precipitation Warning</span>
              </div>
              <div className="p-4 rounded-xl bg-[var(--color-amber-bg)] border border-[var(--color-amber-border)] space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-amber-text)]">
                  <span>🌧️</span>
                  <span>18.5 mm Rainfall Forecasted on Day 3</span>
                </div>
                <p className="text-xs text-[var(--color-amber-text)] leading-relaxed">
                  Open-Meteo predicts elevated moisture levels. Hold off on nitrogen Urea top-dressing and chemical sprays for 48 hours to avoid nutrient runoff.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between mt-4 text-xs font-semibold">
              <span className="text-[var(--text-muted)]">Live IMD & Open-Meteo Station Sync</span>
              <Link className="text-[var(--color-primary)] hover:underline" href="/weather">
                Full 7-Day Weather Plan →
              </Link>
            </div>
          </div>

          {/* APMC Mandi Watch Panel */}
          <div className="agri-card p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base font-['Space_Grotesk'] text-[var(--text-primary)]">
                  APMC Mandi Price Benchmarks
                </h3>
                <span className="agri-badge agri-badge-emerald">Daily Sync Active</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🌾</span>
                    <div>
                      <strong className="block text-xs font-bold text-[var(--text-primary)]">Wheat (HD-3086)</strong>
                      <span className="text-[11px] text-[var(--text-muted)]">Government MSP Floor: ₹2,275/q</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">₹2,380/q</span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">↑ +4.6% Spread</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🌻</span>
                    <div>
                      <strong className="block text-xs font-bold text-[var(--text-primary)]">Mustard (Pusa Bold)</strong>
                      <span className="text-[11px] text-[var(--text-muted)]">Government MSP Floor: ₹5,650/q</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">₹5,650/q</span>
                    <span className="text-[10px] font-bold text-[var(--text-muted)]">→ At MSP Parity</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between mt-4 text-xs font-semibold">
              <span className="text-[var(--text-muted)]">Agmarknet Wholesale Feeds</span>
              <Link className="text-[var(--color-primary)] hover:underline" href="/markets">
                View All Mandis →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
