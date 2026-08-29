"use client";

import { useMemo, useState } from "react";
import AppShell from "../../components/AppShell";
import { generateCropLifecyclePlan, type CropLifecyclePlan } from "@/lib/lifecycle-planner";

type Allocation = {
  name: string;
  percent: number;
  score: number;
  expectedRevenue: number;
  estimatedCost: number;
  explanation: string;
};

type AcceptedPlan = {
  overall: {
    title: string;
    explanation: string;
  };
  allocations: Allocation[];
  sowingDate?: string;
  region?: string;
};

const defaultPlan: AcceptedPlan = {
  overall: {
    title: "Balanced Wheat + Mustard + Chickpea Allocation",
    explanation: "Multi-crop allocation balancing high-MSP wheat with low-water oilseeds and nitrogen-fixing pulses.",
  },
  allocations: [
    { name: "Wheat", percent: 55, score: 94, expectedRevenue: 82000, estimatedCost: 31000, explanation: "Guaranteed MSP floor protection." },
    { name: "Mustard", percent: 30, score: 88, expectedRevenue: 44000, estimatedCost: 17500, explanation: "High mandi demand and water efficiency." },
    { name: "Chickpea", percent: 15, score: 82, expectedRevenue: 16000, estimatedCost: 10000, explanation: "Improves soil health and nitrogen levels." },
  ],
  sowingDate: new Date().toISOString(),
  region: "Punjab - Bathinda (Trans-Gangetic Plains)",
};

export default function CropPlannerPage() {
  const [sowingDate, setSowingDate] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("acceptedRecommendation");
        if (raw) {
          const parsed = JSON.parse(raw) as AcceptedPlan;
          return parsed.sowingDate || new Date().toISOString();
        }
      } catch {
        // Fallback
      }
    }
    return new Date().toISOString();
  });

  const [region, setRegion] = useState<string>("Punjab - Bathinda (Trans-Gangetic Plains)");
  const [selectedCropIndex, setSelectedCropIndex] = useState<number>(0);

  const accepted = useMemo<AcceptedPlan>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("acceptedRecommendation");
        if (raw) {
          return JSON.parse(raw) as AcceptedPlan;
        }
      } catch {
        // Fallback
      }
    }
    return defaultPlan;
  }, []);

  const activeCropAlloc = accepted.allocations[selectedCropIndex] || accepted.allocations[0];

  const plan: CropLifecyclePlan = useMemo(() => {
    return generateCropLifecyclePlan(activeCropAlloc.name, sowingDate, region);
  }, [activeCropAlloc.name, sowingDate, region]);

  return (
    <AppShell pageTitle="Crop lifecycle plan">
      <section className="page-wrap feature-page max-w-5xl mx-auto space-y-4">
        <header className="feature-header flex justify-between items-start flex-wrap gap-4 mb-2">
          <div>
            <p className="eyebrow">ACTIVE AGRONOMIC PLAN</p>
            <h1>Crop Lifecycle Timeline & Guidance</h1>
            <p className="subhead">
              Stage-by-stage operations schedule calibrated to your sowing date and ICAR package-of-practices.
            </p>
          </div>
        </header>

        {/* Date & Region Controls */}
        <section className="panel space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label htmlFor="sowing-date" className="block text-gray-600 font-semibold uppercase tracking-wider mb-1">
                Approximate Sowing Date:
              </label>
              <input
                id="sowing-date"
                type="date"
                value={sowingDate ? new Date(sowingDate).toISOString().slice(0, 10) : ""}
                onChange={(e) => setSowingDate(new Date(e.target.value).toISOString())}
                className="p-2 border rounded w-full bg-white font-medium text-sm"
              />
            </div>
            <div>
              <label htmlFor="zone-select" className="block text-gray-600 font-semibold uppercase tracking-wider mb-1">
                Agro-Climatic Zone:
              </label>
              <select
                id="zone-select"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="p-2 border rounded w-full bg-white font-medium text-sm"
              >
                <option value="Punjab - Bathinda (Trans-Gangetic Plains)">Punjab - Bathinda (Trans-Gangetic Plains)</option>
                <option value="Haryana - Karnal (Trans-Gangetic Plains)">Haryana - Karnal (Trans-Gangetic Plains)</option>
                <option value="UP - Varanasi (Middle Gangetic Plains)">UP - Varanasi (Middle Gangetic Plains)</option>
                <option value="Maharashtra - Nashik (Western Plateau)">Maharashtra - Nashik (Western Plateau)</option>
                <option value="MP - Indore (Central Plateau)">MP - Indore (Central Plateau)</option>
              </select>
            </div>
          </div>

          {/* Multi-Crop Navigation Tabs */}
          <div className="pt-2 border-t flex gap-2 flex-wrap items-center">
            <span className="text-[11px] text-gray-500 font-semibold uppercase mr-1">Select Crop Plan:</span>
            {accepted.allocations.map((alloc, idx) => (
              <button
                key={alloc.name}
                type="button"
                onClick={() => setSelectedCropIndex(idx)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition cursor-pointer ${
                  selectedCropIndex === idx
                    ? "bg-emerald-800 text-white border-emerald-800 shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {alloc.name} ({alloc.percent}% of land)
              </button>
            ))}
          </div>
        </section>

        {/* Plan Header Summary Card */}
        <section className="panel bg-gradient-to-br from-emerald-800 to-emerald-950 text-white border-0 shadow-md">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-emerald-300 font-semibold">Active Advisory Roadmap</span>
              <div className="flex items-center gap-2 mt-0.5">
                <h2 className="text-2xl font-black text-white">{plan.cropName}</h2>
                <span className="text-xs text-emerald-200">({plan.hindiName})</span>
              </div>
              <p className="text-xs text-emerald-200 mt-1">
                Agro-Climatic Zone: {plan.region} · Season: {plan.season}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-white">{plan.totalDurationDays} Days</div>
              <p className="text-xs text-emerald-300">
                Sowing: {plan.sowingDate} → Harvest: {plan.expectedHarvestDate}
              </p>
            </div>
          </div>
        </section>

        {/* Timeline Milestones Progression */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            Stage-by-Stage Agronomic Schedule ({plan.stages.length} Milestones)
          </h2>

          <div className="space-y-3">
            {plan.stages.map((stage) => (
              <article
                key={stage.stageNumber}
                className={`panel border transition ${
                  stage.status === "active"
                    ? "border-emerald-600 bg-emerald-50/40 shadow-sm"
                    : stage.status === "completed"
                    ? "border-gray-200 bg-gray-50/60 opacity-80"
                    : "border-gray-200 bg-white"
                }`}
              >
                {/* Stage Header */}
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-800 text-white text-xs font-bold flex items-center justify-center">
                        {stage.stageNumber}
                      </span>
                      <strong className="text-sm font-bold text-gray-900">{stage.stageName}</strong>
                      <span className="text-xs text-gray-500 font-normal">({stage.hindiName})</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 ml-8">
                      {stage.startDate} — {stage.endDate} ({stage.durationDays} days · {stage.startDayOffset}–{stage.endDayOffset} DAS)
                    </p>
                  </div>

                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      stage.status === "active"
                        ? "bg-emerald-600 text-white"
                        : stage.status === "completed"
                        ? "bg-gray-200 text-gray-700"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {stage.status === "active" ? "● Active Stage" : stage.status === "completed" ? "✓ Completed" : "Upcoming"}
                  </span>
                </div>

                {/* Operations Guidance Grid */}
                <div className="mt-3 ml-8 pt-3 border-t grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 bg-blue-50/60 border border-blue-200/80 rounded-lg">
                    <strong className="text-blue-900 block text-[11px] uppercase mb-0.5">🚿 Irrigation Operations</strong>
                    <p className="text-blue-950 leading-relaxed">{stage.irrigationGuidance}</p>
                  </div>

                  <div className="p-2.5 bg-emerald-50/60 border border-emerald-200/80 rounded-lg">
                    <strong className="text-emerald-900 block text-[11px] uppercase mb-0.5">🌾 Nutrient & Fertilizer Splits</strong>
                    <p className="text-emerald-950 leading-relaxed">{stage.fertilizerGuidance}</p>
                  </div>

                  <div className="p-2.5 bg-amber-50/60 border border-amber-200/80 rounded-lg">
                    <strong className="text-amber-900 block text-[11px] uppercase mb-0.5">🌿 Weed Management</strong>
                    <p className="text-amber-950 leading-relaxed">{stage.weedManagement}</p>
                  </div>

                  <div className="p-2.5 bg-rose-50/60 border border-rose-200/80 rounded-lg">
                    <strong className="text-rose-900 block text-[11px] uppercase mb-0.5">🐛 Pest & Disease Surveillance</strong>
                    <p className="text-rose-950 leading-relaxed">
                      {stage.pestMonitoring} {stage.diseaseMonitoring}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Advisory Disclaimer Notice */}
        <section className="panel text-xs text-gray-500 bg-gray-50 border leading-relaxed">
          <strong>Advisory Disclaimer:</strong> {plan.advisoryDisclaimer}
        </section>
      </section>
    </AppShell>
  );
}
