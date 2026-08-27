import Link from "next/link";
import AppShell from "./components/AppShell";

export default function Home() {
  return <AppShell pageTitle="Overview">
    <section className="page-wrap dashboard-page">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">FARM WORKSPACE</p>
          <h1>Your farm workspace</h1>
          <p className="subhead">Set up a farm to connect your land data to future recommendations.</p>
        </div>
        <Link className="primary-button" href="/farms/new">+ Add a farm</Link>
      </div>
      <section className="stats-grid" aria-label="Farm summary">
        <article className="stat-card accent"><div className="stat-icon">▦</div><p>Total farm area</p><strong>-- <small>acres</small></strong><span className="stat-link">No farm connected</span></article>
        <article className="stat-card"><div className="stat-icon dark">◒</div><p>Estimated profit</p><strong>--</strong><span className="stat-link">Needs a recommendation</span></article>
        <article className="stat-card"><div className="stat-icon pale">⌁</div><p>Farm health</p><strong>--</strong><span className="stat-link">Needs farm data</span></article>
        <article className="stat-card"><div className="stat-icon coral-bg">☼</div><p>Weather outlook</p><strong>--</strong><span className="stat-link">Needs a farm location</span></article>
      </section>
      <section className="empty-dashboard panel" aria-labelledby="dashboard-state-title">
        <div className="empty-icon">+</div>
        <p className="eyebrow">FIRST STEP</p>
        <h2 id="dashboard-state-title">Add your farm to get started</h2>
        <p>Map a boundary and save it. Recommendations, plans, weather, and market data will appear here once their services are connected.</p>
        <Link className="primary-button" href="/farms/new">Open farm setup</Link>
      </section>
      <p className="disclaimer">No recommendations or live data are available yet. The dashboard will label estimates, sources, and freshness when those services are connected.</p>
    </section>
  </AppShell>;
}
