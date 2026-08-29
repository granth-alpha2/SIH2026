"use client";

import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import type {
  FarmerPreferenceRecord,
  RiskAppetite,
  ResourceLevel,
  SoilType,
} from "../api/preferences/repository";

const candidateCrops = [
  "Wheat",
  "Mustard",
  "Chickpea (Gram)",
  "Maize",
  "Cotton",
  "Soybean",
  "Onion",
  "Potato",
  "Tomato",
  "Sugarcane",
  "Paddy (Rice)",
  "Groundnut",
];

const soilOptions: SoilType[] = ["Alluvial", "Black", "Red", "Sandy", "Clay", "Loam"];

export default function PreferencesPage() {
  const [prefs, setPrefs] = useState<FarmerPreferenceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showSoilDetails, setShowSoilDetails] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await fetch("/api/preferences");
        if (res.ok && isMounted) {
          const json = await res.json();
          if (json.success && json.preferences) {
            setPrefs(json.preferences);
          }
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  function toggleCrop(listName: "preferredCrops" | "cropsToAvoid", crop: string) {
    if (!prefs) return;
    const current = prefs[listName] || [];
    const updated = current.includes(crop) ? current.filter((c) => c !== crop) : [...current, crop];

    // If adding to preferred, remove from avoid and vice versa
    const otherListName = listName === "preferredCrops" ? "cropsToAvoid" : "preferredCrops";
    const otherUpdated = (prefs[otherListName] || []).filter((c) => c !== crop);

    setPrefs({
      ...prefs,
      [listName]: updated,
      [otherListName]: otherUpdated,
    });
  }

  async function handleSave() {
    if (!prefs) return;
    setSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMessage({ type: "success", text: "Farmer preferences saved! Recommendation engine updated." });
      } else {
        setStatusMessage({ type: "error", text: data?.error?.message || "Could not save preferences." });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Network error while saving preferences." });
    } finally {
      setSaving(false);
    }
  }

  if (loading || !prefs) {
    return (
      <AppShell pageTitle="Preferences">
        <section className="page-wrap feature-page">
          <div className="panel text-center py-10 text-gray-500">Loading farmer preferences...</div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="Farmer preferences">
      <section className="page-wrap feature-page max-w-3xl mx-auto space-y-4">
        <header className="feature-header mb-2">
          <p className="eyebrow">DECISION PREFERENCES</p>
          <h1>Farmer Preferences & Constraints</h1>
          <p className="subhead">
            Tailor AI crop allocations to your risk tolerance, irrigation capacity, working capital, and preferred crops.
          </p>
        </header>

        {/* 1. Risk Appetite */}
        <section className="panel space-y-2">
          <div>
            <strong className="text-sm text-gray-900 block">1. Risk Tolerance Strategy</strong>
            <span className="text-xs text-gray-500">How would you like to balance price safety vs profit upside?</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            {(
              [
                ["Conservative", "MSP Floor Priority", "Shield against price drop; guaranteed govt floor"],
                ["Balanced", "Optimal Mix", "Blend staples with high-margin cash crops"],
                ["Growth", "High-Return Focus", "Maximize profit potential in volatile markets"],
              ] as [RiskAppetite, string, string][]
            ).map(([value, label, desc]) => (
              <button
                key={value}
                type="button"
                onClick={() => setPrefs({ ...prefs, riskAppetite: value })}
                className={`p-3 rounded-lg border text-left transition ${
                  prefs.riskAppetite === value
                    ? "border-emerald-700 bg-emerald-50/80 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex justify-between items-center">
                  <strong className="text-xs text-gray-900">{value}</strong>
                  {prefs.riskAppetite === value && <span className="text-emerald-700 font-bold text-xs">✓</span>}
                </div>
                <div className="text-[11px] font-semibold text-emerald-800 mt-0.5">{label}</div>
                <p className="text-[10px] text-gray-500 mt-1 leading-tight">{desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* 2. Water Availability */}
        <section className="panel space-y-2">
          <div>
            <strong className="text-sm text-gray-900 block">2. Water & Irrigation Access</strong>
            <span className="text-xs text-gray-500">Select the assured water source for this upcoming season.</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            {(
              [
                ["Low", "Rainfed / Limited", "Prefer low-water drought-hardy crops (Mustard, Gram, Bajra)"],
                ["Medium", "Borewell / Tube-well", "Moderate irrigation (Wheat, Maize, Soybean)"],
                ["High", "Canal / Assured Water", "High-water crops (Paddy, Sugarcane, Vegetables)"],
              ] as [ResourceLevel, string, string][]
            ).map(([value, label, desc]) => (
              <button
                key={value}
                type="button"
                onClick={() => setPrefs({ ...prefs, waterAvailability: value })}
                className={`p-3 rounded-lg border text-left transition ${
                  prefs.waterAvailability === value
                    ? "border-emerald-700 bg-emerald-50/80 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex justify-between items-center">
                  <strong className="text-xs text-gray-900">{value}</strong>
                  {prefs.waterAvailability === value && <span className="text-emerald-700 font-bold text-xs">✓</span>}
                </div>
                <div className="text-[11px] font-semibold text-emerald-800 mt-0.5">{label}</div>
                <p className="text-[10px] text-gray-500 mt-1 leading-tight">{desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* 3. Working Capital / Investment Capacity */}
        <section className="panel space-y-2">
          <div>
            <strong className="text-sm text-gray-900 block">3. Working Capital Investment Capacity</strong>
            <span className="text-xs text-gray-500">Seed, fertilizer, diesel, and labor budget per acre.</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            {(
              [
                ["Low", "< ₹25,000 / acre", "Low input pulses and oilseeds"],
                ["Medium", "₹25,000 - ₹50,000 / acre", "Standard grain and commercial crops"],
                ["High", "> ₹50,000 / acre", "High-input horticultural and cash crops"],
              ] as [ResourceLevel, string, string][]
            ).map(([value, label, desc]) => (
              <button
                key={value}
                type="button"
                onClick={() => setPrefs({ ...prefs, investmentCapacity: value })}
                className={`p-3 rounded-lg border text-left transition ${
                  prefs.investmentCapacity === value
                    ? "border-emerald-700 bg-emerald-50/80 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex justify-between items-center">
                  <strong className="text-xs text-gray-900">{value}</strong>
                  {prefs.investmentCapacity === value && <span className="text-emerald-700 font-bold text-xs">✓</span>}
                </div>
                <div className="text-[11px] font-semibold text-emerald-800 mt-0.5">{label}</div>
                <p className="text-[10px] text-gray-500 mt-1 leading-tight">{desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* 4. Preferred Crops & Crops to Avoid */}
        <section className="panel space-y-3">
          <div>
            <strong className="text-sm text-gray-900 block">4. Preferred Crops (Multi-select)</strong>
            <span className="text-xs text-gray-500">Tap crops you prefer or have machinery/market access for:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {candidateCrops.map((crop) => {
              const isPreferred = (prefs.preferredCrops || []).includes(crop);
              return (
                <button
                  key={crop}
                  type="button"
                  onClick={() => toggleCrop("preferredCrops", crop)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition ${
                    isPreferred
                      ? "bg-emerald-800 text-white border-emerald-800"
                      : "bg-white text-gray-700 border-gray-200 hover:border-emerald-600"
                  }`}
                >
                  {isPreferred ? `✓ ${crop}` : `+ ${crop}`}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t">
            <strong className="text-xs text-gray-700 block mb-1">Crops to Avoid (Excluded from plan):</strong>
            <div className="flex gap-1.5 flex-wrap">
              {candidateCrops.map((crop) => {
                const isAvoided = (prefs.cropsToAvoid || []).includes(crop);
                return (
                  <button
                    key={crop}
                    type="button"
                    onClick={() => toggleCrop("cropsToAvoid", crop)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
                      isAvoided
                        ? "bg-rose-100 text-rose-800 border-rose-300 font-semibold"
                        : "bg-gray-50 text-gray-500 border-gray-200"
                    }`}
                  >
                    {isAvoided ? `✕ Excluded: ${crop}` : crop}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* 5. Optional Soil & Experience Details */}
        <section className="panel space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <strong className="text-sm text-gray-900 block">5. Soil Information & Experience (Optional)</strong>
              <span className="text-xs text-gray-500">Provides fine-grained fertilizer & soil matching.</span>
            </div>
            <button
              type="button"
              onClick={() => setShowSoilDetails(!showSoilDetails)}
              className="text-xs text-emerald-700 underline font-medium"
            >
              {showSoilDetails ? "Hide Soil Fields" : "+ Show Soil Fields"}
            </button>
          </div>

          {showSoilDetails && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t text-xs">
              <div>
                <label htmlFor="soil-type-select" className="block text-gray-600 font-medium mb-1">Soil Type:</label>
                <select
                  id="soil-type-select"
                  value={prefs.soilType || "Loam"}
                  onChange={(e) => setPrefs({ ...prefs, soilType: e.target.value as SoilType })}
                  className="p-2 border rounded w-full bg-white"
                >
                  {soilOptions.map((s) => (
                    <option key={s} value={s}>
                      {s} Soil
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="ph-input" className="block text-gray-600 font-medium mb-1">Soil pH (4.0 - 10.0):</label>
                <input
                  id="ph-input"
                  type="number"
                  step="0.1"
                  min="4.0"
                  max="10.0"
                  value={prefs.soilPh ?? 7.2}
                  onChange={(e) => setPrefs({ ...prefs, soilPh: Number(e.target.value) })}
                  className="p-2 border rounded w-full bg-white"
                />
              </div>

              <div>
                <label htmlFor="exp-input" className="block text-gray-600 font-medium mb-1">Farming Experience (Years):</label>
                <input
                  id="exp-input"
                  type="number"
                  min="0"
                  max="60"
                  value={prefs.farmingExperienceYears ?? 10}
                  onChange={(e) => setPrefs({ ...prefs, farmingExperienceYears: Number(e.target.value) })}
                  className="p-2 border rounded w-full bg-white"
                />
              </div>
            </div>
          )}
        </section>

        {statusMessage && (
          <div
            className={`p-3 rounded text-xs font-medium ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="primary-button w-full py-3 text-sm font-semibold shadow"
        >
          {saving ? "Saving Preferences..." : "Save Preferences for Crop Recommendations"}
        </button>
      </section>
    </AppShell>
  );
}

