"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "../../../components/AppShell";
import FarmMapPicker from "../../../components/FarmMapPicker";
import type { FarmRecord } from "../../../api/farms/repository";

type EditPageProps = {
  params: Promise<{ id: string }>;
};

export default function EditFarmPage({ params }: EditPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [farm, setFarm] = useState<FarmRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/farms/${id}`);
        if (!res.ok) {
          setError("Farm record not found.");
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (data.success && data.farm) {
          setFarm(data.farm);
        } else {
          setError("Could not load farm details.");
        }
      } catch {
        setError("Network error while loading farm.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this farm boundary? This action cannot be undone.")) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/farms/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/farms");
        router.refresh();
      } else {
        alert("Failed to delete farm.");
      }
    } catch {
      alert("Network error while deleting farm.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell pageTitle="Edit farm">
      <section className="page-wrap feature-page">
        <header className="feature-header flex justify-between items-start flex-wrap gap-4 mb-4">
          <div>
            <p className="eyebrow">EDIT PLOT BOUNDARY</p>
            <h1>{farm ? `Edit ${farm.name}` : "Edit Farm Boundary"}</h1>
            <p className="subhead">Adjust boundary vertices, update crop subdivisions, or remove this plot.</p>
          </div>
          <div className="flex gap-2">
            <Link className="text-button text-xs" href="/farms">
              ← Back to My Farms
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs px-3 py-1.5 rounded font-semibold transition cursor-pointer"
            >
              {deleting ? "Deleting..." : "Delete Farm"}
            </button>
          </div>
        </header>

        {loading && <div className="panel text-center py-8 text-gray-500">Loading farm boundary...</div>}

        {error && (
          <div className="panel text-center py-8 text-rose-600">
            <p className="font-semibold">{error}</p>
            <Link className="primary-button text-xs mt-3 inline-block" href="/farms">
              Return to My Farms
            </Link>
          </div>
        )}

        {!loading && farm && (
          <section className="setup-panel panel">
            <FarmMapPicker
              initialFarm={farm}
              onAreaChange={() => {}}
              onSaved={() => {
                router.push("/farms");
                router.refresh();
              }}
            />
          </section>
        )}
      </section>
    </AppShell>
  );
}

