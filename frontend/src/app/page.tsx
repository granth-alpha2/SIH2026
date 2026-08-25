/// <reference types="google.maps" />
"use client";

import { useEffect, useState } from "react";
import { importLibrary } from "@googlemaps/js-api-loader";
import FarmMapPicker, { type FarmSelection } from "./components/FarmMapPicker";

type Crop = { name: string; icon: string; score: number; profit: number; risk: string; color: string };

const crops: Crop[] = [
  { name: "Wheat", icon: "🌾", score: 91, profit: 140000, risk: "Low risk", color: "gold" },
  { name: "Mustard", icon: "🌼", score: 87, profit: 98000, risk: "Low risk", color: "coral" },
  { name: "Maize", icon: "🌽", score: 83, profit: 86000, risk: "Medium risk", color: "green" },
];

const formatMoney = (value: number) => `₹${(value / 100000).toFixed(2)}L`;

export default function Home() {
  const [area, setArea] = useState(0);
  const [activeNav, setActiveNav] = useState("Overview");
  const [showSetup, setShowSetup] = useState(false);
  const [risk, setRisk] = useState("Balanced");
  const [notice, setNotice] = useState("");
  const [farmSelection, setFarmSelection] = useState<FarmSelection | null>(null);
  const totalProfit = Math.round(area * 24600);

  useEffect(() => {
    const handleFarmSelection = (event: Event) => {
      const selection = (event as CustomEvent<FarmSelection>).detail;
      setFarmSelection(selection);
      if (selection.boundary.length < 3) return;
      const mapElement = document.querySelector<HTMLDivElement>(".farm-map");
      if (!mapElement) return;
      importLibrary("maps").then((mapsLibrary) => {
        const { Map } = mapsLibrary as google.maps.MapsLibrary;
        const map = new Map(mapElement, { center: selection.center, zoom: 17, mapTypeId: "satellite", streetViewControl: false, mapTypeControl: true, fullscreenControl: false });
        new google.maps.Polygon({ map, paths: selection.boundary, editable: false, fillColor: "#a9d46f", fillOpacity: 0.45, strokeColor: "#23704a", strokeWeight: 3 });
        const location = document.querySelector<HTMLElement>(".location");
        if (location) location.textContent = "⌖ Selected farm · Boundary from Google Maps";
      });
    };
    window.addEventListener("farm-selection-change", handleFarmSelection);
    return () => window.removeEventListener("farm-selection-change", handleFarmSelection);
  }, []);

  function runAnalysis() {
    setShowSetup(false);
    setNotice(farmSelection?.boundary.length ? `Farm boundary saved from the map: ${area.toFixed(2)} acres. Your plan is ready.` : "Your farm analysis is ready. Plan updated with current market signals.");
    window.setTimeout(() => setNotice(""), 4000);
  }


  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">✳</span><span>agriprofit</span></div>
        <div className="profile"><div className="avatar">RK</div><div><strong>Ravi Kumar</strong><small>Farmer account</small></div><span className="chevron">⌄</span></div>
        <nav aria-label="Main navigation">
          {["Overview", "My farms", "Crop plan", "Market watch", "Weather", "Assistant"].map((item, index) => (
            <button key={item} className={`nav-item ${activeNav === item ? "active" : ""}`} onClick={() => setActiveNav(item)}><span>{["⌂", "▧", "◒", "↗", "☼", "◌"][index]}</span>{item}</button>
          ))}
        </nav>
        <div className="sidebar-bottom"><button className="nav-item"><span>⚙</span>Settings</button><button className="nav-item"><span>↪</span>Sign out</button><p>AgriProfit v1.0<br /><b>Built for better harvests.</b></p></div>
      </aside>

      <section className="content">
        <header className="topbar"><div className="mobile-brand">✳ agriprofit</div><div className="breadcrumbs">Workspace <span>/</span> <b>{activeNav}</b></div><div className="top-actions"><button className="icon-button" aria-label="Notifications">♧<i /></button><button className="help-button">? <span>Help & support</span></button><div className="mini-avatar">RK</div></div></header>
        <div className="page-wrap">
          <div className="welcome-row"><div><p className="eyebrow">MONDAY, 25 AUGUST 2026</p><h1>Good morning, Ravi <span>✦</span></h1><p className="subhead">Here&apos;s how your farm is looking today.</p></div><button className="primary-button" onClick={() => setShowSetup(true)}>＋ Add new farm</button></div>
          {notice && <div className="notice">✓ {notice}</div>}

          <section className="stats-grid" aria-label="Farm summary">
            <article className="stat-card accent"><div className="stat-icon">▦</div><p>Total farm area</p><strong>{area.toFixed(1)} <small>acres</small></strong><span className="stat-link">Across 1 active farm ↗</span></article>
            <article className="stat-card"><div className="stat-icon dark">◒</div><p>Estimated profit</p><strong>{formatMoney(totalProfit)}</strong><span className="trend">↗ 12.4% <em>vs last season</em></span></article>
            <article className="stat-card"><div className="stat-icon pale">⌁</div><p>Farm health</p><strong>Good <span className="status-dot" /></strong><span className="stat-link">View health report ↗</span></article>
            <article className="stat-card"><div className="stat-icon coral-bg">☼</div><p>Weather outlook</p><strong>28° <small>Clear skies</small></strong><span className="stat-link">Next 7 days ↗</span></article>
          </section>

          <section className="main-grid">
            <article className="panel map-panel"><div className="panel-heading"><div><p className="eyebrow">ACTIVE FARM</p><h2>Green Valley Farm</h2><span className="location">⌖ Nashik, Maharashtra <b>•</b> Updated just now</span></div><button className="more-button">•••</button></div><div className="farm-map"><div className="map-label">NASHIK DISTRICT<div>MAHARASHTRA</div></div><div className="field field-one">WHEAT<br /><b>4.2 ACRES</b></div><div className="field field-two">MUSTARD<br /><b>3.1 ACRES</b></div><div className="field field-three">MAIZE<br /><b>2.7 ACRES</b></div><div className="map-pin">✦</div><div className="map-controls"><button aria-label="Zoom in">+</button><button aria-label="Zoom out">−</button></div><div className="map-scale">500 m</div></div><div className="map-footer"><span><i className="legend wheat" />Wheat <b>4.2 ac</b></span><span><i className="legend mustard" />Mustard <b>3.1 ac</b></span><span><i className="legend maize" />Maize <b>2.7 ac</b></span><button onClick={() => setShowSetup(true)}>Edit allocation ↗</button></div></article>
            <article className="panel action-panel"><div className="panel-heading"><div><p className="eyebrow">NEXT BEST ACTION</p><h2>Review your crop plan</h2></div><span className="sparkle">✦</span></div><p className="action-copy">Market prices have shifted this week. A quick review could improve your expected return.</p><div className="action-row"><div className="action-icon">↗</div><div><strong>Plan confidence is high</strong><p>Based on 7 data signals</p></div><span className="arrow">→</span></div><button className="outline-button" onClick={() => setShowSetup(true)}>Review crop plan</button><div className="divider" /><div className="small-heading"><span>◷</span> Upcoming</div><div className="task"><span>☁</span><div><strong>Rain expected tomorrow</strong><p>Consider delaying irrigation</p></div><time>Tomorrow</time></div><div className="task"><span>▥</span><div><strong>Wheat • Growth stage</strong><p>Apply top dressing</p></div><time>In 3 days</time></div></article>
          </section>

          <section className="bottom-grid"><article className="panel crop-panel"><div className="panel-heading"><div><p className="eyebrow">RECOMMENDED FOR YOU</p><h2>Best crops for your farm</h2></div><button className="text-button" onClick={() => setActiveNav("Crop plan")}>See full analysis ↗</button></div><p className="panel-description">Scored for your soil, weather, market demand and risk preference.</p><div className="crop-list">{crops.map((crop, index) => <div className="crop-row" key={crop.name}><div className={`crop-icon ${crop.color}`}>{crop.icon}</div><div className="crop-name"><strong>{crop.name}</strong><span>{index === 0 ? "Best match" : "Strong alternative"}</span></div><div className="score"><small>Score</small><strong>{crop.score}</strong><span>/100</span></div><div className="profit"><small>Est. profit</small><strong>{formatMoney(Math.round(crop.profit * area / 10))}</strong></div><span className={`risk ${crop.risk.includes("Medium") ? "medium" : ""}`}>{crop.risk}</span><button className="row-arrow" onClick={() => setNotice(`${crop.name} selected for closer analysis.`)}>→</button></div>)}</div></article><article className="panel insights-panel"><div className="panel-heading"><div><p className="eyebrow">MARKET PULSE</p><h2>What&apos;s moving</h2></div><span className="live"><i /> Live</span></div><div className="market-item"><div className="market-icon gold">🌾</div><div><strong>Wheat</strong><span>Nasik Mandi</span></div><b>₹2,425 <small>↗ 4.8%</small></b></div><div className="market-item"><div className="market-icon coral">🌼</div><div><strong>Mustard</strong><span>Lasalgaon Mandi</span></div><b>₹5,980 <small>↗ 2.1%</small></b></div><div className="market-item"><div className="market-icon green">🌽</div><div><strong>Maize</strong><span>Malegaon Mandi</span></div><b>₹2,180 <small className="down">↘ 0.6%</small></b></div><button className="outline-button wide" onClick={() => setActiveNav("Market watch")}>Open market watch →</button></article></section>
          <footer className="disclaimer">Figures shown are estimates based on available data and assumptions. They are not guarantees. <a href="#methodology">How we calculate ↗</a></footer>
        </div>
      </section>

      {showSetup && <div className="modal-backdrop" role="presentation" onClick={() => setShowSetup(false)}><section className="setup-modal setup-modal-wide" role="dialog" aria-modal="true" aria-labelledby="setup-title" onClick={(event) => event.stopPropagation()}><button className="close-button" aria-label="Close" onClick={() => setShowSetup(false)}>×</button><p className="eyebrow">FARM SETUP</p><h2 id="setup-title">Select your farm on the map</h2><p>Search for your village or use your location, then draw around the field. You can edit the points before analyzing.</p><FarmMapPicker onAreaChange={setArea} /><label>Farm area <output>{area.toFixed(2)} acres</output><input type="range" min="1" max="40" step="0.5" value={area} onChange={(event) => setArea(Number(event.target.value))} /></label><label>Risk preference<select value={risk} onChange={(event) => setRisk(event.target.value)}><option>Conservative</option><option>Balanced</option><option>Growth focused</option></select></label><button className="primary-button full" onClick={runAnalysis}>Analyze my farm →</button></section></div>}
    </main>
  );
}
