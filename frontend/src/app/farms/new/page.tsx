"use client";

import { useState } from "react";
import AppShell from "../../components/AppShell";
import FarmMapPicker from "../../components/FarmMapPicker";

export default function NewFarmPage() {
  const [area, setArea] = useState(0);
  return <AppShell pageTitle="Farm setup"><section className="page-wrap feature-page"><div className="feature-header"><p className="eyebrow">FARM SETUP</p><h1>Map your farm</h1><p className="subhead">Choose a location and draw the boundary. Saving requires a configured database or development storage.</p></div><section className="setup-panel panel"><FarmMapPicker onAreaChange={setArea} /><div className="setup-summary"><strong>Measured area</strong><output>{area.toFixed(2)} acres</output></div></section></section></AppShell>;
}