"use client";
import {useEffect, useState, useRef} from "react";

type Notification = { id:string; type:string; title:string; body:string; data?:any; level?:string; read:boolean; createdAt:string };

async function fetchNotifications(){
  const res = await fetch('/api/notifications');
  if(!res.ok) return [];
  const js = await res.json();
  return js.notifications as Notification[];
}

export default function NotificationsPage(){
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const seenRef = useRef<Record<string,true>>({});

  useEffect(()=>{
    let mounted = true;
    async function load(){
      setLoading(true);
      const n = await fetchNotifications();
      if(!mounted) return;
      setItems(n);
      setLoading(false);
      n.forEach(x=> seenRef.current[x.id]=true);
    }
    load();
    const iv = setInterval(async ()=>{
      const n = await fetchNotifications();
      // detect new items
      const newOnes = n.filter(x=>!seenRef.current[x.id]);
      if(newOnes.length){
        // browser notification permission
        if(typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'){
          newOnes.slice(0,3).forEach(nf=> new Notification(nf.title, { body: nf.body }));
        }
        newOnes.forEach(x=> seenRef.current[x.id]=true);
      }
      setItems(n);
    }, 10000);
    return ()=>{ mounted=false; clearInterval(iv); };
  },[]);

  async function markRead(id:string, read:boolean){
    await fetch('/api/notifications', { method:'PATCH', body: JSON.stringify({ id, read }), headers:{ 'content-type':'application/json' } });
    setItems(prev => prev.map(p=> p.id===id? {...p, read}:p));
  }

  async function markAllRead(){
    await Promise.all(items.filter(i=>!i.read).map(i=> fetch('/api/notifications', { method:'PATCH', body: JSON.stringify({ id:i.id, read:true }), headers:{ 'content-type':'application/json' } } )));
    setItems(prev => prev.map(p=> ({...p, read:true})));
  }

  async function createMock(type:string){
    const body = { type, title: `${type} alert`, body: `This is a mock ${type} notification for testing.`, data:{} };
    await fetch('/api/notifications', { method:'POST', body: JSON.stringify(body), headers:{ 'content-type':'application/json' } });
    const n = await fetchNotifications();
    setItems(n);
  }

  return (
    <main className="p-4 max-w-3xl mx-auto">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-gray-600">In-app alerts for irrigation, weather, disease risk, market, and crop stages.</p>
        </div>
        <div className="space-x-2">
          <button onClick={()=>{ if('Notification' in window && Notification.permission !== 'granted') Notification.requestPermission(); }} className="px-3 py-2 border rounded">Enable browser</button>
          <button onClick={markAllRead} className="px-3 py-2 bg-green-600 text-white rounded">Mark all read</button>
        </div>
      </header>

      <section className="mb-4">
        <div className="flex gap-2 flex-wrap">
          <button onClick={()=>createMock('irrigation')} className="px-2 py-1 border rounded text-sm">Mock irrigation</button>
          <button onClick={()=>createMock('weather')} className="px-2 py-1 border rounded text-sm">Mock weather</button>
          <button onClick={()=>createMock('disease')} className="px-2 py-1 border rounded text-sm">Mock disease</button>
          <button onClick={()=>createMock('market')} className="px-2 py-1 border rounded text-sm">Mock market</button>
          <button onClick={()=>createMock('crop-stage')} className="px-2 py-1 border rounded text-sm">Mock crop-stage</button>
        </div>
      </section>

      <section className="space-y-2">
        {loading && <div>Loading...</div>}
        {items.map(it=> (
          <article key={it.id} className={`p-3 bg-white rounded shadow-sm flex justify-between ${it.read? 'opacity-60':''}`}>
            <div>
              <div className="flex items-center gap-2">
                <strong>{it.title}</strong>
                <span className="text-xs text-gray-500">{new Date(it.createdAt).toLocaleString()}</span>
                {!it.read && <span className="ml-2 text-xs text-white bg-red-600 px-2 py-0.5 rounded">new</span>}
              </div>
              <div className="text-sm text-gray-700 mt-1">{it.body}</div>
            </div>
            <div className="flex flex-col justify-between">
              <button onClick={()=>markRead(it.id, !it.read)} className="text-sm text-green-700 underline">{it.read? 'Mark unread':'Mark read'}</button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
import UnavailableFeature from "../components/UnavailableFeature";

export default function NotificationsPage() {
  return <UnavailableFeature eyebrow="NOTIFICATIONS" title="Notifications" description="Notifications will appear here after crop plans and notification rules are connected." />;
}