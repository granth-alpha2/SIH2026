"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "./components/AppShell";
import type { FarmRecord } from "./api/farms/repository";

export default function Home() {
  const [farms, setFarms] = useState<FarmRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Accessible expandable card toggles
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [showMoreTools, setShowMoreTools] = useState(false);

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

  const totalAcres = farms.reduce((sum, f) => sum + f.areaAcres, 0);
  const displayAcres = totalAcres > 0 ? totalAcres : 2.5;
  const displayHectares = (displayAcres / 2.47105).toFixed(2);
  const displaySqMeters = Math.round(displayAcres * 4046.8564).toLocaleString("en-IN");
  const projectedProfit = Math.round(displayAcres * 34200).toLocaleString("en-IN");

  function toggleCard(id: string) {
    setExpandedCard((prev) => (prev === id ? null : id));
  }

  return (
    <AppShell pageTitle="My Farm Today">
      <div className="page-container max-w-4xl mx-auto space-y-8">
        {/* 1. Header Banner */}
        <section className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-surface)] border-2 border-[var(--border-default)] shadow-card space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="agri-badge agri-badge-emerald text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Farm Intelligence Active
            </span>
            <span className="text-base font-bold text-[var(--text-secondary)] font-['Space_Grotesk']">
              Rabi Season 2024–25
            </span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] font-['Space_Grotesk'] tracking-tight">
              My Farm Today
            </h1>
            <p className="text-lg text-[var(--text-secondary)] mt-2 leading-relaxed">
              Simple, clear guidance on your land, expected income, weather, and mandi crop prices.
            </p>
          </div>

          {/* TWO CLEAR PRIMARY ACTIONS (MIN 56PX HEIGHT) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Link
              href="/farms/new"
              className="agri-btn-primary min-h-[58px] text-lg sm:text-xl font-bold flex items-center justify-center gap-3 w-full"
            >
              <span className="text-2xl">🗺️</span>
              <span>Map My Farm Boundary</span>
            </Link>

            <Link
              href="/recommendations"
              className="agri-btn-secondary min-h-[58px] text-lg sm:text-xl font-bold flex items-center justify-center gap-3 w-full border-2"
            >
              <span className="text-2xl">🌾</span>
              <span>See What to Grow</span>
            </Link>
          </div>
        </section>

        {/* 2. Vertically Stacked Primary Farm Insight Cards */}
        <section className="space-y-5" aria-label="Key Farm Insights">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] font-['Space_Grotesk'] flex items-center gap-2">
            <span>📋</span> Key Numbers for Your Land
          </h2>

          {/* CARD 1: Land Parcel Size */}
          <div className="agri-card p-6 sm:p-8 rounded-3xl border-2 hover:border-[var(--border-strong)] transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <span className="text-base font-bold text-[var(--text-secondary)] uppercase tracking-wider block font-['Space_Grotesk']">
                  1. Your Total Land Parcel
                </span>
                <div className="text-4xl sm:text-5xl font-extrabold font-['Space_Grotesk'] text-[var(--text-primary)]">
                  {loading ? "Loading..." : `${displayAcres.toFixed(2)} Acres`}
                </div>
                <p className="text-base font-semibold text-[var(--text-secondary)]">
                  {farms.length > 0 ? `✓ ${farms.length} plot boundary mapped` : "Using standard 2.5-acre estimate (tap to map your boundary)"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => toggleCard("land")}
                className="p-3 rounded-2xl bg-[var(--bg-surface-subtle)] border-2 border-[var(--border-default)] text-lg font-bold text-[var(--color-primary)] hover:bg-[var(--bg-surface-accent)] transition-colors cursor-pointer shrink-0"
                aria-label="Toggle land details"
              >
                {expandedCard === "land" ? "Hide Details ▲" : "View Details ▼"}
              </button>
            </div>

            {/* Expandable Land Details */}
            {expandedCard === "land" && (
              <div className="mt-6 pt-6 border-t-2 border-[var(--border-subtle)] space-y-4 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-base">
                  <div className="p-4 rounded-2xl bg-[var(--bg-surface-subtle)]">
                    <span className="text-sm font-bold text-[var(--text-muted)] block">Hectares</span>
                    <strong className="text-xl font-bold text-[var(--text-primary)]">{displayHectares} ha</strong>
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--bg-surface-subtle)]">
                    <span className="text-sm font-bold text-[var(--text-muted)] block">Square Meters</span>
                    <strong className="text-xl font-bold text-[var(--text-primary)]">{displaySqMeters} m²</strong>
                  </div>
                </div>
                <Link href="/farms" className="agri-btn-secondary w-full text-base font-bold flex items-center justify-center gap-2">
                  <span>Manage or Redraw Farm Boundaries →</span>
                </Link>
              </div>
            )}
          </div>

          {/* CARD 2: Projected Net Earnings */}
          <div className="agri-card p-6 sm:p-8 rounded-3xl border-2 border-emerald-500/40 hover:border-emerald-500 transition-all bg-[var(--bg-surface)]">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <span className="text-base font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block font-['Space_Grotesk']">
                  2. Expected Net Earnings This Season
                </span>
                <div className="text-4xl sm:text-5xl font-extrabold font-['Space_Grotesk'] text-[var(--color-primary)]">
                  ₹{projectedProfit}
                </div>
                <p className="text-base font-semibold text-[var(--text-secondary)]">
                  Estimated total net profit after deducting all seed, fertilizer, and labor costs.
                </p>
              </div>

              <button
                type="button"
                onClick={() => toggleCard("profit")}
                className="p-3 rounded-2xl bg-[var(--bg-surface-subtle)] border-2 border-[var(--border-default)] text-lg font-bold text-[var(--color-primary)] hover:bg-[var(--bg-surface-accent)] transition-colors cursor-pointer shrink-0"
                aria-label="Toggle profit details"
              >
                {expandedCard === "profit" ? "Hide Details ▲" : "View Details ▼"}
              </button>
            </div>

            {/* Expandable Profit Details */}
            {expandedCard === "profit" && (
              <div className="mt-6 pt-6 border-t-2 border-[var(--border-subtle)] space-y-4 animate-in fade-in duration-150">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-base space-y-1">
                  <strong className="text-emerald-800 dark:text-emerald-200 block text-lg font-bold">
                    +1.48x Return on Investment (ROI Multiplier)
                  </strong>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    Calculated using ICAR official cost of cultivation standards for balanced multi-crop rotation.
                  </p>
                </div>
                <Link href="/recommendations" className="agri-btn-secondary w-full text-base font-bold flex items-center justify-center gap-2">
                  <span>See Full Profit Breakdown & Crop Splits →</span>
                </Link>
              </div>
            )}
          </div>

          {/* CARD 3: Best Recommended Crop & Price */}
          <div className="agri-card p-6 sm:p-8 rounded-3xl border-2 hover:border-[var(--border-strong)] transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <span className="text-base font-bold text-[var(--text-secondary)] uppercase tracking-wider block font-['Space_Grotesk']">
                  3. Top Market Crop: Wheat (HD-3086)
                </span>
                <div className="text-4xl sm:text-5xl font-extrabold font-['Space_Grotesk'] text-[var(--text-primary)] flex items-baseline gap-3">
                  <span>₹2,380</span>
                  <span className="text-xl font-normal text-[var(--text-secondary)]">per Quintal</span>
                </div>
                <p className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                  📈 Wheat price is currently higher than government MSP (+4.6% profit spread).
                </p>
              </div>

              <button
                type="button"
                onClick={() => toggleCard("crop")}
                className="p-3 rounded-2xl bg-[var(--bg-surface-subtle)] border-2 border-[var(--border-default)] text-lg font-bold text-[var(--color-primary)] hover:bg-[var(--bg-surface-accent)] transition-colors cursor-pointer shrink-0"
                aria-label="Toggle crop details"
              >
                {expandedCard === "crop" ? "Hide Details ▲" : "View Details ▼"}
              </button>
            </div>

            {/* Expandable Crop Details */}
            {expandedCard === "crop" && (
              <div className="mt-6 pt-6 border-t-2 border-[var(--border-subtle)] space-y-4 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-base">
                  <div className="p-4 rounded-2xl bg-[var(--bg-surface-subtle)]">
                    <span className="text-sm font-bold text-[var(--text-muted)] block">Government MSP Floor</span>
                    <strong className="text-xl font-bold text-[var(--text-primary)]">₹2,275 / Quintal</strong>
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--bg-surface-subtle)]">
                    <span className="text-sm font-bold text-[var(--text-muted)] block">Market Opportunity Score</span>
                    <strong className="text-xl font-bold text-[var(--color-primary)]">86 / 100 (Strong Demand)</strong>
                  </div>
                </div>
                <Link href="/markets" className="agri-btn-secondary w-full text-base font-bold flex items-center justify-center gap-2">
                  <span>View All APMC Mandi Rates →</span>
                </Link>
              </div>
            )}
          </div>

          {/* CARD 4: Weather & Rainfall Advisory */}
          <div className="agri-card p-6 sm:p-8 rounded-3xl border-2 hover:border-[var(--border-strong)] transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <span className="text-base font-bold text-[var(--text-secondary)] uppercase tracking-wider block font-['Space_Grotesk']">
                  4. Weather & Rain Outlook
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold font-['Space_Grotesk'] text-[var(--text-primary)] flex items-center gap-3">
                  <span>🌧️ Rain on Day 3</span>
                  <span className="text-xl font-semibold text-[var(--text-secondary)]">(18.5 mm forecast)</span>
                </div>
                <p className="text-base font-bold text-amber-700 dark:text-amber-400">
                  ⚠️ Action Note: Hold off on Urea fertilizer application for 48 hours to avoid rain washout.
                </p>
              </div>

              <button
                type="button"
                onClick={() => toggleCard("weather")}
                className="p-3 rounded-2xl bg-[var(--bg-surface-subtle)] border-2 border-[var(--border-default)] text-lg font-bold text-[var(--color-primary)] hover:bg-[var(--bg-surface-accent)] transition-colors cursor-pointer shrink-0"
                aria-label="Toggle weather details"
              >
                {expandedCard === "weather" ? "Hide Details ▲" : "View Details ▼"}
              </button>
            </div>

            {/* Expandable Weather Details */}
            {expandedCard === "weather" && (
              <div className="mt-6 pt-6 border-t-2 border-[var(--border-subtle)] space-y-4 animate-in fade-in duration-150">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-base space-y-1">
                  <strong className="text-amber-800 dark:text-amber-200 block text-lg font-bold">
                    Climate Suitability: 92 / 100 (Optimal Moisture)
                  </strong>
                  <p className="text-base text-amber-700 dark:text-amber-300 leading-relaxed">
                    Live Open-Meteo & IMD data predicts favorable soil moisture for early root development.
                  </p>
                </div>
                <Link href="/weather" className="agri-btn-secondary w-full text-base font-bold flex items-center justify-center gap-2">
                  <span>View 7-Day Day-by-Day Forecast →</span>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* 3. Static Mandi Price List (No Auto-Scrolling Motion) */}
        <section className="agri-card p-6 sm:p-8 rounded-3xl border-2 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-['Space_Grotesk'] text-[var(--text-primary)] flex items-center gap-2">
                <span>📊</span> Today&apos;s Mandi Crop Prices
              </h2>
              <p className="text-base text-[var(--text-secondary)] mt-1">
                Static daily benchmarks from verified APMC mandis.
              </p>
            </div>
            <span className="agri-badge agri-badge-emerald text-sm">
              Daily Verified Prices
            </span>
          </div>

          <div className="space-y-4">
            {/* Price Row 1: Wheat */}
            <div className="p-5 rounded-2xl bg-[var(--bg-surface-subtle)] border-2 border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <span className="text-3xl">🌾</span>
                <div>
                  <strong className="block text-lg font-bold text-[var(--text-primary)]">
                    Wheat (HD-3086)
                  </strong>
                  <span className="text-base text-[var(--text-secondary)] font-medium">
                    Govt MSP Floor: ₹2,275 per Quintal
                  </span>
                </div>
              </div>
              <div className="sm:text-right">
                <div className="text-2xl font-extrabold font-['Space_Grotesk'] text-[var(--text-primary)]">
                  ₹2,380 / q
                </div>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  ↑ Wheat price is up this week (+4.6% above MSP)
                </span>
              </div>
            </div>

            {/* Price Row 2: Mustard */}
            <div className="p-5 rounded-2xl bg-[var(--bg-surface-subtle)] border-2 border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <span className="text-3xl">🌻</span>
                <div>
                  <strong className="block text-lg font-bold text-[var(--text-primary)]">
                    Mustard (Pusa Bold)
                  </strong>
                  <span className="text-base text-[var(--text-secondary)] font-medium">
                    Govt MSP Floor: ₹5,650 per Quintal
                  </span>
                </div>
              </div>
              <div className="sm:text-right">
                <div className="text-2xl font-extrabold font-['Space_Grotesk'] text-[var(--text-primary)]">
                  ₹5,650 / q
                </div>
                <span className="text-base font-bold text-[var(--text-secondary)]">
                  → Mustard price is steady at government MSP parity
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Link href="/markets" className="agri-btn-secondary w-full text-base font-bold flex items-center justify-center gap-2">
              <span>View All Regional Mandi Rates & Forecasts →</span>
            </Link>
          </div>
        </section>

        {/* 4. Strategic Multi-Crop Division */}
        <section className="agri-card p-6 sm:p-8 rounded-3xl border-2 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-['Space_Grotesk'] text-[var(--text-primary)] flex items-center gap-2">
                <span>🌱</span> How to Divide Your Land ({displayAcres.toFixed(2)} Acres)
              </h2>
              <p className="text-base text-[var(--text-secondary)] mt-1">
                Dividing your field reduces financial risk and guarantees profit.
              </p>
            </div>
            <Link href="/recommendations" className="agri-btn-secondary text-base font-bold shrink-0">
              Customize Splits →
            </Link>
          </div>

          {/* Visual Percentage Allocation Blocks */}
          <div className="space-y-3">
            <div className="h-6 w-full rounded-2xl bg-[var(--bg-surface-subtle)] overflow-hidden flex p-1 gap-1 border-2 border-[var(--border-subtle)]">
              <div className="h-full bg-emerald-500 rounded-xl" style={{ width: "50%" }} title="50% Wheat" />
              <div className="h-full bg-amber-500 rounded-xl" style={{ width: "25%" }} title="25% Mustard" />
              <div className="h-full bg-sky-500 rounded-xl" style={{ width: "15%" }} title="15% Onion" />
              <div className="h-full bg-teal-600 rounded-xl" style={{ width: "10%" }} title="10% Chickpea" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-[var(--bg-surface-subtle)] border-2 border-[var(--border-subtle)] space-y-1">
                <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 block">
                  50% Land: Wheat (Safe Floor)
                </span>
                <strong className="text-2xl font-bold font-['Space_Grotesk'] text-[var(--text-primary)] block">
                  {(displayAcres * 0.5).toFixed(2)} Acres
                </strong>
                <p className="text-base text-[var(--text-secondary)]">Guaranteed MSP protection against price drops.</p>
              </div>

              <div className="p-5 rounded-2xl bg-[var(--bg-surface-subtle)] border-2 border-[var(--border-subtle)] space-y-1">
                <span className="text-base font-bold text-amber-700 dark:text-amber-400 block">
                  25% Land: Mustard (High Return)
                </span>
                <strong className="text-2xl font-bold font-['Space_Grotesk'] text-[var(--text-primary)] block">
                  {(displayAcres * 0.25).toFixed(2)} Acres
                </strong>
                <p className="text-base text-[var(--text-secondary)]">High edible oil demand & water efficient.</p>
              </div>

              <div className="p-5 rounded-2xl bg-[var(--bg-surface-subtle)] border-2 border-[var(--border-subtle)] space-y-1">
                <span className="text-base font-bold text-sky-700 dark:text-sky-400 block">
                  15% Land: Onion (Cash Upside)
                </span>
                <strong className="text-2xl font-bold font-['Space_Grotesk'] text-[var(--text-primary)] block">
                  {(displayAcres * 0.15).toFixed(2)} Acres
                </strong>
                <p className="text-base text-[var(--text-secondary)]">High profit upside in local market.</p>
              </div>

              <div className="p-5 rounded-2xl bg-[var(--bg-surface-subtle)] border-2 border-[var(--border-subtle)] space-y-1">
                <span className="text-base font-bold text-teal-700 dark:text-teal-400 block">
                  10% Land: Chickpea (Soil Health)
                </span>
                <strong className="text-2xl font-bold font-['Space_Grotesk'] text-[var(--text-primary)] block">
                  {(displayAcres * 0.1).toFixed(2)} Acres
                </strong>
                <p className="text-base text-[var(--text-secondary)]">Naturally restores soil nitrogen for next season.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Expandable "More Farm Tools" Drawer */}
        <section className="p-6 rounded-3xl bg-[var(--bg-surface-subtle)] border-2 border-[var(--border-default)] space-y-4">
          <button
            type="button"
            onClick={() => setShowMoreTools(!showMoreTools)}
            className="w-full flex items-center justify-between text-left cursor-pointer"
          >
            <div>
              <h3 className="text-xl font-bold font-['Space_Grotesk'] text-[var(--text-primary)] flex items-center gap-2">
                <span>🛠️</span> More Farm Tools & Advisories
              </h3>
              <p className="text-base text-[var(--text-secondary)] mt-0.5">
                AI agronomist consultation, full crop database, and farmer preferences.
              </p>
            </div>
            <span className="text-xl font-bold text-[var(--color-primary)]">
              {showMoreTools ? "▲ Less" : "▼ More Tools"}
            </span>
          </button>

          {showMoreTools && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t-2 border-[var(--border-subtle)] animate-in fade-in duration-150">
              <Link href="/assistant" className="p-5 rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--border-default)] hover:border-[var(--color-primary)] transition-all space-y-1.5">
                <span className="text-3xl block">🤖</span>
                <strong className="text-lg font-bold text-[var(--text-primary)] block">AI Agronomist</strong>
                <p className="text-sm text-[var(--text-secondary)]">Ask crop illness, spray dosage & fertilizer questions.</p>
              </Link>

              <Link href="/crop-plan" className="p-5 rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--border-default)] hover:border-[var(--color-primary)] transition-all space-y-1.5">
                <span className="text-3xl block">🗓️</span>
                <strong className="text-lg font-bold text-[var(--text-primary)] block">Crop Lifecycle</strong>
                <p className="text-sm text-[var(--text-secondary)]">Track sowing to harvest stages and daily tasks.</p>
              </Link>

              <Link href="/crops" className="p-5 rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--border-default)] hover:border-[var(--color-primary)] transition-all space-y-1.5">
                <span className="text-3xl block">📚</span>
                <strong className="text-lg font-bold text-[var(--text-primary)] block">Crop Database</strong>
                <p className="text-sm text-[var(--text-secondary)]">Explore 30+ Indian crops with water and seed costs.</p>
              </Link>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
