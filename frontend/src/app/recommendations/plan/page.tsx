"use client";

import { useMemo, useState } from "react";
import AppShell from "../../components/AppShell";
import { generateCropLifecyclePlan, type CropLifecyclePlan } from "@/lib/lifecycle-planner";
import { DISTRICT_MASTER } from "@/lib/geo-service";

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
  farmName?: string;
  totalAcres?: number;
};

const defaultPlan: AcceptedPlan = {
  overall: {
    title: "Balanced Multi-Crop Allocation",
    explanation: "Multi-crop allocation balancing high-MSP crops with low-water oilseeds and nitrogen-fixing pulses.",
  },
  allocations: [
    { name: "Wheat", percent: 50, score: 94, expectedRevenue: 82000, estimatedCost: 31000, explanation: "Guaranteed MSP floor protection." },
    { name: "Mustard", percent: 25, score: 88, expectedRevenue: 44000, estimatedCost: 17500, explanation: "High mandi demand and water efficiency." },
    { name: "Onion", percent: 15, score: 90, expectedRevenue: 95000, estimatedCost: 20800, explanation: "High cash upside." },
    { name: "Chickpea", percent: 10, score: 82, expectedRevenue: 16000, estimatedCost: 10000, explanation: "Improves soil health and nitrogen levels." },
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

  const [region, setRegion] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("acceptedRecommendation");
        if (raw) {
          const parsed = JSON.parse(raw) as AcceptedPlan;
          if (parsed.region) return parsed.region;
        }
      } catch {
        // Fallback
      }
    }
    return `${DISTRICT_MASTER[0].state} - ${DISTRICT_MASTER[0].district} (${DISTRICT_MASTER[0].zone})`;
  });

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
    <AppShell pageTitle="Crop Lifecycle Plan">
      <div className="page-container space-y-6">
        {/* Header Row */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-card">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="agri-badge agri-badge-emerald">ICAR Package of Practices</span>
              <span className="text-xs text-[var(--text-muted)] font-['Space_Grotesk']">
                {plan.totalDurationDays} Day Lifecycle
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Agronomic Lifecycle Operations Roadmap
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Stage-by-stage operations schedule calibrated to your sowing date, regional moisture, and soil conditions.
            </p>
          </div>
        </header>

        {/* Date & Region Controls */}
        <section className="agri-card p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="sowing-date" className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider font-['Space_Grotesk']">
                Sowing Date:
              </label>
              <input
                id="sowing-date"
                type="date"
                value={sowingDate ? new Date(sowingDate).toISOString().slice(0, 10) : ""}
                onChange={(e) => setSowingDate(new Date(e.target.value).toISOString())}
                className="agri-input font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="zone-select" className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider font-['Space_Grotesk']">
                Agro-Climatic Zone:
              </label>
              <select
                id="zone-select"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="agri-select"
              >
                {DISTRICT_MASTER.map((d) => (
                  <option key={d.districtId} value={`${d.state} - ${d.district} (${d.zone})`}>
                    {d.state} - {d.district} ({d.zone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Multi-Crop Navigation Tabs */}
          <div className="pt-3 border-t border-[var(--border-subtle)] flex gap-2 flex-wrap items-center">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mr-1">
              Select Crop Plan:
            </span>
            {accepted.allocations.map((alloc, idx) => (
              <button
                key={alloc.name}
                type="button"
                onClick={() => setSelectedCropIndex(idx)}
                className={`text-xs px-3.5 py-2 rounded-xl border font-bold transition-all cursor-pointer ${
                  selectedCropIndex === idx
                    ? "agri-btn-primary shadow-xs"
                    : "agri-btn-secondary"
                }`}
              >
                {alloc.name} ({alloc.percent}% of farm)
              </button>
            ))}
          </div>
        </section>

        {/* Plan Header Summary Card */}
        <section className="p-6 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[#064e3b] text-white border border-[var(--border-accent)] shadow-card space-y-3">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-emerald-200 font-bold font-['Space_Grotesk']">
                Active Crop Advisory Roadmap
              </span>
              <div className="flex items-center gap-2 mt-1">
                <h2 className="text-3xl font-bold font-['Space_Grotesk'] text-white">
                  {plan.cropName}
                </h2>
                <span className="text-sm text-emerald-200">({plan.hindiName})</span>
              </div>
              <p className="text-xs text-emerald-100 mt-1">
                Agro-Climatic Zone: {plan.region} · Season: {plan.season}
              </p>
            </div>

            <div className="text-right">
              <div className="text-3xl font-bold font-['Space_Grotesk'] text-white">
                {plan.totalDurationDays} Days
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                Sowing: {plan.sowingDate} → Harvest: {plan.expectedHarvestDate}
              </p>
            </div>
          </div>
        </section>

        {/* Timeline Milestones Progression */}
        <section className="space-y-4">
          <h2 className="text-base font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
            Stage-by-Stage Agronomic Schedule ({plan.stages.length} Milestones)
          </h2>

          <div className="space-y-4">
            {plan.stages.map((stage) => (
              <article
                key={stage.stageNumber}
                className={`agri-card p-6 space-y-4 ${
                  stage.status === "active"
                    ? "border-[var(--color-primary)] ring-1 ring-[var(--border-accent)]"
                    : ""
                }`}
              >
                {/* Stage Header */}
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary-text)] text-xs font-bold flex items-center justify-center shrink-0 border border-[var(--border-accent)]">
                      #{stage.stageNumber}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-base font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                          {stage.stageName}
                        </strong>
                        <span className="text-xs text-[var(--text-muted)]">({stage.hindiName})</span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {stage.startDate} — {stage.endDate} ({stage.durationDays} days · {stage.startDayOffset}–{stage.endDayOffset} DAS)
                      </p>
                    </div>
                  </div>

                  <span
                    className={`agri-badge ${
                      stage.status === "active"
                        ? "agri-badge-emerald"
                        : stage.status === "completed"
                        ? "agri-badge-sky"
                        : "agri-badge-amber"
                    }`}
                  >
                    {stage.status === "active" ? "● Active Stage" : stage.status === "completed" ? "✓ Completed" : "Upcoming"}
                  </span>
                </div>

                {/* Operations Guidance Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[var(--border-subtle)] text-xs">
                  <div className="p-3.5 rounded-xl bg-[var(--color-sky-bg)] border border-[var(--color-sky-border)] space-y-1">
                    <strong className="text-[var(--color-sky-text)] block text-xs uppercase font-bold tracking-wider">
                      🚿 Irrigation Operations
                    </strong>
                    <p className="text-[var(--color-sky-text)] leading-relaxed">{stage.irrigationGuidance}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--color-emerald-bg)] border border-[var(--color-emerald-border)] space-y-1">
                    <strong className="text-[var(--color-emerald-text)] block text-xs uppercase font-bold tracking-wider">
                      🌾 Nutrient & Fertilizer Splits
                    </strong>
                    <p className="text-[var(--color-emerald-text)] leading-relaxed">{stage.fertilizerGuidance}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--color-amber-bg)] border border-[var(--color-amber-border)] space-y-1">
                    <strong className="text-[var(--color-amber-text)] block text-xs uppercase font-bold tracking-wider">
                      🌿 Weed Management
                    </strong>
                    <p className="text-[var(--color-amber-text)] leading-relaxed">{stage.weedManagement}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--color-rose-bg)] border border-[var(--color-rose-border)] space-y-1">
                    <strong className="text-[var(--color-rose-text)] block text-xs uppercase font-bold tracking-wider">
                      🐛 Pest & Disease Surveillance
                    </strong>
                    <p className="text-[var(--color-rose-text)] leading-relaxed">
                      {stage.pestMonitoring} {stage.diseaseMonitoring}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Advisory Disclaimer Notice */}
        <section className="p-4 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-secondary)] leading-relaxed">
          <strong className="text-[var(--text-primary)]">Advisory Disclaimer:</strong> {plan.advisoryDisclaimer}
        </section>
      </div>
    </AppShell>
  );
}
