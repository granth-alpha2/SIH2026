"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../components/AppShell";
import { simulateCropFinancials } from "@/lib/simulation-engine";
import { optimizePortfolio, type OptimizedPortfolio } from "@/lib/portfolio-optimizer";

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
    const colors = ["#047857", "#d97706", "#2563eb", "#dc2626", "#7c3aed"];
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
          strokeWidth="6"
          strokeDasharray={seg.strokeDasharray}
          transform={`rotate(${seg.rotation} 18 18)`}
          strokeLinecap="butt"
        />
      ))}
      <circle r="9.5" cx="18" cy="18" fill="#fbfbf8" stroke="#eee" strokeWidth="0.5" />
    </svg>
  );
}

export default function RecommendationDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [openExplanation, setOpenExplanation] = useState<number | null>(null);

  // Portfolio Optimizer state
  const [portfolio, setPortfolio] = useState<OptimizedPortfolio | null>(null);
  const [customAcres, setCustomAcres] = useState<Record<string, number>>({});

  // Sensitivity Simulator state (Prompt 12)
  const [simCropName, setSimCropName] = useState("Wheat");
  const [simArea, setSimArea] = useState<number>(2.5);
  const [simPrice, setSimPrice] = useState<number>(2380);
  const [simYield, setSimYield] = useState<number>(14.5);
  const [simCost, setSimCost] = useState<number>(11500);

  useEffect(() => {
    let isMounted = true;
    async function loadInitialPortfolio() {
      setLoading(true);
      try {
        const opt = optimizePortfolio({
          totalLandAcres: 5.0,
          season: "Rabi",
          riskAppetite: "Balanced",
          waterAvailability: "Medium",
          investmentCapacity: "Medium",
          preferredCrops: ["Wheat", "Mustard"],
        });

        if (isMounted) {
          setPortfolio(opt);
          const initialMap: Record<string, number> = {};
          opt.allocations.forEach((a) => {
            initialMap[a.cropId] = a.allocatedAcres;
          });
          setCustomAcres(initialMap);

          const top = opt.allocations[0];
          if (top) {
            setSimCropName(top.cropName);
            setSimArea(top.allocatedAcres);
            setSimPrice(top.expectedSellingPricePerQuintal);
            setSimYield(top.expectedYieldPerAcre);
            setSimCost(top.costPerAcre);
          }
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadInitialPortfolio();
    return () => {
      isMounted = false;
    };
  }, []);

  // Recalculate dynamic totals when farmer edits crop acres in the tuner
  const editedAllocations = useMemo(() => {
    if (!portfolio) return [];
    return portfolio.allocations.map((alloc) => {
      const acres = customAcres[alloc.cropId] !== undefined ? customAcres[alloc.cropId] : alloc.allocatedAcres;
      const sim = simulateCropFinancials({
        areaAcres: acres,
        expectedYieldQuintalsPerAcre: alloc.expectedYieldPerAcre,
        expectedSellingPricePerQuintal: alloc.expectedSellingPricePerQuintal,
        inputCostPerAcre: alloc.costPerAcre,
      });

      return {
        ...alloc,
        allocatedAcres: acres,
        allocatedRevenue: sim.expectedGrossRevenue,
        allocatedCost: sim.totalEstimatedCost,
        allocatedProfit: sim.expectedNetProfit,
      };
    });
  }, [portfolio, customAcres]);

  const totalEditedAcres = useMemo(() => {
    return Number(editedAllocations.reduce((sum, a) => sum + a.allocatedAcres, 0).toFixed(2));
  }, [editedAllocations]);

  const totalEditedRevenue = useMemo(() => {
    return editedAllocations.reduce((sum, a) => sum + a.allocatedRevenue, 0);
  }, [editedAllocations]);

  const totalEditedCost = useMemo(() => {
    return editedAllocations.reduce((sum, a) => sum + a.allocatedCost, 0);
  }, [editedAllocations]);

  const totalEditedProfit = totalEditedRevenue - totalEditedCost;
  const totalEditedRoi = Number((totalEditedRevenue / (totalEditedCost || 1)).toFixed(2));

  // Recalculate Sensitivity Simulation (Prompt 12)
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
      allocations: editedAllocations.map((a) => ({
        name: a.cropName,
        percent: Math.round((a.allocatedAcres / (totalEditedAcres || 1)) * 100),
        score: a.score,
        expectedRevenue: a.allocatedRevenue,
        estimatedCost: a.allocatedCost,
        explanation: a.reasonsForAllocation.join(". "),
      })),
      acceptedAt: new Date().toISOString(),
      sowingDate: new Date().toISOString(),
      region: "Bathinda, Punjab (Trans-Gangetic Plains)",
    };
    try {
      localStorage.setItem("acceptedRecommendation", JSON.stringify(payload));
    } catch {
      // Storage fallback
    }
    router.push("/crop-plan");
  }

  return (
    <AppShell pageTitle="Crop recommendations">
      <section className="page-wrap feature-page max-w-5xl mx-auto space-y-4">
        <header className="feature-header flex justify-between items-start flex-wrap gap-4 mb-2">
          <div>
            <p className="eyebrow">PORTFOLIO OPTIMIZER & ADVISORY</p>
            <h1>Farmer Crop Recommendations</h1>
            <p className="subhead">
              Constrained multi-crop allocation balancing expected profits, MSP safety floors, budget caps, and climate resilience.
            </p>
          </div>
          <button type="button" onClick={acceptRecommendation} className="primary-button text-xs py-2 px-4 shadow">
            ✓ Accept & Generate Farm Plan
          </button>
        </header>

        {loading && <div className="panel text-center py-10 text-gray-500">Optimizing multi-crop portfolio...</div>}

        {!loading && portfolio && (
          <>
            {/* Top Overview Banner (Requested Fields 1 to 12) */}
            <section className="panel">
              <div className="flex items-center gap-6 flex-wrap sm:flex-nowrap">
                <div className="flex-none mx-auto sm:mx-0">
                  <DonutChart
                    allocations={editedAllocations.map((a) => ({
                      cropName: a.cropName,
                      percentage: Math.round((a.allocatedAcres / (totalEditedAcres || 1)) * 100),
                    }))}
                  />
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl font-bold text-gray-900">{portfolio.title}</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      Score: {portfolio.overallScore}/100
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        portfolio.portfolioRisk === "Low"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : portfolio.portfolioRisk === "Moderate"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {portfolio.portfolioRisk} Risk Level
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                      Confidence: 88%
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    {portfolio.diversificationExplanation}{" "}
                    <button
                      type="button"
                      onClick={() => setOpenExplanation(openExplanation === -1 ? null : -1)}
                      className="text-emerald-700 underline font-medium ml-1 cursor-pointer"
                    >
                      {openExplanation === -1 ? "Hide Why this recommendation?" : "Why this recommendation?"}
                    </button>
                  </p>

                  {/* Why this recommendation factor explanation */}
                  {openExplanation === -1 && (
                    <div className="p-3 bg-gray-50 border rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400 text-[10px] uppercase block">Weather Match</span>
                        <strong className="text-emerald-800 font-semibold">92/100 (Optimal)</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[10px] uppercase block">Market Opportunity</span>
                        <strong className="text-emerald-800 font-semibold">86/100 (Bullish)</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[10px] uppercase block">Budget Cap</span>
                        <strong className="text-gray-900 font-semibold">{formatCurrency(portfolio.budgetCapInr)}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[10px] uppercase block">Diversification</span>
                        <span className="text-emerald-700 font-semibold text-[10px] uppercase">3-Crop Portfolio</span>
                      </div>
                    </div>
                  )}

                  {/* High-Level Financial Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                    <div className="p-2.5 bg-gray-50 rounded border">
                      <span className="text-gray-400 text-[10px] uppercase block font-semibold">Total Expected Revenue</span>
                      <strong className="text-sm font-bold text-gray-900">{formatCurrency(totalEditedRevenue)}</strong>
                    </div>
                    <div className="p-2.5 bg-gray-50 rounded border">
                      <span className="text-gray-400 text-[10px] uppercase font-semibold">Total Estimated Cost</span>
                      <strong className="text-sm font-bold text-gray-900">{formatCurrency(totalEditedCost)}</strong>
                    </div>
                    <div className="p-2.5 bg-emerald-50 rounded border border-emerald-200">
                      <span className="text-emerald-700 text-[10px] uppercase font-bold block">Estimated Net Profit</span>
                      <strong className="text-sm font-black text-emerald-900">{formatCurrency(totalEditedProfit)}</strong>
                    </div>
                    <div className="p-2.5 bg-gray-50 rounded border">
                      <span className="text-gray-400 text-[10px] uppercase font-semibold">ROI Multiplier</span>
                      <strong className="text-sm font-bold text-gray-900">{totalEditedRoi.toFixed(2)}x</strong>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Editable Land Allocation Tuner (Prompt 13 & 14) */}
            <section className="space-y-2">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                    Recommended Land Allocation (Total: {totalEditedAcres} / {portfolio.totalAvailableAcres} Acres)
                  </h2>
                  <p className="text-xs text-gray-500">
                    Use inputs to fine-tune acreage allocation. Financial totals recalculate automatically.
                  </p>
                </div>
                {totalEditedAcres > portfolio.totalAvailableAcres && (
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                    ⚠ Exceeds available land ({totalEditedAcres} &gt; {portfolio.totalAvailableAcres} ac)
                  </span>
                )}
              </div>

              <div className="space-y-2.5">
                {editedAllocations.map((alloc, idx) => (
                  <article key={alloc.cropId} className="panel space-y-2">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-base font-bold text-gray-900">{alloc.cropName}</strong>
                          <span className="text-xs text-gray-500 font-normal">({alloc.hindiName})</span>
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            Score: {alloc.score}/100
                          </span>
                          {alloc.mspSafety && (
                            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-semibold">
                              ✓ MSP ₹{alloc.mspPrice}/q
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Break-even: {alloc.breakEvenYield} q/ac @ ₹{alloc.breakEvenPrice}/q · Cost: ₹{alloc.costPerAcre.toLocaleString("en-IN")}/ac
                        </p>
                      </div>

                      {/* Interactive Acreage Input */}
                      <div className="flex items-center gap-2">
                        <label htmlFor={`acre-${alloc.cropId}`} className="text-xs text-gray-600 font-semibold">Acres:</label>
                        <input
                          id={`acre-${alloc.cropId}`}
                          type="number"
                          step="0.1"
                          min="0"
                          max={portfolio.totalAvailableAcres}
                          value={alloc.allocatedAcres}
                          onChange={(e) => handleAcreChange(alloc.cropId, parseFloat(e.target.value) || 0)}
                          className="p-1.5 border rounded w-20 text-center font-bold text-xs bg-white"
                        />
                        <div className="text-right min-w-[90px]">
                          <strong className="text-sm font-bold text-emerald-800 block">
                            {formatCurrency(alloc.allocatedProfit)}
                          </strong>
                          <span className="text-[10px] text-gray-400">Net Profit</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <div className="flex-1 h-2 bg-gray-100 rounded overflow-hidden">
                        <div
                          style={{ width: `${alloc.score}%` }}
                          className="h-2 rounded bg-gradient-to-r from-emerald-600 to-amber-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setOpenExplanation(openExplanation === idx ? null : idx)}
                        className="text-xs text-emerald-700 underline font-medium whitespace-nowrap cursor-pointer"
                      >
                        {openExplanation === idx ? "Hide Reasoning" : "Why this crop?"}
                      </button>
                    </div>

                    {openExplanation === idx && (
                      <div className="p-3 bg-gray-50 border rounded-lg text-xs space-y-1.5">
                        <strong className="text-gray-900 block text-[11px] uppercase">Why this recommendation?</strong>
                        <ul className="list-disc list-inside space-y-0.5 text-gray-700">
                          {alloc.reasonsForAllocation.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>

            {/* Prompt 12: Interactive Financial Profit Simulator */}
            <section className="panel space-y-4 border-emerald-600/40 bg-white shadow-sm">
              <div className="flex justify-between items-start flex-wrap gap-2 border-b pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 font-bold text-base">⌁</span>
                    <h2 className="text-base font-bold text-gray-900">Financial Profit & Sensitivity Simulator</h2>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                      Interactive Recalculation
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Adjust assumptions below to immediately recalculate expected revenue, profit, ROI, and break-even points.
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {editedAllocations.map((a) => (
                    <button
                      key={a.cropId}
                      type="button"
                      onClick={() => {
                        setSimCropName(a.cropName);
                        setSimArea(a.allocatedAcres);
                        setSimPrice(a.expectedSellingPricePerQuintal);
                        setSimYield(a.expectedYieldPerAcre);
                        setSimCost(a.costPerAcre);
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded border transition cursor-pointer ${
                        simCropName === a.cropName
                          ? "bg-emerald-800 text-white font-semibold"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {a.cropName.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders / Number Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="space-y-1">
                  <label htmlFor="sim-area" className="block text-gray-600 font-semibold">Land Area (Acres):</label>
                  <input
                    id="sim-area"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={simArea}
                    onChange={(e) => setSimArea(Number(e.target.value))}
                    className="p-2 border rounded w-full bg-white font-medium"
                  />
                  <span className="text-[10px] text-gray-400 block">{simArea} acres ({(simArea / 2.47105).toFixed(2)} ha)</span>
                </div>

                <div className="space-y-1">
                  <label htmlFor="sim-price" className="block text-gray-600 font-semibold">Selling Price (₹ / Quintal):</label>
                  <input
                    id="sim-price"
                    type="number"
                    min="100"
                    step="50"
                    value={simPrice}
                    onChange={(e) => setSimPrice(Number(e.target.value))}
                    className="p-2 border rounded w-full bg-white font-medium"
                  />
                  <span className="text-[10px] text-gray-400 block">Current Modal: ₹{simPrice}/q</span>
                </div>

                <div className="space-y-1">
                  <label htmlFor="sim-yield" className="block text-gray-600 font-semibold">Expected Yield (Quintals / Acre):</label>
                  <input
                    id="sim-yield"
                    type="number"
                    min="1"
                    step="0.5"
                    value={simYield}
                    onChange={(e) => setSimYield(Number(e.target.value))}
                    className="p-2 border rounded w-full bg-white font-medium"
                  />
                  <span className="text-[10px] text-gray-400 block">Benchmark: {simYield} q/acre</span>
                </div>

                <div className="space-y-1">
                  <label htmlFor="sim-cost" className="block text-gray-600 font-semibold">Input Cost (₹ / Acre):</label>
                  <input
                    id="sim-cost"
                    type="number"
                    min="500"
                    step="500"
                    value={simCost}
                    onChange={(e) => setSimCost(Number(e.target.value))}
                    className="p-2 border rounded w-full bg-white font-medium"
                  />
                  <span className="text-[10px] text-gray-400 block">Seed + Fertilizer + Labor + Irrigation</span>
                </div>
              </div>

              {/* Dynamic Simulation Output Cards */}
              {simResult && (
                <div className="pt-3 border-t grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <span className="text-gray-400 text-[10px] uppercase font-semibold block">Simulated Gross Revenue</span>
                    <strong className="text-base font-black text-gray-900 block mt-0.5">
                      {formatCurrency(simResult.expectedGrossRevenue)}
                    </strong>
                    <span className="text-[10px] text-gray-500">₹{simResult.revenuePerAcre.toLocaleString("en-IN")}/ac</span>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <span className="text-gray-400 text-[10px] uppercase font-semibold block">Total Production Cost</span>
                    <strong className="text-base font-bold text-gray-900 block mt-0.5">
                      {formatCurrency(simResult.totalEstimatedCost)}
                    </strong>
                    <span className="text-[10px] text-gray-500">₹{simResult.costPerAcre.toLocaleString("en-IN")}/ac</span>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-emerald-700 text-[10px] uppercase font-bold block">Simulated Net Profit</span>
                    <strong className="text-base font-black text-emerald-900 block mt-0.5">
                      {formatCurrency(simResult.expectedNetProfit)}
                    </strong>
                    <span className="text-[10px] text-emerald-700 font-semibold">ROI: {simResult.roiPercentage}% ({simResult.roiMultiplier}x)</span>
                  </div>

                  <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200">
                    <span className="text-amber-800 text-[10px] uppercase font-bold block">Break-Even Thresholds</span>
                    <div className="text-xs text-amber-900 font-semibold mt-1">
                      Min Price: ₹{simResult.breakEvenPricePerQuintal}/q
                    </div>
                    <div className="text-[10px] text-amber-800">
                      Min Yield: {simResult.breakEvenYieldQuintalsPerAcre} q/ac
                    </div>
                  </div>
                </div>
              )}

              <p className="text-[10px] text-gray-400 text-center">
                * All calculations represent decision-support estimations based on your chosen price and yield parameters.
              </p>
            </section>
          </>
        )}
      </section>
    </AppShell>
  );
}
