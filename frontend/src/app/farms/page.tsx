"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "../components/AppShell";
import type { FarmRecord } from "../api/farms/repository";

export default function FarmsPage() {
  const [farms, setFarms] = useState<FarmRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadFarms() {
      try {
        const res = await fetch("/api/farms");
        if (res.ok && isMounted) {
          const json = await res.json();
          setFarms(json.farms || []);
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadFarms();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleDeleteFarm(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/farms/${id}`, { method: "DELETE" });
      if (res.ok) {
        setFarms((prev) => prev.filter((f) => f.id !== id));
      } else {
        alert("Failed to delete farm.");
      }
    } catch {
      alert("Network error while deleting farm.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppShell pageTitle="My farms">
      <section className="page-wrap feature-page">
        <header className="feature-header flex justify-between items-start flex-wrap gap-4 mb-4">
          <div>
            <p className="eyebrow">SAVED PLOTS</p>
            <h1>My Farm Boundaries</h1>
            <p className="subhead">Manage georeferenced land plots, boundaries, sections, and water/soil preferences.</p>
          </div>
          <Link className="primary-button" href="/farms/new">
            + Add New Farm
          </Link>
        </header>

        {loading && <div className="panel text-center py-8 text-gray-500">Loading your farms...</div>}

        {!loading && farms.length === 0 && (
          <section className="panel text-center py-10">
            <div className="empty-icon text-3xl text-emerald-600 mb-2">▧</div>
            <h2 className="text-lg font-bold text-gray-900">No farms registered yet</h2>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-4">
              Map your field boundary on Google Maps to generate tailored multi-crop recommendations and 90-day climate forecasts.
            </p>
            <Link className="primary-button inline-block" href="/farms/new">
              Open Farm Boundary Tool
            </Link>
          </section>
        )}

        {!loading && farms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {farms.map((farm) => {
              const hectares = (farm.areaAcres / 2.47105).toFixed(2);
              return (
                <article key={farm.id} className="panel flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-base font-bold text-gray-900">{farm.name}</h2>
                        <p className="text-xs text-gray-500">
                          Centroid: {farm.center.lat.toFixed(4)}°N, {farm.center.lng.toFixed(4)}°E
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 block">
                          {farm.areaAcres.toFixed(2)} acres
                        </span>
                        <span className="text-[10px] text-gray-500 block mt-0.5">({hectares} ha)</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase">Water Source</span>
                        <strong className="text-gray-800 font-semibold">{farm.preferences?.water || "Medium"}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase">Risk Appetite</span>
                        <strong className="text-gray-800 font-semibold">{farm.preferences?.risk || "Balanced"}</strong>
                      </div>
                    </div>

                    {farm.sections && farm.sections.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <span className="text-[10px] uppercase text-gray-400 block font-semibold mb-1">Crop Sections</span>
                        <div className="flex gap-1.5 flex-wrap">
                          {farm.sections.map((sec, idx) => (
                            <span key={idx} className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                              {sec.crop}: {sec.area} ac ({(sec.area / 2.47105).toFixed(2)} ha)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t flex gap-2 items-center flex-wrap">
                    <Link
                      className="primary-button text-xs py-1.5 px-3 flex-1 text-center"
                      href="/recommendations"
                    >
                      Generate Plan
                    </Link>
                    <Link
                      className="text-button text-xs py-1.5 px-3"
                      href={`/farms/${farm.id}/edit`}
                    >
                      Edit Boundary
                    </Link>
                    <button
                      type="button"
                      disabled={deletingId === farm.id}
                      onClick={() => handleDeleteFarm(farm.id, farm.name)}
                      className="text-xs text-rose-600 hover:text-rose-800 py-1.5 px-2 hover:bg-rose-50 rounded transition font-medium cursor-pointer"
                    >
                      {deletingId === farm.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}