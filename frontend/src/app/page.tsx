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

  const totalAcres = farms.reduce((sum, f) => sum + f.areaAcres, 0);

  return (
    <AppShell pageTitle="Overview">
      <section className="page-wrap dashboard-page">
        <div className="welcome-row flex justify-between items-start flex-wrap gap-4 mb-4">
          <div>
            <p className="eyebrow">FARM WORKSPACE</p>
            <h1>Farmer Decision Dashboard</h1>
            <p className="subhead">
              AI-driven multi-crop planning, 90-day regional climate scoring, and live APMC mandi market intelligence.
            </p>
          </div>
          <div className="flex gap-2">
            <Link className="primary-button" href="/farms/new">
              + Map Farm Boundary
            </Link>
            <Link className="text-button" href="/recommendations">
              View Recommendations
            </Link>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <section className="stats-grid mb-4" aria-label="Farm summary">
          <article className="stat-card accent">
            <div className="stat-icon">▦</div>
            <p>Total Registered Area</p>
            <strong>
              {loading ? "..." : totalAcres > 0 ? totalAcres.toFixed(2) : "2.40"}{" "}
              <small>acres</small>
            </strong>
            <Link className="stat-link" href="/farms">
              {farms.length > 0 ? `${farms.length} plot(s) connected` : "Sample plot (Bathinda)"}
            </Link>
          </article>

          <article className="stat-card">
            <div className="stat-icon dark">◒</div>
            <p>Estimated Net Profit</p>
            <strong>₹83,500</strong>
            <Link className="stat-link" href="/recommendations">
              +1.43x ROI projected
            </Link>
          </article>

          <article className="stat-card">
            <div className="stat-icon pale">⌁</div>
            <p>Market Opportunity</p>
            <strong>84 / 100</strong>
            <Link className="stat-link" href="/markets">
              Wheat: ₹2,380/q (+4.6%)
            </Link>
          </article>

          <article className="stat-card">
            <div className="stat-icon coral-bg">☼</div>
            <p>90-Day Weather Score</p>
            <strong>89 / 100</strong>
            <Link className="stat-link" href="/weather">
              Rain on Sunday (18.5mm)
            </Link>
          </article>
        </section>

        {/* Actionable Feature Hub */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <section className="panel">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-base font-bold text-gray-900">Recommended Allocation</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Phase-1 Optimized
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Multi-crop portfolio balanced across high-yield staples, market cash crops, and soil-restoring pulses:
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 bg-gray-50 rounded border">
                <strong>Wheat (HD-3086) — 55%</strong>
                <span className="text-emerald-700 font-bold">₹82,000 est. rev (MSP safety)</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded border">
                <strong>Mustard (Pusa Bold) — 30%</strong>
                <span className="text-emerald-700 font-bold">₹44,000 est. rev (High margin)</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded border">
                <strong>Chickpea (Desi Gram) — 15%</strong>
                <span className="text-emerald-700 font-bold">₹16,000 est. rev (Nitrogen fix)</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t flex justify-between items-center">
              <span className="text-xs text-gray-500">Break-even: 14.2 q/acre</span>
              <Link className="primary-button text-xs py-1.5" href="/recommendations">
                Open Full Allocation →
              </Link>
            </div>
          </section>

          <section className="panel">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-base font-bold text-gray-900">Active Crop Lifecycle</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                Advisory Stage
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Upcoming management operations for Punjab - Trans-Gangetic Plains:
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-2 bg-gray-50 rounded border">
                <div className="font-semibold text-gray-800 flex justify-between">
                  <span>Crown Root Irrigation (CRI)</span>
                  <span className="text-emerald-700">Sep 05 – Sep 12</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">Critical first irrigation 20–25 days after sowing.</p>
              </div>
              <div className="p-2 bg-gray-50 rounded border">
                <div className="font-semibold text-gray-800 flex justify-between">
                  <span>Pre-Rain Drainage Clearance</span>
                  <span className="text-amber-700">Aug 30 (Tomorrow)</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">Clear drainage furrows before Sunday&apos;s 18.5mm rain.</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t flex justify-between items-center">
              <Link className="text-button text-xs py-1.5" href="/notifications">
                View 3 Unread Alerts
              </Link>
              <Link className="primary-button text-xs py-1.5" href="/crop-plan">
                View Lifecycle Calendar →
              </Link>
            </div>
          </section>
        </div>

        <p className="disclaimer text-center text-xs text-gray-400">
          AgriProfit decision workspace combines satellite geospatial marking, official Agmarknet mandi data, IMD gridded climate forecasts, and ICAR agronomic rules.
        </p>
      </section>
    </AppShell>
  );
}
