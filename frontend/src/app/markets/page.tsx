"use client";

import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import type { MandiPriceRecord } from "@/lib/market-service";

export default function MarketsPage() {
  const [selectedCrop, setSelectedCrop] = useState<string>("All");
  const [selectedState, setSelectedState] = useState<string>("All");
  const [markets, setMarkets] = useState<MandiPriceRecord[]>([]);
  const [loading, setLoading] = useState(true);

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
    <AppShell pageTitle="Market watch">
      <section className="page-wrap feature-page max-w-6xl mx-auto space-y-4">
        <header className="feature-header flex justify-between items-start flex-wrap gap-4 mb-2">
          <div>
            <p className="eyebrow">MARKET INTELLIGENCE & MSP SAFETY</p>
            <h1>APMC Mandi Watch & Price Trends</h1>
            <p className="subhead">
              Modal prices, 6-month historical monthly trends, price volatility indices, and Government MSP safety floor comparisons.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="p-2 border rounded text-xs bg-white font-medium"
            >
              <option value="All">All Commodities</option>
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
              className="p-2 border rounded text-xs bg-white font-medium"
            >
              <option value="All">All States</option>
              <option value="Punjab">Punjab</option>
              <option value="Haryana">Haryana</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Madhya Pradesh">Madhya Pradesh</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
            </select>
          </div>
        </header>

        {loading && <div className="panel text-center py-10 text-gray-500">Fetching mandi market feeds...</div>}

        {!loading && markets.length === 0 && (
          <div className="panel text-center py-10 text-gray-500">
            <p className="font-semibold text-sm">No mandi price feeds found matching your criteria.</p>
          </div>
        )}

        {!loading && markets.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {markets.map((item) => {
              const aboveMsp = item.mspPrice !== null ? item.modalPrice >= item.mspPrice : null;
              return (
                <article key={item.cropId} className="panel flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h2 className="text-base font-bold text-gray-900">{item.cropName}</h2>
                          <span className="text-xs text-gray-500 font-normal">({item.hindiName})</span>
                        </div>
                        <p className="text-xs text-gray-500">{item.mandiName} · {item.state}</p>
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          item.trend30DayPct >= 0
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {item.trend30DayPct >= 0 ? `+${item.trend30DayPct}% (30d)` : `${item.trend30DayPct}% (30d)`}
                      </span>
                    </div>

                    {/* Price Hero */}
                    <div className="mt-3 flex items-baseline gap-2">
                      <strong className="text-2xl font-black text-gray-900">
                        ₹{item.modalPrice.toLocaleString("en-IN")}
                      </strong>
                      <span className="text-xs text-gray-500">/ {item.unit}</span>
                      <span
                        className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded ${
                          item.volatility === "Low"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : item.volatility === "Medium"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {item.volatility} Volatility ({item.volatilityPct}%)
                      </span>
                    </div>

                    {/* Range & Arrivals */}
                    <div className="mt-3 pt-2.5 border-t grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase">Daily Mandi Range</span>
                        <span className="text-gray-800 font-medium">₹{item.minPrice} - ₹{item.maxPrice}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase">Market Arrivals</span>
                        <span className="text-gray-800 font-medium">{item.arrivalsTonnes} Tonnes</span>
                      </div>
                    </div>

                    {/* 6-Month Trend Mini Sparkline Bar Chart */}
                    <div className="mt-3 pt-2.5 border-t">
                      <span className="text-[10px] uppercase text-gray-400 block font-semibold mb-1.5">
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
                                className="w-full bg-emerald-700/80 group-hover:bg-emerald-600 rounded-t transition"
                              />
                              <span className="text-[8px] text-gray-400 font-mono">
                                {pt.month.slice(0, 3)}
                              </span>
                              {/* Tooltip */}
                              <div className="hidden group-hover:block absolute bottom-12 bg-gray-900 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap z-10 shadow">
                                ₹{pt.modalPrice} ({pt.arrivalsTonnes}t)
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* MSP & Procurement Signal */}
                  <div className="mt-4 pt-2.5 border-t space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-[11px]">
                        Govt MSP Floor:{" "}
                        <strong className="text-gray-800">
                          {item.mspPrice !== null ? `₹${item.mspPrice.toLocaleString("en-IN")}` : "No MSP (Free Market)"}
                        </strong>
                      </span>
                      {aboveMsp !== null && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            aboveMsp ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {aboveMsp ? `+${item.mspDifferencePct}% above MSP` : "Below MSP"}
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-[10px] pt-1">
                      <span className="text-gray-500 font-medium">Safety: {item.procurementSafety}</span>
                      <span className="text-emerald-700 font-semibold uppercase">{item.provenance.sourceType}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <section className="panel text-xs text-gray-500 leading-relaxed space-y-1">
          <p>
            <strong>Data Provenance & Architecture:</strong> Sourced through standard Agmarknet APMC mandi feeds and official Central Government CACP notifications.
          </p>
          <p className="text-[11px] text-gray-400">
            * MSP procurement is governed by official nodal agencies (FCI, NAFED, CCI). In free markets without MSP (e.g. Onion, Potato), price risk relies on seasonal storage and staggered harvesting.
          </p>
        </section>
      </section>
    </AppShell>
  );
}