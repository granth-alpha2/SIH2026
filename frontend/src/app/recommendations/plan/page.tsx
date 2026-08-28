"use client";
import {useEffect, useMemo, useState} from "react";

type Allocation = { name:string; percent:number; score:number; expectedRevenue:number; estimatedCost:number; explanation:string };
type Accepted = { overall:any; allocations:Allocation[]; sowingDate?:string; region?:string };

const fallback:Accepted = JSON.parse(JSON.stringify({
  overall: { title: "Balanced Maize + Beans Mix", explanation: "Balanced mix to spread risk and improve soil.", },
  allocations: [ { name: "Maize", percent:60, score:90, expectedRevenue:26000, estimatedCost:9500, explanation: "High yield and demand." }, { name: "Beans", percent:30, score:82, expectedRevenue:12000, estimatedCost:6000, explanation: "Soil improvement and steady market." } ],
  sowingDate: new Date().toISOString(),
  region: 'default'
}));

function addDays(d:Date, days:number){ const t = new Date(d); t.setDate(t.getDate()+days); return t; }

const durations:{[crop:string]:{germination:number,vegetative:number,flowering:number,maturation:number,harvestPrep:number}} = {
  Maize: {germination:7, vegetative:50, flowering:30, maturation:30, harvestPrep:7},
  Beans: {germination:6, vegetative:40, flowering:25, maturation:20, harvestPrep:7},
  Default: {germination:7, vegetative:45, flowering:28, maturation:25, harvestPrep:7}
};

function computeStages(cropName:string, sowDateStr:string){
  const s = new Date(sowDateStr);
  const spec = durations[cropName] || durations.Default;
  const sow = s;
  const germ = addDays(sow, spec.germination);
  const veg = addDays(germ, spec.vegetative);
  const flow = addDays(veg, spec.flowering);
  const mat = addDays(flow, spec.maturation);
  const prep = addDays(mat, spec.harvestPrep);
  const harvest = addDays(prep, 0);
  return [
    { key:'sowing', label:'Sowing', start:sow, end:germ },
    { key:'germination', label:'Germination', start:germ, end:veg },
    { key:'vegetative', label:'Vegetative growth', start:veg, end:flow },
    { key:'flowering', label:'Flowering', start:flow, end:mat },
    { key:'harvestPrep', label:'Harvest preparation', start:mat, end:prep },
    { key:'harvest', label:'Harvest', start:prep, end:harvest },
  ];
}

function fmt(d:Date){ return d.toLocaleDateString(); }

export default function CropPlannerPage(){
  const [accepted, setAccepted] = useState<Accepted | null>(null);
  const [sowing, setSowing] = useState<string | undefined>(undefined);
  const [region, setRegion] = useState<string>('default');

  useEffect(()=>{
    try{
      const raw = localStorage.getItem('acceptedRecommendation');
      if(raw){ const parsed = JSON.parse(raw); setAccepted(parsed); setSowing(parsed.sowingDate || parsed.acceptedAt || new Date().toISOString()); setRegion(parsed.region || 'default'); return; }
    }catch(e){}
    setAccepted(fallback); setSowing(fallback.sowingDate);
  },[]);

  const plans = useMemo(()=>{
    if(!accepted || !sowing) return [];
    return accepted.allocations.map(a=>({ crop:a.name, stages: computeStages(a.name, sowing), explanation:a.explanation }));
  },[accepted, sowing]);

  if(!accepted) return <div className="p-4">Loading...</div>;

  return (
    <main className="p-4 max-w-3xl mx-auto">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Crop Lifecycle Planner</h1>
        <p className="text-sm text-gray-600">Schedules are advisory. Consult local agronomists before acting.</p>
      </header>

      <section className="bg-white p-3 rounded mb-4">
        <label className="block text-sm text-gray-700">Approximate sowing date</label>
        <input type="date" value={sowing ? new Date(sowing).toISOString().slice(0,10) : ''} onChange={(e)=>setSowing(new Date(e.target.value).toISOString())} className="mt-1 p-2 border rounded w-full" />
        <label className="block text-sm text-gray-700 mt-3">Region</label>
        <select value={region} onChange={(e)=>setRegion(e.target.value)} className="mt-1 p-2 border rounded w-full">
          <option value="default">Default region</option>
          <option value="tropical">Tropical</option>
          <option value="temperate">Temperate</option>
        </select>
      </section>

      <section className="space-y-4">
        {plans.map((p, idx)=>{
          const first = p.stages[0].start;
          const last = p.stages[p.stages.length-1].end;
          const totalDays = Math.round((last.getTime()-first.getTime())/(1000*60*60*24)) || 1;
          return (
            <div key={p.crop} className="bg-white p-3 rounded shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{p.crop}</div>
                  <div className="text-xs text-gray-500">{fmt(first)} — {fmt(last)} ({totalDays} days)</div>
                </div>
                <div className="text-sm text-gray-600">Advisory</div>
              </div>

              <div className="mt-3 space-y-2">
                {p.stages.map(s=>{
                  const days = Math.round((s.end.getTime()-s.start.getTime())/(1000*60*60*24)) || 1;
                  const widthPct = Math.round((days/totalDays)*100);
                  return (
                    <div key={s.key}>
                      <div className="flex justify-between text-sm text-gray-700">
                        <div>{s.label}</div>
                        <div className="text-xs text-gray-500">{fmt(s.start)} — {fmt(s.end)} • {days}d</div>
                      </div>
                      <div className="w-full bg-gray-100 h-3 rounded mt-1 overflow-hidden">
                        <div style={{width:`${widthPct}%`}} className="h-3 bg-green-500/80"></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <details className="mt-3 text-sm text-gray-700">
                <summary className="cursor-pointer">Why this schedule?</summary>
                <div className="mt-2">{p.explanation}. These timings are generalized and depend on variety, local climate and management.</div>
              </details>
            </div>
          );
        })}
      </section>

      <footer className="mt-6 text-xs text-gray-500">This planner provides generalized schedules as advisory information, not guaranteed agronomic instructions.</footer>
    </main>
  );
}
