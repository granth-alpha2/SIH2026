"use client";

import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import type { MandiPriceRecord } from "@/lib/market-service";
import { resolveDistrictFromCoords } from "@/lib/geo-service";

export default function MarketsPage() {
  const [selectedCrop, setSelectedCrop] = useState<string>("All");
  const [selectedState, setSelectedState] = useState<string>("All");
  const [markets, setMarkets] = useState<MandiPriceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [detectingGps, setDetectingGps] = useState(false);

  function handleUseMyLocation() {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDetectingGps(false);
        const { latitude, longitude } = position.coords;
        const dInfo = resolveDistrictFromCoords(latitude, longitude);
        setSelectedState(dInfo.state);
      },
      (err) => {
        setDetectingGps(false);
        console.warn("[Market Geolocation Warning]", err);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  useEffect(() => {
    let isMounted = true;
    async function loadMarkets() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCrop !== "All") params.set("crop", selectedCrop);
        if (selectedState !== "All") params.set("state", selectedState);

        const res = await fetch(`/api/markets?${params.toString()}`);
        if (res.ok && isMounted) {
          const json = await res.json();
          setMarkets(json.markets || []);
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadMarkets();
    return () => {
      isMounted = false;
    };
  }, [selectedCrop, selectedState]);

  return (
    <AppShell pageTitle="APMC Market Watch">
      <div className="page-container space-y-6">
        {/* Header Row */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-card">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="agri-badge agri-badge-emerald">Agmarknet Live Feeds</span>
              <span className="text-xs text-[var(--text-muted)] font-['Space_Grotesk']">
                CACP Official MSP Benchmarks
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              APMC Mandi Watch & Price Trends
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Modal prices, 6-month historical monthly trends, price volatility indices, and Government MSP safety floor comparisons.
            </p>
          </div>

          <div className="flex gap-2.5 flex-wrap items-center shrink-0">
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={detectingGps}
              className="agri-btn-primary"
              title="Detect GPS coordinates and filter to local state APMCs"
            >
              <span>📍</span>
              <span>{detectingGps ? "Locating..." : "Use My Location"}</span>
            </button>

            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="agri-select max-w-[160px]"
            >
              <option value="All">All Crops</option>
              <option value="Wheat">Wheat</option>
              <option value="Mustard">Mustard</option>
              <option value="Chickpea">Chickpea (Gram)</option>
              <option value="Maize">Maize</option>
              <option value="Cotton">Cotton</option>
              <option value="Soybean">Soybean</option>
              <option value="Onion">Onion</option>
              <option value="Potato">Potato</option>
            </select>

            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="agri-select max-w-[160px]"
            >
              <option value="All">All States</option>
              <option value="Punjab">Punjab</option>
              <option value="Haryana">Haryana</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Madhya Pradesh">Madhya Pradesh</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Rajasthan">Rajasthan</option>
              <option value="Gujarat">Gujarat</option>
            </select>
          </div>
        </header>

        {loading && (
          <div className="agri-card p-12 text-center text-[var(--text-muted)] space-y-2">
            <div className="inline-block w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Fetching live APMC wholesale price feeds...</p>
          </div>
        )}

        {!loading && markets.length === 0 && (
          <div className="agri-card p-12 text-center text-[var(--text-muted)]">
            <p className="text-sm font-semibold">No mandi price feeds found matching your criteria.</p>
          </div>
        )}

        {!loading && markets.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {markets.map((item) => {
              const aboveMsp = item.mspPrice !== null ? item.modalPrice >= item.mspPrice : null;

              return (
                <article
                  key={item.cropId}
                  className="agri-card p-5 flex flex-col justify-between hover:border-[var(--border-strong)] transition-all space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                            {item.cropName}
                          </h2>
                          <span className="text-xs text-[var(--text-muted)]">({item.hindiName})</span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {item.mandiName} · {item.state}
                        </p>
                      </div>

                      <span
                        className={`agri-badge ${
                          item.trend30DayPct >= 0 ? "agri-badge-emerald" : "agri-badge-rose"
                        }`}
                      >
                        {item.trend30DayPct >= 0 ? `+${item.trend30DayPct}% (30d)` : `${item.trend30DayPct}% (30d)`}
                      </span>
                    </div>

                    {/* Price Hero */}
                    <div className="flex items-baseline gap-2 pt-1">
                      <strong className="text-2xl font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                        ₹{item.modalPrice.toLocaleString("en-IN")}
                      </strong>
                      <span className="text-xs text-[var(--text-muted)]">/ {item.unit}</span>
                      <span
                        className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          item.volatility === "Low"
                            ? "agri-badge-sky"
                            : item.volatility === "Medium"
                            ? "agri-badge-amber"
                            : "agri-badge-rose"
                        }`}
                      >
                        {item.volatility} Volatility ({item.volatilityPct}%)
                      </span>
                    </div>

                    {/* Range & Arrivals */}
                    <div className="pt-2.5 border-t border-[var(--border-subtle)] grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[var(--text-muted)] block text-[10px] uppercase font-semibold">
                          Daily Mandi Range
                        </span>
                        <span className="text-[var(--text-primary)] font-medium">
                          ₹{item.minPrice} - ₹{item.maxPrice}
                        </span>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)] block text-[10px] uppercase font-semibold">
                          Market Arrivals
                        </span>
                        <span className="text-[var(--text-primary)] font-medium">
                          {item.arrivalsTonnes} Tonnes
                        </span>
                      </div>
                    </div>

                    {/* 6-Month Trend Mini Sparkline Bar Chart */}
                    <div className="pt-2.5 border-t border-[var(--border-subtle)]">
                      <span className="text-[10px] uppercase text-[var(--text-muted)] block font-semibold mb-2">
                        6-Month Modal Price Trend
                      </span>
                      <div className="flex items-end gap-1.5 h-12 pt-2">
                        {item.historical6Months.map((pt, idx) => {
                          const minH = 20;
                          const maxH = 100;
                          const prices = item.historical6Months.map((p) => p.modalPrice);
                          const minP = Math.min(...prices) * 0.9;
                          const maxP = Math.max(...prices) * 1.1;
                          const heightPct = Math.round(minH + ((pt.modalPrice - minP) / (maxP - minP || 1)) * (maxH - minH));

                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                              <div
                                style={{ height: `${heightPct}%` }}
                                className="w-full bg-[var(--color-primary)] opacity-85 group-hover:opacity-100 rounded-t transition"
                              />
                              <span className="text-[9px] text-[var(--text-muted)] font-mono">
                                {pt.month.slice(0, 3)}
                              </span>
                              <div className="hidden group-hover:block absolute bottom-12 bg-black/90 text-white text-[9px] px-2 py-0.5 rounded whitespace-nowrap z-10 shadow">
                                ₹{pt.modalPrice} ({pt.arrivalsTonnes}t)
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* MSP & Procurement Signal */}
                  <div className="pt-3 border-t border-[var(--border-subtle)] space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-muted)] text-xs">
                        Govt MSP Floor:{" "}
                        <strong className="text-[var(--text-primary)]">
                          {item.mspPrice !== null ? `₹${item.mspPrice.toLocaleString("en-IN")}` : "No MSP"}
                        </strong>
                      </span>
                      {aboveMsp !== null && (
                        <span
                          className={`agri-badge ${
                            aboveMsp ? "agri-badge-emerald" : "agri-badge-amber"
                          }`}
                        >
                          {aboveMsp ? `+${item.mspDifferencePct}% above MSP` : "Below MSP"}
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-[10px] pt-1 text-[var(--text-muted)]">
                      <span>Safety: {item.procurementSafety}</span>
                      <span className="text-[var(--color-primary)] font-semibold uppercase">{item.provenance.sourceType}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <section className="p-4 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-secondary)] leading-relaxed space-y-1">
          <p>
            <strong className="text-[var(--text-primary)]">Data Provenance & Governance:</strong> Sourced through official Agmarknet APMC mandi feeds and Ministry of Agriculture CACP notifications.
          </p>
          <p className="text-[11px] text-[var(--text-muted)]">
            * MSP procurement is governed by official nodal agencies (FCI, NAFED, CCI). In free markets without MSP (e.g. Onion, Potato), price risk relies on seasonal cold storage and staggered harvesting.
          </p>
        </section>
      </div>
    </AppShell>
  );
}