/// <reference types="google.maps" />
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import type { FarmRecord } from "../api/farms/repository";
import { resolveDistrictFromCoords, DISTRICT_MASTER } from "@/lib/geo-service";

export type FarmSelection = {
  center: { lat: number; lng: number };
  boundary: { lat: number; lng: number }[];
};

type LandSection = {
  crop: string;
  area: number;
};

type FarmMapPickerProps = {
  onAreaChange: (areaAcres: number) => void;
  onSelectionChange?: (selection: FarmSelection) => void;
  initialFarm?: FarmRecord;
  onSaved?: (savedFarm: FarmRecord) => void;
};

type DrawingManagerRuntime = {
  setMap: (map: google.maps.Map | null) => void;
  setDrawingMode: (mode: google.maps.drawing.OverlayType | null) => void;
};

const defaultCenter = { lat: 20.5937, lng: 78.9629 }; // India geographic center (auto-centered by GPS or search)
let configuredApiKey = "";


export default function FarmMapPicker({
  onAreaChange,
  onSelectionChange,
  initialFarm,
  onSaved,
}: FarmMapPickerProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const searchElement = useRef<HTMLInputElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const draftPathRef = useRef<google.maps.LatLng[]>([]);
  const draftPolylineRef = useRef<google.maps.Polyline | null>(null);
  const finishDrawingRef = useRef<() => void>(() => undefined);
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);

  const [farmName, setFarmName] = useState(initialFarm?.name || "Main Field Plot");
  const [status, setStatus] = useState("Click '📍 Use My Location' or search your area, then click corners to draw your field boundary.");
  const [, setMapsLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [useFallbackMode, setUseFallbackMode] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const [measuredAreaAcres, setMeasuredAreaAcres] = useState(initialFarm?.areaAcres || 0);
  const [sections, setSections] = useState<LandSection[]>(
    initialFarm?.sections && initialFarm.sections.length > 0
      ? initialFarm.sections
      : [{ crop: "Wheat", area: initialFarm ? Number((initialFarm.areaAcres * 0.6).toFixed(2)) : 0 }]
  );
  const [water, setWater] = useState(initialFarm?.preferences?.water || "Medium");
  const [risk, setRisk] = useState(initialFarm?.preferences?.risk || "Balanced");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fallback map state
  const [fallbackPoints, setFallbackPoints] = useState<{ x: number; y: number }[]>([]);
  const [fallbackCentroid, setFallbackCentroid] = useState<{ lat: number; lng: number }>(
    initialFarm?.center || defaultCenter
  );

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const handleAreaUpdate = useCallback(
    (acres: number, points: { lat: number; lng: number }[], centerPoint?: { lat: number; lng: number }) => {
      const roundedAcres = Number(acres.toFixed(2));
      setMeasuredAreaAcres(roundedAcres);
      onAreaChange(roundedAcres);

      const center = centerPoint || points[0] || defaultCenter;
      const selection: FarmSelection = { center, boundary: points };
      onSelectionChange?.(selection);
    },
    [onAreaChange, onSelectionChange]
  );

  function setMarker(location: google.maps.LatLng) {
    markerRef.current?.setMap(null);
    markerRef.current = new google.maps.Marker({
      map: mapRef.current,
      position: location,
      title: "Farm Centroid",
      draggable: true,
    });
    markerRef.current.addListener("dragend", () => {
      const pos = markerRef.current?.getPosition();
      if (pos) {
        const points = polygonRef.current?.getPath().getArray().map((p) => p.toJSON()) || [];
        handleAreaUpdate(measuredAreaAcres, points, pos.toJSON());
      }
    });
  }

  function updateGoogleMapArea(polygon: google.maps.Polygon) {
    const sqMeters = google.maps.geometry.spherical.computeArea(polygon.getPath());
    // 1 Acre = 4046.8564224 sq meters
    const acres = Math.max(0.05, sqMeters / 4046.8564224);
    const points = polygon.getPath().getArray().map((p) => p.toJSON());
    const center = markerRef.current?.getPosition()?.toJSON() || points[0] || defaultCenter;
    handleAreaUpdate(acres, points, center);
    const ha = (acres / 2.47105).toFixed(2);
    const sqM = Math.round(sqMeters).toLocaleString();
    setStatus(`✓ Enclosed Boundary: ${acres.toFixed(2)} acres (${ha} ha / ${sqM} m²). Drag corner points to adjust.`);
  }

  // "Use My Location" Geolocation Handler
  const handleUseMyLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setDetectingLocation(true);
    setStatus("📍 Accessing device GPS to locate your farm...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDetectingLocation(false);
        const { latitude, longitude } = position.coords;
        const districtInfo = resolveDistrictFromCoords(latitude, longitude);

        setStatus(
          `📍 Location Detected: ${districtInfo.district}, ${districtInfo.state} (${districtInfo.agroClimaticZone}) [${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E]`
        );
        setFarmName(`${districtInfo.district} Farm Plot`);

        if (mapRef.current) {
          const pos = new google.maps.LatLng(latitude, longitude);
          mapRef.current.setCenter(pos);
          mapRef.current.setZoom(16);
          setMarker(pos);
        } else {
          setFallbackCentroid({ lat: latitude, lng: longitude });
        }
      },
      (err) => {
        setDetectingLocation(false);
        console.warn("[Geolocation Warning]", err);
        setStatus("Could not access GPS. Please use the search bar to locate your district.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [handleAreaUpdate, measuredAreaAcres]);

  // Google Maps Initialization
  useEffect(() => {
    if (!mapElement.current || !apiKey || useFallbackMode) return;

    if (configuredApiKey !== apiKey) {
      setOptions({ key: apiKey, v: "weekly" });
      configuredApiKey = apiKey;
    }

    let drawingManager: DrawingManagerRuntime | undefined;

    Promise.all([
      importLibrary("maps"),
      importLibrary("drawing"),
      importLibrary("geometry"),
      importLibrary("places"),
    ])
      .then(([mapsLibrary]) => {
        if (!mapElement.current) return;
        const { Map } = mapsLibrary as google.maps.MapsLibrary;
        const center = initialFarm?.center || defaultCenter;

        const map = new Map(mapElement.current, {
          center,
          zoom: initialFarm ? 16 : 14,
          mapTypeId: "satellite",
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: false,
        });
        mapRef.current = map;

        // Render initial polygon if editing
        if (initialFarm && initialFarm.boundary && initialFarm.boundary.length >= 3) {
          const path = initialFarm.boundary.map((p) => new google.maps.LatLng(p.lat, p.lng));
          const existingPolygon = new google.maps.Polygon({
            paths: path,
            map,
            editable: true,
            fillColor: "#10b981",
            fillOpacity: 0.4,
            strokeColor: "#047857",
            strokeWeight: 3,
          });
          polygonRef.current = existingPolygon;
          google.maps.event.addListener(existingPolygon.getPath(), "set_at", () => updateGoogleMapArea(existingPolygon));
          google.maps.event.addListener(existingPolygon.getPath(), "insert_at", () => updateGoogleMapArea(existingPolygon));
        }

        map.addListener("click", (event: google.maps.MapMouseEvent) => {
          if (!event.latLng) return;
          if (draftPathRef.current.length > 0) {
            draftPathRef.current.push(event.latLng);
            draftPolylineRef.current?.setPath(draftPathRef.current);
            setStatus(`${draftPathRef.current.length} boundary points placed. Click '✓ Finish Boundary' when done.`);
            return;
          }

          setMarker(event.latLng);
          polygonRef.current?.setMap(null);
          draftPathRef.current = [event.latLng];
          draftPolylineRef.current?.setMap(null);
          draftPolylineRef.current = new google.maps.Polyline({
            map: mapRef.current,
            strokeColor: "#047857",
            strokeWeight: 3,
            path: draftPathRef.current,
          });
          setStatus("First corner marked. Click consecutive field corners around your plot boundary.");
        });

        finishDrawingRef.current = () => {
          if (draftPathRef.current.length < 3) {
            setStatus("Please place at least 3 points to enclose your field boundary.");
            return;
          }
          draftPolylineRef.current?.setMap(null);
          const polygon = new google.maps.Polygon({
            paths: draftPathRef.current,
            map,
            editable: true,
            fillColor: "#10b981",
            fillOpacity: 0.4,
            strokeColor: "#047857",
            strokeWeight: 3,
          });
          polygonRef.current?.setMap(null);
          polygonRef.current = polygon;
          draftPathRef.current = [];
          updateGoogleMapArea(polygon);
          google.maps.event.addListener(polygon.getPath(), "set_at", () => updateGoogleMapArea(polygon));
          google.maps.event.addListener(polygon.getPath(), "insert_at", () => updateGoogleMapArea(polygon));
        };

        if (searchElement.current) {
          const SearchBox = google.maps.places.SearchBox as unknown as new (input: HTMLInputElement) => google.maps.places.SearchBox;
          searchBoxRef.current = new SearchBox(searchElement.current);
          searchBoxRef.current.addListener("places_changed", () => {
            const place = searchBoxRef.current?.getPlaces()?.[0];
            if (place?.geometry?.location) {
              map.setCenter(place.geometry.location);
              map.setZoom(16);
              setMarker(place.geometry.location);
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              const dInfo = resolveDistrictFromCoords(lat, lng);
              setStatus(`Location found: ${place.name || dInfo.district} (${dInfo.state})`);
              setFarmName(`${place.name || dInfo.district} Plot`);
            }
          });
        }

        setMapsLoaded(true);
      })
      .catch(() => {
        setMapError(true);
        setUseFallbackMode(true);
        setStatus("Google Maps key restricted or unavailable. Switched to Interactive Vector Farm Planner.");
      });

    return () => {
      drawingManager?.setMap(null);
      polygonRef.current?.setMap(null);
      draftPolylineRef.current?.setMap(null);
      finishDrawingRef.current = () => undefined;
    };
  }, [apiKey, handleAreaUpdate, initialFarm, measuredAreaAcres, useFallbackMode]);

  // Fallback Canvas Map Click Handler
  function handleFallbackCanvasClick(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newPoints = [...fallbackPoints, { x, y }];
    setFallbackPoints(newPoints);

    if (newPoints.length >= 3) {
      let areaPx = 0;
      for (let i = 0; i < newPoints.length; i++) {
        const j = (i + 1) % newPoints.length;
        areaPx += newPoints[i].x * newPoints[j].y;
        areaPx -= newPoints[j].x * newPoints[i].y;
      }
      areaPx = Math.abs(areaPx) / 2;
      const acres = Math.max(0.1, areaPx / 800);

      const geoPoints = newPoints.map((p) => ({
        lat: Number((fallbackCentroid.lat + (p.y - 175) * 0.0001).toFixed(6)),
        lng: Number((fallbackCentroid.lng + (p.x - 250) * 0.0001).toFixed(6)),
      }));

      handleAreaUpdate(acres, geoPoints, fallbackCentroid);
      const ha = (acres / 2.47105).toFixed(2);
      const sqM = Math.round(acres * 4046.8564).toLocaleString();
      setStatus(`✓ Boundary Plotted: ${acres.toFixed(2)} acres (${ha} ha / ${sqM} m²).`);
    } else {
      setStatus(`Point ${newPoints.length} placed. Place at least 3 points to enclose your field.`);
    }
  }

  function resetFallbackPoints() {
    setFallbackPoints([]);
    setMeasuredAreaAcres(0);
    onAreaChange(0);
    setStatus("Canvas reset. Tap corners on the grid to plot your field boundary.");
  }

  async function handleSaveFarm() {
    setSaving(true);
    setSaveMessage(null);

    if (measuredAreaAcres <= 0) {
      setSaveMessage({ type: "error", text: "Please draw or enclose a field boundary on the map first." });
      setSaving(false);
      return;
    }

    let boundaryPoints: { lat: number; lng: number }[] = [];
    let center = defaultCenter;

    if (polygonRef.current) {
      boundaryPoints = polygonRef.current.getPath().getArray().map((p) => p.toJSON());
      center = markerRef.current?.getPosition()?.toJSON() || boundaryPoints[0] || defaultCenter;
    } else if (fallbackPoints.length >= 3) {
      boundaryPoints = fallbackPoints.map((p) => ({
        lat: Number((fallbackCentroid.lat + (p.y - 175) * 0.0001).toFixed(6)),
        lng: Number((fallbackCentroid.lng + (p.x - 250) * 0.0001).toFixed(6)),
      }));
      center = fallbackCentroid;
    } else if (initialFarm) {
      boundaryPoints = initialFarm.boundary;
      center = initialFarm.center;
    }

    const payload = {
      name: farmName.trim() || "My Farm Plot",
      areaAcres: measuredAreaAcres,
      center,
      boundary: boundaryPoints,
      sections,
      preferences: { water, risk },
    };

    try {
      const url = initialFarm ? `/api/farms/${initialFarm.id}` : "/api/farms";
      const method = initialFarm ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSaveMessage({ type: "success", text: "Farm boundary & actual area saved successfully!" });
        onSaved?.(data.farm);
      } else {
        setSaveMessage({ type: "error", text: data?.error?.message || "Failed to save farm boundary." });
      }
    } catch {
      setSaveMessage({ type: "error", text: "Network error while saving farm boundary." });
    } finally {
      setSaving(false);
    }
  }

  function updateSection(index: number, field: keyof LandSection, value: string) {
    setSections((current) =>
      current.map((s, i) => (i === index ? { ...s, [field]: field === "area" ? Number(value) : value } : s))
    );
  }

  const measuredHectares = (measuredAreaAcres / 2.47105).toFixed(2);
  const measuredSqMeters = Math.round(measuredAreaAcres * 4046.8564224).toLocaleString();

  return (
    <div className="picker-wrap space-y-5">
      {/* Top Header & Geospatial Measurement Banner */}
      <div className="flex gap-4 items-center justify-between flex-wrap p-4 rounded-2xl bg-[var(--bg-surface-accent)] border border-[var(--border-accent)]">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <label htmlFor="farm-name-input" className="text-xs font-bold text-[var(--color-primary-text)] uppercase tracking-wider shrink-0 font-['Space_Grotesk']">
            Plot Name:
          </label>
          <input
            id="farm-name-input"
            type="text"
            value={farmName}
            onChange={(e) => setFarmName(e.target.value)}
            placeholder="e.g. North Canal Field"
            className="agri-input font-bold max-w-sm"
          />
        </div>

        {/* Real-Time Live Area Display in Acres, Hectares & Sq Meters */}
        <div className="flex items-center gap-4 bg-[var(--bg-surface)] px-4 py-2 rounded-xl border border-[var(--border-strong)] shadow-card">
          <div className="text-right">
            <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold block tracking-wider">
              Geodesic Computed Area
            </span>
            <div className="flex items-center gap-2">
              <strong className="text-base font-bold font-['Space_Grotesk'] text-[var(--color-primary)]">
                {measuredAreaAcres.toFixed(2)} Acres
              </strong>
              <span className="text-[var(--border-strong)]">·</span>
              <span className="font-semibold text-xs text-[var(--text-secondary)]">{measuredHectares} ha</span>
              <span className="text-[var(--border-strong)]">·</span>
              <span className="text-[var(--text-muted)] font-mono text-xs">{measuredSqMeters} m²</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map Toolbar with "Use My Location" & Search */}
      <div className="picker-toolbar flex gap-3 flex-wrap items-center justify-between">
        <div className="flex gap-2.5 items-center flex-1 min-w-[280px]">
          {/* Prominent "Use My Location" Button */}
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={detectingLocation}
            className="agri-btn-primary shrink-0"
            title="Detect GPS coordinates and center map"
          >
            <span>📍</span>
            <span>{detectingLocation ? "Detecting GPS..." : "Use My Location"}</span>
          </button>

          {!useFallbackMode && apiKey ? (
            <input
              ref={searchElement}
              aria-label="Search farm location"
              placeholder="Search village, mandi, district or landmark..."
              className="agri-input flex-1"
            />
          ) : (
            <select
              value={`${fallbackCentroid.lat},${fallbackCentroid.lng}`}
              onChange={(e) => {
                const [lat, lng] = e.target.value.split(",").map(Number);
                setFallbackCentroid({ lat, lng });
                const dInfo = resolveDistrictFromCoords(lat, lng);
                setFarmName(`${dInfo.district} Farm Plot`);
              }}
              className="agri-select flex-1"
            >
              {DISTRICT_MASTER.map((d) => (
                <option key={d.districtId} value={`${d.lat},${d.lng}`}>
                  {d.district}, {d.state} ({d.zone})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex gap-2 items-center">
          {!useFallbackMode && apiKey && (
            <button
              type="button"
              onClick={() => finishDrawingRef.current()}
              className="agri-btn-primary"
            >
              ✓ Complete Boundary
            </button>
          )}
          {useFallbackMode && (
            <button
              type="button"
              onClick={resetFallbackPoints}
              className="agri-btn-secondary"
            >
              Reset Points
            </button>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="text-xs text-[var(--color-primary-text)] bg-[var(--color-primary-light)] px-3.5 py-2 rounded-xl border border-[var(--border-accent)] font-medium flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
        <span>{status}</span>
      </div>

      {/* Map Display (Google Satellite Maps OR Vector Canvas Fallback) */}
      {!useFallbackMode && apiKey && !mapError ? (
        <div
          ref={mapElement}
          className="real-map min-h-[460px] w-full rounded-2xl border border-[var(--border-default)] shadow-card overflow-hidden"
          aria-label="Google Map for selecting farm boundary"
        />
      ) : (
        <div className="fallback-map-container bg-slate-950 rounded-2xl p-4 border border-[var(--border-default)] relative overflow-hidden shadow-card">
          <div className="text-xs text-emerald-400 font-mono mb-3 flex justify-between">
            <span>GRID CENTROID: {fallbackCentroid.lat.toFixed(4)}°N, {fallbackCentroid.lng.toFixed(4)}°E</span>
            <span>CLICK CORNERS TO ENCLOSE POLYGON</span>
          </div>

          <svg
            className="w-full h-[380px] bg-slate-900/90 rounded-xl border border-slate-800 cursor-crosshair"
            onClick={handleFallbackCanvasClick}
          >
            <defs>
              <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
                <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#1e293b" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {fallbackPoints.length >= 3 && (
              <polygon
                points={fallbackPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="#10b981"
                fillOpacity="0.4"
                stroke="#059669"
                strokeWidth="3"
              />
            )}

            {fallbackPoints.map((p, idx) => (
              <circle key={idx} cx={p.x} cy={p.y} r="6" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
            ))}
          </svg>
        </div>
      )}

      {/* Agronomic Preferences & Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="agri-card p-4 space-y-1.5">
          <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block font-['Space_Grotesk']">
            Water Source Access:
          </label>
          <select
            value={water}
            onChange={(e) => setWater(e.target.value)}
            className="agri-select"
          >
            <option value="Low">Low (Rainfed / Limited Tanker)</option>
            <option value="Medium">Medium (Canal / Shared Tube Well)</option>
            <option value="High">High (Dedicated Borewell / Drip)</option>
          </select>
        </div>

        <div className="agri-card p-4 space-y-1.5">
          <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block font-['Space_Grotesk']">
            Risk Appetite:
          </label>
          <select
            value={risk}
            onChange={(e) => setRisk(e.target.value)}
            className="agri-select"
          >
            <option value="Conservative">Conservative (MSP Floor Focus)</option>
            <option value="Balanced">Balanced (Optimal Multi-Crop Split)</option>
            <option value="Growth">Growth (High-Margin Cash Crops)</option>
          </select>
        </div>

        <div className="agri-card p-4 space-y-1.5">
          <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block font-['Space_Grotesk']">
            Primary Crop Section:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={sections[0]?.crop || "Wheat"}
              onChange={(e) => updateSection(0, "crop", e.target.value)}
              className="agri-input w-1/2"
              placeholder="Crop Name"
            />
            <input
              type="number"
              value={sections[0]?.area || measuredAreaAcres}
              onChange={(e) => updateSection(0, "area", e.target.value)}
              className="agri-input w-1/2"
              placeholder="Acres"
            />
          </div>
        </div>
      </div>

      {/* Save Notification */}
      {saveMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-bold ${
            saveMessage.type === "success"
              ? "agri-badge-emerald border"
              : "agri-badge-rose border"
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleSaveFarm}
          disabled={saving || measuredAreaAcres <= 0}
          className="agri-btn-primary py-3 px-8 text-sm"
        >
          {saving ? "Saving Field Boundary to PostGIS..." : "Save Farm Boundary & Optimize Plan →"}
        </button>
      </div>
    </div>
  );
}
