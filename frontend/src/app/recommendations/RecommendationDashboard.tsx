"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";

type CropAllocation = { name: string; percent: number; score: number; expectedRevenue: number; estimatedCost: number; explanation: string };

const mockData = {
  overall: {
    title: "Balanced Maize + Beans Mix",
    cropScore: 87,
    expectedRevenue: 42000,
    estimatedCost: 18500,
    expectedProfit: 23500,
    roi: 1.27,
    riskLevel: "Moderate",
    weatherSuitability: 0.82,
    marketOpportunity: 0.75,
    confidence: 0.78,
    explanation: "This mix balances high-yield maize with nitrogen-fixing beans to improve soil health, spread market risk, and match seasonal rainfall patterns.",
  },
  allocations: [
    { name: "Maize", percent: 60, score: 90, expectedRevenue: 26000, estimatedCost: 9500, explanation: "High expected yield this season and strong local demand." },
    { name: "Beans", percent: 30, score: 82, expectedRevenue: 12000, estimatedCost: 6000, explanation: "Fixes nitrogen, reduces fertiliser cost next season, steady market." },
    { name: "Cover crop", percent: 10, score: 65, expectedRevenue: 4000, estimatedCost: 3000, explanation: "Improves soil structure and reduces erosion risk." },
  ] as CropAllocation[],
};

function formatCurrency(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function DonutChart({allocations}:{allocations:CropAllocation[]}){
  const total = allocations.reduce((s,a)=>s+a.percent,0);
  let angle = -90;
  return (
    <svg viewBox="0 0 36 36" className="w-36 h-36">
      {allocations.map((a, i)=>{
        const frac = a.percent/total;
        const dash = String(frac*100);
        const strokeDasharray = `${dash} ${100-dash}`;
        const rotation = angle;
        angle += frac*360;
        const colors = ["#23704a","#e9b94c","#ec8d6e"];
        return <circle key={i} r="15.91549430918954" cx="18" cy="18" fill="transparent" stroke={colors[i%colors.length]} strokeWidth="6" strokeDasharray={strokeDasharray} transform={`rotate(${rotation} 18 18)`} strokeLinecap="butt" />
      })}
      <circle r="9.5" cx="18" cy="18" fill="#fbfbf8" stroke="#eee" strokeWidth="0.5" />
    </svg>
  );
}

export default function RecommendationDashboard(){
  const [open, setOpen] = useState<number | null>(null);
  const d = mockData;
  const router = useRouter();

  function acceptRecommendation(){
    const payload = { overall: d.overall, allocations: d.allocations, acceptedAt: new Date().toISOString(), sowingDate: new Date().toISOString(), region: "default" };
    try{ localStorage.setItem('acceptedRecommendation', JSON.stringify(payload)); }catch(e){}
    router.push('/recommendations/plan');
  }

  return (
    <main className="p-4 sm:p-6 max-w-3xl mx-auto">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Recommendation</h1>
        <p className="text-sm text-muted-foreground mt-1">Clear, farmer-friendly guidance for this season.</p>
      </header>

      <section className="bg-white p-4 rounded-lg shadow-sm mb-4">
        <div className="flex items-center gap-4">
          <div className="flex-none">
            <DonutChart allocations={d.allocations} />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold">{d.overall.title}</h2>
            <p className="text-sm text-muted-foreground">Why this recommendation? <button onClick={()=>setOpen(open===-1?null:-1)} className="underline text-green-700 ml-2">Explain</button></p>
            {open===-1 && (
              <div className="mt-2 text-sm text-gray-700">{d.overall.explanation}</div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-500">Expected revenue</div>
                <div className="font-medium">{formatCurrency(d.overall.expectedRevenue)}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-500">Estimated cost</div>
                <div className="font-medium">{formatCurrency(d.overall.estimatedCost)}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-500">Expected profit</div>
                <div className="font-medium">{formatCurrency(d.overall.expectedProfit)}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-500">ROI</div>
                <div className="font-medium">{(d.overall.roi).toFixed(2)}x</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Crop allocation</h3>
        <div className="space-y-2">
          {d.allocations.map((c, idx)=> (
            <div key={c.name} className="bg-white p-3 rounded shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{c.name} <span className="text-xs text-gray-500">{c.percent}%</span></div>
                  <div className="text-xs text-gray-500">Crop score: {c.score}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{formatCurrency(c.expectedRevenue - c.estimatedCost)}</div>
                  <div className="text-xs text-gray-500">Est. profit</div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="flex-1 h-2 bg-gray-100 rounded overflow-hidden mr-3">
                  <div style={{width:`${c.score}%`}} className={`h-2 rounded bg-gradient-to-r from-green-600 to-yellow-400`}></div>
                </div>
                <button onClick={()=>setOpen(open===idx?null:idx)} className="text-sm text-green-700 underline">Why this recommendation?</button>
              </div>
              {open===idx && (
                <div className="mt-2 text-sm text-gray-700">{c.explanation}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white p-3 rounded shadow-sm mb-4">
        <h3 className="text-lg font-semibold">Risk & Suitability</h3>
        <div className="mt-2 grid grid-cols-1 gap-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Risk level</div>
            <div className="font-medium">{d.overall.riskLevel}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Weather suitability</div>
            <div className="w-full bg-gray-100 h-3 rounded mt-1 overflow-hidden">
              <div style={{width:`${d.overall.weatherSuitability*100}%`}} className="h-3 bg-green-500" />
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Market opportunity</div>
            <div className="w-full bg-gray-100 h-3 rounded mt-1 overflow-hidden">
              <div style={{width:`${d.overall.marketOpportunity*100}%`}} className="h-3 bg-yellow-500" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Confidence</div>
            <div className="font-medium">{Math.round(d.overall.confidence*100)}%</div>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold mb-2">Explanation</h3>
        <div className="bg-white p-3 rounded shadow-sm text-sm text-gray-700">{d.overall.explanation}</div>
      </section>

      <footer className="text-center text-xs text-gray-500">Estimates are illustrative. For farm-specific planning, connect your farm data and local market feeds.</footer>
      <div className="fixed bottom-4 right-4">
        <button onClick={acceptRecommendation} className="bg-green-600 text-white px-4 py-2 rounded-lg shadow">Accept recommendation</button>
      </div>
    </main>
  );
}
