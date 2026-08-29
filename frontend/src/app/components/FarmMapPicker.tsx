/// <reference types="google.maps" />
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import type { FarmRecord } from "../api/farms/repository";

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

const defaultCenter = { lat: 30.2110, lng: 74.9455 }; // Bathinda, Punjab
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
  const [status, setStatus] = useState("Click 'Draw field boundary' or tap on the map to place boundary points.");
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [useFallbackMode, setUseFallbackMode] = useState(false);

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

  // Fallback map state (points in pixel coordinates on 500x350 canvas)
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
            setStatus(`${draftPathRef.current.length} boundary points added. Click 'Finish Boundary' when complete.`);
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
          setStatus("First point placed. Continue clicking corners around your field boundary.");
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
              setStatus(`Location found: ${place.name || "Selected region"}`);
            }
          });
        }

        setMapsLoaded(true);
      })
      .catch(() => {
        setMapError(true);
        setUseFallbackMode(true);
        setStatus("Google Maps key unavailable or restricted. Switched to Standalone Visual Farm Planner.");
      });

    function setMarker(location: google.maps.LatLng) {
      markerRef.current?.setMap(null);
      markerRef.current = new google.maps.Marker({
        map: mapRef.current,
        position: location,
        title: "Farm Center",
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
      const acres = Math.max(0.05, sqMeters / 4046.8564224);
      const points = polygon.getPath().getArray().map((p) => p.toJSON());
      const center = markerRef.current?.getPosition()?.toJSON() || points[0] || defaultCenter;
      handleAreaUpdate(acres, points, center);
      setStatus(`Enclosed boundary: ${acres.toFixed(2)} acres (${(acres / 2.47105).toFixed(2)} ha). Drag vertices to fine-tune.`);
    }

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
      // Shoelace area formula for 2D polygon in pixel space scaled to realistic acres
      let areaPx = 0;
      for (let i = 0; i < newPoints.length; i++) {
        const j = (i + 1) % newPoints.length;
        areaPx += newPoints[i].x * newPoints[j].y;
        areaPx -= newPoints[j].x * newPoints[i].y;
      }
      areaPx = Math.abs(areaPx) / 2;
      // 10,000 px^2 ≈ 1.25 acres scaling
      const acres = Math.max(0.1, (areaPx / 8000));
      
      // Map pixels to coordinates offset from centroid
      const geoPoints = newPoints.map((p) => ({
        lat: Number((fallbackCentroid.lat + (p.y - 175) * 0.0001).toFixed(6)),
        lng: Number((fallbackCentroid.lng + (p.x - 250) * 0.0001).toFixed(6)),
      }));

      handleAreaUpdate(acres, geoPoints, fallbackCentroid);
      setStatus(`Boundary plotted: ${acres.toFixed(2)} acres (${(acres / 2.47105).toFixed(2)} hectares).`);
    } else {
      setStatus(`Point ${newPoints.length} placed. Place at least 3 points to enclose your field.`);
    }
  }

  function resetFallbackPoints() {
    setFallbackPoints([]);
    setMeasuredAreaAcres(0);
    onAreaChange(0);
    setStatus("Canvas reset. Tap to plot boundary vertices.");
  }

  async function handleSaveFarm() {
    setSaving(true);
    setSaveMessage(null);

    const allocated = sections.reduce((sum, s) => sum + s.area, 0);
    if (measuredAreaAcres <= 0) {
      setSaveMessage({ type: "error", text: "Please draw or enclose a boundary on the map first." });
      setSaving(false);
      return;
    }

    if (allocated > measuredAreaAcres * 1.05) {
      setSaveMessage({
        type: "error",
        text: `Allocated sections (${allocated.toFixed(2)} ac) exceed measured farm area (${measuredAreaAcres.toFixed(2)} ac).`,
      });
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
        setSaveMessage({ type: "success", text: "Farm boundary & land sections saved successfully!" });
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

  return (
    <div className="picker-wrap space-y-4">
      {/* Farm Name Bar */}
      <div className="flex gap-3 items-center flex-wrap">
        <label htmlFor="farm-name-input" className="text-xs font-semibold text-gray-700 uppercase">Farm Name:</label>
        <input
          id="farm-name-input"
          type="text"
          value={farmName}
          onChange={(e) => setFarmName(e.target.value)}
          placeholder="e.g. North Canal Plot"
          className="p-2 border rounded text-xs flex-1 max-w-sm bg-white font-medium"
        />
        <div className="ml-auto flex items-center gap-2 text-xs">
          <span className="font-semibold text-emerald-800">
            {measuredAreaAcres.toFixed(2)} Acres
          </span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-600 font-medium">
            {measuredHectares} Hectares
          </span>
        </div>
      </div>

      {/* Map Toolbar */}
      <div className="picker-toolbar flex gap-2 flex-wrap items-center">
        {!useFallbackMode && apiKey ? (
          <>
            <input
              ref={searchElement}
              aria-label="Search farm location"
              placeholder="Search district, village or landmark..."
              className="flex-1 min-w-[200px] p-2 border rounded text-xs"
            />
            <button
              type="button"
              onClick={() => finishDrawingRef.current()}
              className="primary-button text-xs py-1.5 px-3"
            >
              ✓ Finish Boundary
            </button>
          </>
        ) : (
          <div className="flex justify-between items-center w-full gap-2 flex-wrap">
            <span className="text-xs text-gray-600 font-medium">
              Interactive Vector Farm Planner (Offline/Dev Mode)
            </span>
            <div className="flex gap-2">
              <select
                value={`${fallbackCentroid.lat},${fallbackCentroid.lng}`}
                onChange={(e) => {
                  const [lat, lng] = e.target.value.split(",").map(Number);
                  setFallbackCentroid({ lat, lng });
                }}
                className="p-1.5 border rounded text-xs bg-white"
              >
                <option value="30.2110,74.9455">Bathinda, Punjab</option>
                <option value="29.6857,76.9905">Karnal, Haryana</option>
                <option value="25.3176,82.9739">Varanasi, UP</option>
                <option value="19.9975,73.7898">Nashik, Maharashtra</option>
              </select>
              <button
                type="button"
                onClick={resetFallbackPoints}
                className="text-button text-xs py-1 px-2.5"
              >
                Reset Boundary
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Map Display (Google Maps OR Vector Canvas Fallback) */}
      {!useFallbackMode && apiKey && !mapError ? (
        <div
          ref={mapElement}
          className="real-map min-h-[380px] w-full rounded-lg border shadow-inner bg-gray-100"
          aria-label="Google Map for selecting farm boundary"
        />
      ) : (
        <div className="fallback-map-container bg-slate-900 rounded-lg p-3 border relative overflow-hidden">
          <div className="text-[11px] text-emerald-400 font-mono mb-2 flex justify-between">
            <span>GRID: {fallbackCentroid.lat}°N, {fallbackCentroid.lng}°E</span>
            <span>TAP CORNERS TO DRAW POLYGON</span>
          </div>

          <svg
            className="w-full h-[320px] bg-slate-800/80 rounded border border-slate-700 cursor-crosshair"
            onClick={handleFallbackCanvasClick}
          >
            <defs>
              <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
                <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#334155" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Polygon fill */}
            {fallbackPoints.length >= 3 && (
              <polygon
                points={fallbackPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="rgba(16, 185, 129, 0.35)"
                stroke="#10b981"
                strokeWidth="2.5"
              />
            )}

            {/* In-progress Polyline */}
            {fallbackPoints.length < 3 && fallbackPoints.length > 1 && (
              <polyline
                points={fallbackPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="4"
              />
            )}

            {/* Point Markers */}
            {fallbackPoints.map((p, idx) => (
              <g key={idx}>
                <circle cx={p.x} cy={p.y} r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                <text x={p.x + 8} y={p.y - 6} fill="#a7f3d0" fontSize="10" fontFamily="monospace">
                  P{idx + 1}
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}

      {/* Status Bar */}
      <div className={`map-status p-2.5 rounded text-xs ${mapsLoaded || fallbackPoints.length > 0 ? "bg-emerald-50 text-emerald-800" : "bg-gray-100 text-gray-700"}`}>
        {status}
      </div>

      {/* Land Subdivision Section */}
      <div className="panel space-y-3">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div>
            <strong className="text-sm text-gray-900">Divide Farm into Land Sections</strong>
            <p className="text-xs text-gray-500">Allocate acreage across candidate crops for portfolio planning.</p>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-100 text-gray-800">
            {sections.reduce((sum, s) => sum + s.area, 0).toFixed(2)} / {measuredAreaAcres.toFixed(2)} acres allocated
          </span>
        </div>

        <div className="space-y-2">
          {sections.map((sec, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <select
                aria-label={`Crop for section ${idx + 1}`}
                value={sec.crop}
                onChange={(e) => updateSection(idx, "crop", e.target.value)}
                className="p-2 border rounded text-xs bg-white font-medium flex-1"
              >
                <option value="Wheat">Wheat</option>
                <option value="Mustard">Mustard</option>
                <option value="Chickpea">Chickpea (Gram)</option>
                <option value="Maize">Maize</option>
                <option value="Cotton">Cotton</option>
                <option value="Soybean">Soybean</option>
                <option value="Onion">Onion</option>
                <option value="Fallow">Fallow / Rest</option>
              </select>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={sec.area || ""}
                onChange={(e) => updateSection(idx, "area", e.target.value)}
                placeholder="Acres"
                className="p-2 border rounded text-xs w-28 bg-white"
              />
              {sections.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSections((curr) => curr.filter((_, i) => i !== idx))}
                  className="text-rose-600 hover:text-rose-800 p-2 text-sm font-bold"
                  aria-label="Remove section"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setSections((curr) => [...curr, { crop: "Mustard", area: 0 }])}
          className="text-button text-xs"
        >
          + Add Section Subdivision
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t text-xs">
          <div>
            <label htmlFor="water-select" className="block text-gray-600 font-medium mb-1">Water Access:</label>
            <select
              id="water-select"
              value={water}
              onChange={(e) => setWater(e.target.value)}
              className="p-2 border rounded w-full bg-white"
            >
              <option value="Low">Low (Rainfed / Limited)</option>
              <option value="Medium">Medium (Borewell / Tube-well)</option>
              <option value="High">High (Canal Assured Irrigation)</option>
            </select>
          </div>
          <div>
            <label htmlFor="risk-select" className="block text-gray-600 font-medium mb-1">Risk Preference:</label>
            <select
              id="risk-select"
              value={risk}
              onChange={(e) => setRisk(e.target.value)}
              className="p-2 border rounded w-full bg-white"
            >
              <option value="Conservative">Conservative (Prioritize MSP Floor Safety)</option>
              <option value="Balanced">Balanced (Optimal Yield & Return)</option>
              <option value="Growth">Growth-Focused (High-Value Cash Crops)</option>
            </select>
          </div>
        </div>
      </div>

      {saveMessage && (
        <div
          className={`p-3 rounded text-xs font-medium ${
            saveMessage.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      <button
        type="button"
        onClick={handleSaveFarm}
        disabled={saving}
        className="primary-button w-full py-2.5 text-sm font-semibold"
      >
        {saving ? "Saving Farm Boundary..." : initialFarm ? "Update Farm Boundary & Inputs" : "Save Farm & Land Inputs"}
      </button>
    </div>
  );
}
