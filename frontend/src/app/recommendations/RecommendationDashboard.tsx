"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AppShell from "../components/AppShell";
import { simulateCropFinancials } from "@/lib/simulation-engine";
import { optimizePortfolio, type OptimizedPortfolio, type AllocatedCropItem } from "@/lib/portfolio-optimizer";
import { resolveDistrictFromCoords } from "@/lib/geo-service";

function formatCurrency(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function DonutChart({
  allocations,
}: {
  allocations: { cropName: string; percentage: number }[];
}) {
  const total = allocations.reduce((s, a) => s + a.percentage, 0) || 100;

  const segments = allocations.map((a, i) => {
    const frac = a.percentage / total;
    const dash = String(frac * 100);
    const strokeDasharray = `${dash} ${100 - frac * 100}`;
    const rotation = allocations
      .slice(0, i)
      .reduce((sum, item) => sum + (item.percentage / total) * 360, -90);
    const colors = ["#10b981", "#f59e0b", "#0ea5e9", "#14b8a6", "#8b5cf6"];
    return {
      index: i,
      strokeDasharray,
      rotation,
      color: colors[i % colors.length],
    };
  });

  return (
    <svg viewBox="0 0 36 36" className="w-32 h-32 sm:w-36 sm:h-36">
      {segments.map((seg) => (
        <circle
          key={seg.index}
          r="15.91549430918954"
          cx="18"
          cy="18"
          fill="transparent"
          stroke={seg.color}
          strokeWidth="5"
          strokeDasharray={seg.strokeDasharray}
          transform={`rotate(${seg.rotation} 18 18)`}
          strokeLinecap="butt"
        />
      ))}
      <circle r="10" cx="18" cy="18" fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="0.5" />
    </svg>
  );
}

export default function RecommendationDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [openExplanation, setOpenExplanation] = useState<number | null>(null);

  // Active Farm & Geospatial State
  const [farmName, setFarmName] = useState("Main Field Plot");
  const [farmLocation, setFarmLocation] = useState("Detected Regional Zone");
  const [totalLandAcres, setTotalLandAcres] = useState<number>(2.5);

  // Portfolio Optimizer state
  const [portfolio, setPortfolio] = useState<OptimizedPortfolio | null>(null);
  const [customAcres, setCustomAcres] = useState<Record<string, number>>({});

  // Sensitivity Simulator state
  const [simCropName, setSimCropName] = useState("Wheat");
  const [simArea, setSimArea] = useState<number>(2.5);
  const [simPrice, setSimPrice] = useState<number>(2380);
  const [simYield, setSimYield] = useState<number>(14.5);
  const [simCost, setSimCost] = useState<number>(11500);

  useEffect(() => {
    let isMounted = true;

    async function loadDynamicPortfolio() {
      setLoading(true);
      try {
        const urlAcres = searchParams.get("acres");
        const urlName = searchParams.get("name");
        const urlLat = searchParams.get("lat");
        const urlLng = searchParams.get("lng");

        let acres = urlAcres ? parseFloat(urlAcres) : 0;
        let name = urlName ? decodeURIComponent(urlName) : "";
        let lat = urlLat ? parseFloat(urlLat) : 0;
        let lng = urlLng ? parseFloat(urlLng) : 0;

        if (!acres || acres <= 0) {
          try {
            const savedRaw = localStorage.getItem("agriprofit_active_farm");
            if (savedRaw) {
              const parsed = JSON.parse(savedRaw);
              if (parsed.areaAcres) {
                acres = parsed.areaAcres;
                name = parsed.name || name;
                lat = parsed.center?.lat || lat;
                lng = parsed.center?.lng || lng;
              }
            }
          } catch {
            // Ignore
          }
        }

        if (!acres || acres <= 0) {
          try {
            const farmRes = await fetch("/api/farms");
            if (farmRes.ok) {
              const farmJson = await farmRes.json();
              if (farmJson.farms && farmJson.farms.length > 0) {
                const latest = farmJson.farms[0];
                acres = latest.areaAcres;
                name = latest.name || name;
                lat = latest.center?.lat || lat;
                lng = latest.center?.lng || lng;
              }
            }
          } catch {
            // Ignore
          }
        }

        const validAcres = acres && acres > 0 ? Number(acres.toFixed(2)) : 2.5;
        const validLat = lat || 30.211;
        const validLng = lng || 74.9455;
        const dInfo = resolveDistrictFromCoords(validLat, validLng);
        const resolvedLocation = `${dInfo.district}, ${dInfo.state} (${dInfo.agroClimaticZone})`;
        const validName = name || `${dInfo.district} Farm Plot`;

        if (!isMounted) return;

        setTotalLandAcres(validAcres);
        setFarmName(validName);
        setFarmLocation(resolvedLocation);

        const calculatedPortfolio = optimizePortfolio({
          totalLandAcres: validAcres,
          season: "Rabi",
          riskAppetite: "Balanced",
          waterAvailability: "Medium",
          investmentCapacity: "Medium",
          userSoilType: "Alluvial",
        });

        setPortfolio(calculatedPortfolio);

        const initAcres: Record<string, number> = {};
        for (const item of calculatedPortfolio.allocations) {
          initAcres[item.cropId] = item.allocatedAcres;
        }
        setCustomAcres(initAcres);

        if (calculatedPortfolio.allocations.length > 0) {
          const first = calculatedPortfolio.allocations[0];
          setSimCropName(first.cropName);
          setSimArea(first.allocatedAcres);
          setSimPrice(first.expectedSellingPricePerQuintal);
          setSimYield(first.expectedYieldPerAcre);
          setSimCost(first.costPerAcre);
        }
      } catch (err) {
        console.error("[Recommendations Loading Error]", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDynamicPortfolio();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  const editedAllocations = useMemo(() => {
    if (!portfolio) return [];
    return portfolio.allocations.map((alloc) => {
      const liveAcres = customAcres[alloc.cropId] !== undefined ? customAcres[alloc.cropId] : alloc.allocatedAcres;
      const sim = simulateCropFinancials({
        areaAcres: liveAcres,
        expectedSellingPricePerQuintal: alloc.expectedSellingPricePerQuintal,
        expectedYieldQuintalsPerAcre: alloc.expectedYieldPerAcre,
        inputCostPerAcre: alloc.costPerAcre,
      });

      return {
        ...alloc,
        allocatedAcres: liveAcres,
        allocatedRevenue: sim.expectedGrossRevenue,
        allocatedCost: sim.totalEstimatedCost,
        allocatedProfit: sim.expectedNetProfit,
        breakEvenYield: sim.breakEvenYieldQuintalsPerAcre,
        breakEvenPrice: sim.breakEvenPricePerQuintal,
      };
    });
  }, [portfolio, customAcres]);

  const totalEditedAcres = useMemo(() => {
    return editedAllocations.reduce((sum, a) => sum + a.allocatedAcres, 0);
  }, [editedAllocations]);

  const totalEditedRevenue = useMemo(() => {
    return editedAllocations.reduce((sum, a) => sum + a.allocatedRevenue, 0);
  }, [editedAllocations]);

  const totalEditedCost = useMemo(() => {
    return editedAllocations.reduce((sum, a) => sum + a.allocatedCost, 0);
  }, [editedAllocations]);

  const totalEditedProfit = useMemo(() => {
    return totalEditedRevenue - totalEditedCost;
  }, [totalEditedRevenue, totalEditedCost]);

  const totalEditedRoi = useMemo(() => {
    return totalEditedCost > 0 ? Number((totalEditedRevenue / totalEditedCost).toFixed(2)) : 0;
  }, [totalEditedRevenue, totalEditedCost]);

  const simResult = useMemo(() => {
    return simulateCropFinancials({
      areaAcres: simArea,
      expectedSellingPricePerQuintal: simPrice,
      expectedYieldQuintalsPerAcre: simYield,
      inputCostPerAcre: simCost,
    });
  }, [simArea, simPrice, simYield, simCost]);

  function handleAcreChange(cropId: string, value: number) {
    setCustomAcres((prev) => ({
      ...prev,
      [cropId]: Math.max(0, Number(value.toFixed(2))),
    }));
  }

  function acceptRecommendation() {
    if (!portfolio) return;
    const payload = {
      overall: {
        title: portfolio.title,
        explanation: portfolio.diversificationExplanation,
      },
      allocations: editedAllocations.map((a: AllocatedCropItem) => ({
        name: a.cropName,
        percent: Math.round((a.allocatedAcres / (totalEditedAcres || 1)) * 100),
        score: a.score,
        expectedRevenue: a.allocatedRevenue,
        estimatedCost: a.allocatedCost,
        explanation: a.reasonsForAllocation.join(". "),
      })),
      acceptedAt: new Date().toISOString(),
      sowingDate: new Date().toISOString(),
      region: farmLocation,
      farmName,
      totalAcres: totalEditedAcres,
    };
    try {
      localStorage.setItem("acceptedRecommendation", JSON.stringify(payload));
    } catch {
      // Storage fallback
    }
    router.push("/crop-plan");
  }

  return (
    <AppShell pageTitle="Crop Recommendations">
      <div className="page-container space-y-6">
        {/* 1. Header Title Row */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-card">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="agri-badge agri-badge-emerald">
                🌾 {farmName} ({totalLandAcres.toFixed(2)} ac / {(totalLandAcres / 2.47105).toFixed(2)} ha)
              </span>
              <span className="agri-badge agri-badge-sky">
                📍 {farmLocation}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Multi-Crop Profit & Portfolio Strategy
            </h1>
            <p className="text-sm text-[var(--text-secondary)] max-w-3xl">
              Constrained multi-crop allocation scaled to your exact {totalLandAcres.toFixed(2)}-acre boundary, balancing expected yields, MSP floor protection, and climate forecasts.
            </p>
          </div>

          <button
            type="button"
            onClick={acceptRecommendation}
            className="agri-btn-primary py-3 px-6 shrink-0"
          >
            <span>✓</span>
            <span>Accept & Generate Farm Plan →</span>
          </button>
        </header>

        {loading && (
          <div className="agri-card p-12 text-center text-[var(--text-muted)] space-y-2">
            <div className="inline-block w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Running ML yield models & portfolio optimization for {totalLandAcres.toFixed(2)} acres...</p>
          </div>
        )}

        {!loading && portfolio && (
          <>
            {/* 2. Top Strategy & Financial Overview Panel */}
            <section className="agri-card p-6">
              <div className="flex items-center gap-6 flex-wrap lg:flex-nowrap">
                <div className="flex-none mx-auto lg:mx-0 p-2 rounded-2xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
                  <DonutChart
                    allocations={editedAllocations.map((a: AllocatedCropItem) => ({
                      cropName: a.cropName,
                      percentage: Math.round((a.allocatedAcres / (totalEditedAcres || 1)) * 100),
                    }))}
                  />
                </div>

                <div className="flex-1 space-y-4 min-w-0">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] font-['Space_Grotesk']">
                        {portfolio.season} Season Strategy · {portfolio.riskAppetite} Risk Profile
                      </span>
                      <h2 className="text-xl font-bold font-['Space_Grotesk'] text-[var(--text-primary)] mt-0.5">
                        {portfolio.title}
                      </h2>
                    </div>
                    <span className="agri-badge agri-badge-emerald text-xs px-3 py-1">
                      Portfolio Score: {portfolio.overallScore}/100
                    </span>
                  </div>

                  {/* 4 Financial KPI Chips with crisp high contrast */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[var(--border-subtle)]">
                    <div className="p-3 rounded-xl bg-[var(--color-emerald-bg)] border border-[var(--color-emerald-border)]">
                      <span className="text-[10px] text-[var(--color-emerald-text)] font-bold uppercase block tracking-wider">
                        Expected Net Profit
                      </span>
                      <span className="text-base font-bold font-['Space_Grotesk'] text-[var(--color-emerald-text)]">
                        {formatCurrency(totalEditedProfit)}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
                      <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase block tracking-wider">
                        Total Gross Revenue
                      </span>
                      <span className="text-base font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                        {formatCurrency(totalEditedRevenue)}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
                      <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase block tracking-wider">
                        Estimated Input Cost
                      </span>
                      <span className="text-base font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                        {formatCurrency(totalEditedCost)}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--color-sky-bg)] border border-[var(--color-sky-border)]">
                      <span className="text-[10px] text-[var(--color-sky-text)] font-bold uppercase block tracking-wider">
                        ROI Multiplier
                      </span>
                      <span className="text-base font-bold font-['Space_Grotesk'] text-[var(--color-sky-text)]">
                        {totalEditedRoi}x ({Math.round(totalEditedRoi * 100 - 100)}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Four-Part Strategic Allocation List */}
            <section className="agri-card p-6 space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2 pb-3 border-b border-[var(--border-subtle)]">
                <div>
                  <h3 className="text-base font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                    RECOMMENDED 4-PART ALLOCATION (TOTAL: {totalEditedAcres.toFixed(2)} / {totalLandAcres.toFixed(2)} ACRES)
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Adjust acreage per crop below. Financial predictions and ROI recalculate in real time.
                  </p>
                </div>
                {Math.abs(totalEditedAcres - totalLandAcres) > 0.05 && (
                  <span className="agri-badge agri-badge-amber text-xs px-3 py-1">
                    ⚠️ Allocated ({totalEditedAcres.toFixed(2)} ac) differs from boundary ({totalLandAcres.toFixed(2)} ac)
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {editedAllocations.map((alloc: AllocatedCropItem, idx: number) => (
                  <div
                    key={alloc.cropId}
                    className="p-4 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] hover:border-[var(--border-strong)] transition-all space-y-3"
                  >
                    <div className="flex justify-between items-center flex-wrap gap-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <strong className="text-sm font-bold text-[var(--text-primary)]">
                          {alloc.cropName} ({alloc.hindiName})
                        </strong>
                        <span className="agri-badge agri-badge-emerald">
                          Score: {alloc.score}/100
                        </span>
                        {alloc.mspSafety && (
                          <span className="agri-badge agri-badge-sky">
                            ✓ MSP ₹{alloc.mspPrice}/q
                          </span>
                        )}
                        <span className="text-xs text-[var(--text-muted)]">
                          · {alloc.strategyRole}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <label htmlFor={`acres-input-${alloc.cropId}`} className="text-xs font-semibold text-[var(--text-secondary)]">
                            Acres:
                          </label>
                          <input
                            id={`acres-input-${alloc.cropId}`}
                            type="number"
                            step="0.25"
                            min="0"
                            max={totalLandAcres * 2}
                            value={alloc.allocatedAcres}
                            onChange={(e) => handleAcreChange(alloc.cropId, parseFloat(e.target.value) || 0)}
                            className="agri-input w-24 text-center font-bold py-1.5 px-2"
                          />
                        </div>
                        <div className="text-right min-w-[100px]">
                          <span className="text-sm font-bold font-['Space_Grotesk'] text-[var(--color-primary)] block">
                            {formatCurrency(alloc.allocatedProfit)}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] block">Net Profit</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[var(--bg-canvas)] h-2 rounded-full overflow-hidden border border-[var(--border-subtle)]">
                      <div
                        className="bg-[var(--color-primary)] h-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (alloc.allocatedAcres / (totalLandAcres || 1)) * 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-xs text-[var(--text-secondary)] pt-1 flex-wrap gap-2">
                      <span>
                        Break-even: <strong className="text-[var(--text-primary)]">{alloc.breakEvenYield} q/ac</strong> @ ₹{alloc.breakEvenPrice}/q · Est Cost: {formatCurrency(alloc.costPerAcre)}/ac
                      </span>
                      <button
                        type="button"
                        onClick={() => setOpenExplanation(openExplanation === idx ? null : idx)}
                        className="text-xs font-bold text-[var(--color-primary)] hover:underline cursor-pointer"
                      >
                        {openExplanation === idx ? "Hide rationale ▲" : "Why this crop? ▼"}
                      </button>
                    </div>

                    {openExplanation === idx && (
                      <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] space-y-1">
                        <p className="font-bold text-[var(--color-primary-text)] font-['Space_Grotesk']">
                          ICAR & Agro-Climatic Rationale:
                        </p>
                        <ul className="list-disc list-inside space-y-0.5 text-xs">
                          {alloc.reasonsForAllocation.map((r, rIdx) => (
                            <li key={rIdx}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* 4. Interactive Financial Sensitivity Simulator */}
            <section className="agri-card p-6 space-y-4">
              <div className="border-b border-[var(--border-subtle)] pb-2">
                <span className="agri-badge agri-badge-amber mb-1">Interactive Sandbox</span>
                <h3 className="text-base font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                  📈 Profit & Volatility Sensitivity Simulator
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Simulate price volatility, yield swings, and cost inflation for your active crops.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label htmlFor="sim-crop-select" className="text-xs font-bold text-[var(--text-secondary)] block">
                    Select Crop:
                  </label>
                  <select
                    id="sim-crop-select"
                    value={simCropName}
                    onChange={(e) => {
                      const selected = portfolio.allocations.find((a) => a.cropName === e.target.value);
                      if (selected) {
                        setSimCropName(selected.cropName);
                        setSimArea(selected.allocatedAcres);
                        setSimPrice(selected.expectedSellingPricePerQuintal);
                        setSimYield(selected.expectedYieldPerAcre);
                        setSimCost(selected.costPerAcre);
                      }
                    }}
                    className="agri-select"
                  >
                    {portfolio.allocations.map((a) => (
                      <option key={a.cropId} value={a.cropName}>
                        {a.cropName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="sim-price-input" className="text-xs font-bold text-[var(--text-secondary)] block">
                    Mandi Price (₹/q):
                  </label>
                  <input
                    id="sim-price-input"
                    type="number"
                    value={simPrice}
                    onChange={(e) => setSimPrice(Number(e.target.value) || 0)}
                    className="agri-input font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="sim-yield-input" className="text-xs font-bold text-[var(--text-secondary)] block">
                    Expected Yield (q/ac):
                  </label>
                  <input
                    id="sim-yield-input"
                    type="number"
                    step="0.5"
                    value={simYield}
                    onChange={(e) => setSimYield(Number(e.target.value) || 0)}
                    className="agri-input font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="sim-cost-input" className="text-xs font-bold text-[var(--text-secondary)] block">
                    Input Cost (₹/ac):
                  </label>
                  <input
                    id="sim-cost-input"
                    type="number"
                    value={simCost}
                    onChange={(e) => setSimCost(Number(e.target.value) || 0)}
                    className="agri-input font-bold"
                  />
                </div>
              </div>

              {/* Simulation Output Card */}
              <div className="p-4 rounded-xl bg-[var(--color-emerald-bg)] border border-[var(--color-emerald-border)] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                  <span className="text-[10px] text-[var(--color-emerald-text)] uppercase font-semibold block">Simulated Revenue</span>
                  <strong className="text-sm font-bold font-['Space_Grotesk'] text-[var(--color-emerald-text)]">
                    {formatCurrency(simResult.expectedGrossRevenue)}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--color-emerald-text)] uppercase font-semibold block">Simulated Cost</span>
                  <strong className="text-sm font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                    {formatCurrency(simResult.totalEstimatedCost)}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--color-emerald-text)] uppercase font-semibold block">Simulated Net Profit</span>
                  <strong className="text-base font-black font-['Space_Grotesk'] text-[var(--color-emerald-text)]">
                    {formatCurrency(simResult.expectedNetProfit)}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--color-emerald-text)] uppercase font-semibold block">Break-Even Price</span>
                  <strong className="text-sm font-bold font-['Space_Grotesk'] text-[var(--color-sky-text)]">
                    ₹{simResult.breakEvenPricePerQuintal}/q
                  </strong>
                </div>
              </div>
            </section>

            {/* 5. 7-Scenario Stress Testing Matrix */}
            <section className="agri-card p-6 space-y-4">
              <div className="border-b border-[var(--border-subtle)] pb-2">
                <span className="agri-badge agri-badge-sky mb-1">Monte-Carlo Climate Sim</span>
                <h3 className="text-base font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                  🛡️ 7-Scenario Stress Testing & Climate Resilience Matrix
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Simulated multi-scenario impact on your {totalLandAcres.toFixed(2)}-acre farm portfolio.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {portfolio.scenarioSimulations.map((scenario) => (
                  <div
                    key={scenario.scenarioId}
                    className="p-4 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] space-y-2"
                  >
                    <div className="flex justify-between items-start gap-1">
                      <strong className="font-bold text-xs font-['Space_Grotesk'] text-[var(--text-primary)]">
                        {scenario.scenarioName}
                      </strong>
                      <span
                        className={`agri-badge ${
                          scenario.resilienceRating === "High"
                            ? "agri-badge-emerald"
                            : scenario.resilienceRating === "Moderate"
                            ? "agri-badge-amber"
                            : "agri-badge-rose"
                        }`}
                      >
                        {scenario.resilienceRating}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {scenario.description}
                    </p>
                    <div className="flex justify-between items-center text-xs pt-2 border-t border-[var(--border-subtle)]">
                      <span className="text-[var(--text-muted)]">Simulated Profit:</span>
                      <span className={`font-bold font-['Space_Grotesk'] ${scenario.simulatedProfitInr >= 0 ? "text-[var(--color-emerald-text)]" : "text-rose-500"}`}>
                        {formatCurrency(scenario.simulatedProfitInr)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
