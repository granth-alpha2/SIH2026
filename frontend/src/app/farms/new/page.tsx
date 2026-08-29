"use client";

import { useRouter } from "next/navigation";
import AppShell from "../../components/AppShell";
import FarmMapPicker from "../../components/FarmMapPicker";

export default function NewFarmPage() {
  const router = useRouter();

  return (
    <AppShell pageTitle="Farm setup">
      <section className="page-wrap feature-page">
        <header className="feature-header mb-4">
          <p className="eyebrow">GEOSPATIAL BOUNDARY SETUP</p>
          <h1>Map Your Farm Plot</h1>
          <p className="subhead">
            Drop a pin or click corners to draw your field boundary. Area is automatically computed in acres and hectares.
          </p>
        </header>

        <section className="setup-panel panel">
          <FarmMapPicker
            onAreaChange={() => {}}
            onSaved={() => {
              router.push("/farms");
              router.refresh();
            }}
          />
        </section>
      </section>
    </AppShell>
  );
}