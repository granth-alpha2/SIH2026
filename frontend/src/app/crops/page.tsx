"use client";

import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import type { CropRecord } from "@/lib/crop-data";

export default function CropsPage() {
  const [crops, setCrops] = useState<CropRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCrop, setActiveCrop] = useState<CropRecord | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadCrops() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedSeason !== "All") params.set("season", selectedSeason);
        if (selectedCategory !== "All") params.set("category", selectedCategory);
        if (searchQuery.trim()) params.set("q", searchQuery.trim());

        const res = await fetch(`/api/crops?${params.toString()}`);
        if (res.ok && isMounted) {
          const json = await res.json();
          setCrops(json.crops || []);
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadCrops();
    return () => {
      isMounted = false;
    };
  }, [selectedSeason, selectedCategory, searchQuery]);

  return (
    <AppShell pageTitle="Crop database">
      <section className="page-wrap feature-page max-w-6xl mx-auto space-y-4">
        <header className="feature-header flex justify-between items-start flex-wrap gap-4 mb-2">
          <div>
            <p className="eyebrow">AGRONOMIC KNOWLEDGE BASE</p>
            <h1>Crop Database & Discovery</h1>
            <p className="subhead">
              Curated agronomic, climate suitability, and cost-yield benchmarks sourced from ICAR and CACP reports.
            </p>
          </div>
        </header>

        {/* Filters Toolbar */}
        <section className="panel space-y-3">
          <div className="flex gap-2 flex-wrap items-center">
            {/* Search Input */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search crop name (e.g. Wheat, Sarson, Chana)..."
              className="flex-1 min-w-[220px] p-2 border rounded text-xs bg-white"
            />

            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-2 border rounded text-xs bg-white font-medium"
            >
              <option value="All">All Categories</option>
              <option value="Cereal">Cereal</option>
              <option value="Pulse">Pulse</option>
              <option value="Oilseed">Oilseed</option>
              <option value="Cash Crop">Cash Crop</option>
              <option value="Vegetable">Vegetable</option>
            </select>
          </div>

          {/* Season Pills */}
          <div className="flex gap-1.5 flex-wrap items-center">
            <span className="text-[11px] text-gray-500 font-semibold uppercase mr-1">Season:</span>
            {["All", "Rabi", "Kharif", "Perennial"].map((season) => (
              <button
                key={season}
                type="button"
                onClick={() => setSelectedSeason(season)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                  selectedSeason === season
                    ? "bg-emerald-800 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {season}
              </button>
            ))}
          </div>
        </section>

        {/* Crops Grid */}
        {loading && <div className="panel text-center py-10 text-gray-500">Loading crop catalog...</div>}

        {!loading && crops.length === 0 && (
          <div className="panel text-center py-10 text-gray-500">
            <p className="font-semibold text-sm">No crops found matching your filters.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedSeason("All");
                setSelectedCategory("All");
                setSearchQuery("");
              }}
              className="text-xs text-emerald-700 underline mt-2"
            >
              Reset all filters
            </button>
          </div>
        )}

        {!loading && crops.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {crops.map((crop) => (
              <article
                key={crop.id}
                onClick={() => setActiveCrop(crop)}
                className="panel hover:border-emerald-700/60 hover:shadow-sm transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-base font-bold text-gray-900">{crop.name}</strong>
                      </div>
                      <span className="text-xs text-gray-500">{crop.hindiName} · {crop.category}</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {crop.season}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-xs">
                    <div className="p-1.5 bg-gray-50 rounded border">
                      <span className="text-[10px] text-gray-400 block uppercase">Duration</span>
                      <strong className="text-gray-800 text-[11px]">{crop.durationDays} days</strong>
                    </div>
                    <div className="p-1.5 bg-gray-50 rounded border">
                      <span className="text-[10px] text-gray-400 block uppercase">Water</span>
                      <strong className="text-gray-800 text-[11px]">{crop.waterLevel}</strong>
                    </div>
                    <div className="p-1.5 bg-gray-50 rounded border">
                      <span className="text-[10px] text-gray-400 block uppercase">Yield/Ac</span>
                      <strong className="text-gray-800 text-[11px]">{crop.yield.quintalsPerAcre} q</strong>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Input Cost:</span>
                      <span className="font-semibold text-gray-800">₹{crop.costs.totalPerAcre.toLocaleString("en-IN")}/ac</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Est. Net Profit:</span>
                      <strong className="text-emerald-700 font-bold">₹{crop.economics.expectedNetProfitPerAcre.toLocaleString("en-IN")}/ac</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t flex justify-between items-center text-[11px]">
                  <span className={crop.economics.mspEligible ? "text-emerald-700 font-semibold" : "text-gray-400"}>
                    {crop.economics.mspEligible ? `✓ MSP: ₹${crop.economics.mspPricePerQuintal}/q` : "Free Market"}
                  </span>
                  <span className="text-emerald-700 font-medium hover:underline">
                    View Agronomy →
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Detailed Modal / Drawer */}
        {activeCrop && (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setActiveCrop(null)}
          >
            <div
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">{activeCrop.name}</h2>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                      {activeCrop.season} Season
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Category: {activeCrop.category} · Duration: {activeCrop.durationDays} Days · Water Req: {activeCrop.waterRequirementMm} mm
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveCrop(null)}
                  className="text-gray-400 hover:text-gray-700 text-lg font-bold p-1 cursor-pointer"
                  aria-label="Close details"
                >
                  ✕
                </button>
              </div>

              {/* Economic Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 bg-emerald-50 rounded border border-emerald-200">
                  <span className="text-emerald-700 block text-[10px] uppercase font-semibold">Est. Net Profit</span>
                  <strong className="text-base text-emerald-900">₹{activeCrop.economics.expectedNetProfitPerAcre.toLocaleString("en-IN")}</strong>
                  <span className="text-[10px] text-emerald-600 block">per acre</span>
                </div>
                <div className="p-2.5 bg-gray-50 rounded border">
                  <span className="text-gray-400 block text-[10px] uppercase">Input Cost</span>
                  <strong className="text-sm text-gray-900">₹{activeCrop.costs.totalPerAcre.toLocaleString("en-IN")}</strong>
                  <span className="text-[10px] text-gray-500 block">per acre</span>
                </div>
                <div className="p-2.5 bg-gray-50 rounded border">
                  <span className="text-gray-400 block text-[10px] uppercase">Mandi Modal Price</span>
                  <strong className="text-sm text-gray-900">₹{activeCrop.economics.typicalPricePerQuintal.toLocaleString("en-IN")}</strong>
                  <span className="text-[10px] text-gray-500 block">per quintal</span>
                </div>
                <div className="p-2.5 bg-gray-50 rounded border">
                  <span className="text-gray-400 block text-[10px] uppercase">Govt MSP Floor</span>
                  <strong className="text-sm text-gray-900">{activeCrop.economics.mspPricePerQuintal ? `₹${activeCrop.economics.mspPricePerQuintal}` : "N/A"}</strong>
                  <span className="text-[10px] text-gray-500 block">{activeCrop.economics.mspEligible ? "Guaranteed" : "No MSP"}</span>
                </div>
              </div>

              {/* Climate Suitability */}
              <div className="panel bg-gray-50 border space-y-2 text-xs">
                <strong className="text-gray-900 text-xs uppercase block">Climate & Soil Requirements</strong>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Optimal Temperature</span>
                    <span className="text-gray-800 font-medium">{activeCrop.tempRange.idealMin}°C - {activeCrop.tempRange.idealMax}°C (Range: {activeCrop.tempRange.min}-{activeCrop.tempRange.max}°C)</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Optimal Rainfall</span>
                    <span className="text-gray-800 font-medium">{activeCrop.rainfallMm.optimal} mm ({activeCrop.rainfallMm.min}-{activeCrop.rainfallMm.max} mm)</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Suitable Soils</span>
                    <span className="text-gray-800 font-medium">{activeCrop.suitableSoils.join(", ")}</span>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="text-xs space-y-1.5">
                <strong className="text-gray-900 uppercase block text-[11px]">Cost of Cultivation Breakdown (per Acre)</strong>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2 border rounded">Seed: <b>₹{activeCrop.costs.seed}</b></div>
                  <div className="p-2 border rounded">Fertilizer: <b>₹{activeCrop.costs.fertilizer}</b></div>
                  <div className="p-2 border rounded">Labor: <b>₹{activeCrop.costs.labor}</b></div>
                  <div className="p-2 border rounded">Irrigation: <b>₹{activeCrop.costs.irrigation}</b></div>
                </div>
              </div>

              {/* Risks & Diseases */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded">
                  <strong className="text-rose-900 text-[11px] block mb-1">Key Agronomic Risks</strong>
                  <ul className="list-disc list-inside space-y-0.5 text-rose-800">
                    {activeCrop.riskFactors.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded">
                  <strong className="text-amber-900 text-[11px] block mb-1">Pests & Diseases</strong>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                    {activeCrop.pestsAndDiseases.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Provenance Footer */}
              <div className="border-t pt-3 flex justify-between items-center text-[10px] text-gray-400">
                <span>Source: {activeCrop.provenance.benchmarkSource}</span>
                <span className="uppercase font-semibold text-emerald-700">Verified {activeCrop.provenance.sourceType} Benchmark</span>
              </div>
            </div>
          </div>
        )}
      </section>
    </AppShell>
  );
}
