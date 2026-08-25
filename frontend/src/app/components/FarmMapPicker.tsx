/// <reference types="google.maps" />
"use client";

import { useEffect, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

type FarmMapPickerProps = {
  onAreaChange: (areaAcres: number) => void;
  onSelectionChange?: (selection: FarmSelection) => void;
};
export type FarmSelection = { center: { lat: number; lng: number }; boundary: { lat: number; lng: number }[] };
type LandSection = { crop: string; area: number };
type DrawingManagerRuntime = { setMap: (map: google.maps.Map | null) => void; setDrawingMode: (mode: google.maps.drawing.OverlayType | null) => void };

const defaultCenter = { lat: 19.9975, lng: 73.7898 };
let configuredApiKey = "";

function publishSelection(selection: FarmSelection) {
  window.dispatchEvent(new CustomEvent<FarmSelection>("farm-selection-change", { detail: selection }));
}

export default function FarmMapPicker({ onAreaChange, onSelectionChange }: FarmMapPickerProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const searchElement = useRef<HTMLInputElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const selectionRef = useRef<FarmSelection | null>(null);
  const areaRef = useRef(0);
  const drawingRef = useRef(false);
  const draftPathRef = useRef<google.maps.LatLng[]>([]);
  const draftPolylineRef = useRef<google.maps.Polyline | null>(null);
  const finishDrawingRef = useRef<() => void>(() => undefined);
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);
  const [status, setStatus] = useState("Click the polygon tool, then mark your field boundary.");
  const [ready, setReady] = useState(false);
  const [sections, setSections] = useState<LandSection[]>([{ crop: "Wheat", area: 0 }]);
  const [measuredArea, setMeasuredArea] = useState(0);
  const [water, setWater] = useState("Medium");
  const [risk, setRisk] = useState("Balanced");
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!mapElement.current || !apiKey) return;
    if (configuredApiKey !== apiKey) {
      setOptions({ key: apiKey, v: "weekly" });
      configuredApiKey = apiKey;
    }
    let drawingManager: DrawingManagerRuntime | undefined;
    Promise.all([importLibrary("maps"), importLibrary("drawing"), importLibrary("geometry"), importLibrary("places")]).then(([mapsLibrary]) => {
      if (!mapElement.current) return;
      const { Map } = mapsLibrary as google.maps.MapsLibrary;
      const map = new Map(mapElement.current, {
        center: defaultCenter,
        zoom: 14,
        mapTypeId: "satellite",
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: false,
      });
      mapRef.current = map;
      google.maps.event.addListener(map, "click", (event: google.maps.MapMouseEvent) => {
        if (!event.latLng) return;
        if (drawingRef.current) {
          draftPathRef.current.push(event.latLng);
          draftPolylineRef.current?.setPath(draftPathRef.current);
          setStatus(`${draftPathRef.current.length} boundary points added. Keep tapping corners, then finish.`);
          return;
        }
        setMarker(event.latLng);
        polygonRef.current?.setMap(null);
        draftPathRef.current = [];
        draftPolylineRef.current?.setMap(null);
        draftPolylineRef.current = new google.maps.Polyline({ map: mapRef.current, strokeColor: "#23704a", strokeWeight: 3 });
        drawingRef.current = true;
        setStatus("Pin dropped. Now tap each corner of the field, then finish the boundary.");
      });
      const DrawingManager = google.maps.drawing.DrawingManager as unknown as new (options: object) => DrawingManagerRuntime;
      const manager = new DrawingManager({
        drawingMode: null,
        drawingControl: false,
        drawingControlOptions: { position: google.maps.ControlPosition.TOP_CENTER, drawingModes: [google.maps.drawing.OverlayType.POLYGON] },
        polygonOptions: { fillColor: "#a9d46f", fillOpacity: 0.45, strokeColor: "#23704a", strokeWeight: 3, editable: true, draggable: false },
      });
      drawingManager = manager;
      manager.setMap(map);
      google.maps.event.addListener(manager as unknown as google.maps.drawing.DrawingManager, "polygoncomplete", (polygon: google.maps.Polygon) => {
        polygonRef.current?.setMap(null);
        polygonRef.current = polygon;
        manager.setDrawingMode(null);
        updateArea(polygon);
        google.maps.event.addListener(polygon.getPath(), "set_at", () => updateArea(polygon));
        google.maps.event.addListener(polygon.getPath(), "insert_at", () => updateArea(polygon));
      });
      finishDrawingRef.current = () => {
        if (draftPathRef.current.length < 3) {
          setStatus("Add at least three points to select the field.");
          return;
        }
        draftPolylineRef.current?.setMap(null);
        const polygon = new google.maps.Polygon({ paths: draftPathRef.current, map, editable: true, fillColor: "#a9d46f", fillOpacity: 0.45, strokeColor: "#23704a", strokeWeight: 3 });
        polygonRef.current?.setMap(null);
        polygonRef.current = polygon;
        drawingRef.current = false;
        updateArea(polygon);
        google.maps.event.addListener(polygon.getPath(), "set_at", () => updateArea(polygon));
        google.maps.event.addListener(polygon.getPath(), "insert_at", () => updateArea(polygon));
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
            setStatus(`Location selected: ${place.name ?? "farm area"}`);
          }
        });
      }
      setReady(true);
    }).catch(() => setStatus("Google Maps could not load. Check your API key and enabled Maps libraries."));

    function setMarker(location: google.maps.LatLng | google.maps.LatLngLiteral) {
      markerRef.current?.setMap(null);
      markerRef.current = new google.maps.Marker({ map: mapRef.current, position: location, title: "Farm location", draggable: true });
      markerRef.current.addListener("dragend", () => {
        const position = markerRef.current?.getPosition();
        if (!position) return;
        selectionRef.current = { center: position.toJSON(), boundary: polygonRef.current?.getPath().getArray().map((item) => item.toJSON()) ?? [] };
        onSelectionChange?.(selectionRef.current);
        setStatus("Farm pin moved. Draw or edit the boundary around this location.");
      });
      const point = location instanceof google.maps.LatLng ? location.toJSON() : location;
      const existingBoundary = polygonRef.current?.getPath().getArray().map((item) => item.toJSON()) ?? [];
      selectionRef.current = { center: point, boundary: existingBoundary };
      publishSelection(selectionRef.current);
      onSelectionChange?.(selectionRef.current);
    }

    function updateArea(polygon: google.maps.Polygon) {
      const squareMeters = google.maps.geometry.spherical.computeArea(polygon.getPath());
      const acres = Math.max(0.01, squareMeters / 4046.8564224);
      areaRef.current = Number(acres.toFixed(2));
      setMeasuredArea(areaRef.current);
      onAreaChange(Number(acres.toFixed(2)));
      const points = polygon.getPath().getArray().map((point) => point.toJSON());
      const center = markerRef.current?.getPosition()?.toJSON() ?? points[0];
      if (center) {
        selectionRef.current = { center, boundary: points };
        publishSelection(selectionRef.current);
        onSelectionChange?.(selectionRef.current);
      }
      setStatus(`Boundary saved: ${acres.toFixed(2)} acres. Drag the points to edit it.`);
    }

    return () => {
      drawingManager?.setMap(null);
      polygonRef.current?.setMap(null);
      draftPolylineRef.current?.setMap(null);
      finishDrawingRef.current = () => undefined;
    };
  }, [apiKey, onAreaChange, onSelectionChange]);

  function useCurrentLocation() {
    if (!navigator.geolocation || !mapRef.current) return setStatus("Location access is unavailable in this browser.");
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const location = { lat: coords.latitude, lng: coords.longitude };
      mapRef.current?.setCenter(location);
      mapRef.current?.setZoom(17);
      markerRef.current?.setMap(null);
      markerRef.current = new google.maps.Marker({ map: mapRef.current, position: location, title: "Farm location", draggable: true });
      markerRef.current.addListener("dragend", () => {
        const position = markerRef.current?.getPosition();
        if (!position) return;
        selectionRef.current = { center: position.toJSON(), boundary: polygonRef.current?.getPath().getArray().map((item) => item.toJSON()) ?? [] };
        onSelectionChange?.(selectionRef.current);
      });
      selectionRef.current = { center: location, boundary: polygonRef.current?.getPath().getArray().map((item) => item.toJSON()) ?? [] };
      publishSelection(selectionRef.current);
      onSelectionChange?.(selectionRef.current);
      setStatus("Current location selected. Now draw around your field.");
    }, () => setStatus("Location permission was not granted. Search for your farm instead."));
  }

  function startDrawing() {
    if (!mapRef.current) return setStatus("Wait for the map to finish loading.");
    polygonRef.current?.setMap(null);
    draftPathRef.current = [];
    draftPolylineRef.current?.setMap(null);
    draftPolylineRef.current = new google.maps.Polyline({ map: mapRef.current, strokeColor: "#23704a", strokeWeight: 3 });
    drawingRef.current = true;
    setStatus("Tap each corner of your field on the map.");
  }

  function selectPinnedArea() {
    if (!markerRef.current) {
      setStatus("Click the map first to drop a farm pin.");
      return;
    }
    startDrawing();
    setStatus("Pin selected. Tap the corners around this field, then finish the boundary.");
  }

  async function saveBoundary() {
    const selection = selectionRef.current;
    if (!selection || selection.boundary.length < 3) {
      setStatus("Drop a pin and draw a boundary with at least three points before saving.");
      return;
    }
    const allocatedArea = sections.reduce((total, section) => total + section.area, 0);
    if (allocatedArea <= 0 || allocatedArea > areaRef.current) {
      setStatus(`Allocation must be greater than 0 and no more than ${areaRef.current.toFixed(2)} acres.`);
      return;
    }
    const response = await fetch("/api/farms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "My farm", areaAcres: areaRef.current, ...selection, sections, preferences: { water, risk } }) });
    setStatus(response.ok ? "Farm boundary saved to the server." : "The boundary could not be saved. Please try again.");
  }

  function updateSection(index: number, field: keyof LandSection, value: string) {
    setSections((current) => current.map((section, sectionIndex) => sectionIndex === index ? { ...section, [field]: field === "area" ? Number(value) : value } : section));
  }

  if (!apiKey) return <div className="map-config-message"><strong>Google Maps is ready to connect</strong><p>Add <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to <code>.env.local</code>, enable Maps JavaScript, Places, Geometry and Drawing APIs, then reload.</p></div>;

  return <div className="picker-wrap">
    <div className="picker-toolbar" style={{ flexWrap: "wrap" }}><input ref={searchElement} aria-label="Search farm location" placeholder="Search village, district or landmark" /><button type="button" onClick={useCurrentLocation}>⌖ Use my location</button><button type="button" onClick={selectPinnedArea}>Select pinned area</button><button type="button" onClick={startDrawing}>⌖ Draw field</button><button type="button" onClick={() => finishDrawingRef.current()}>✓ Finish boundary</button></div>
    <div ref={mapElement} className="real-map" aria-label="Google map for selecting farm boundary" />
    <div className={`map-status ${ready ? "ready" : ""}`}><span />{status}</div><div className="land-division"><div className="division-heading"><strong>Divide your land</strong><span>{sections.reduce((total, section) => total + section.area, 0).toFixed(2)} / {measuredArea.toFixed(2)} acres</span></div>{sections.map((section, index) => <div className="division-row" key={`${index}-${section.crop}`}><select aria-label={`Crop section ${index + 1}`} value={section.crop} onChange={(event) => updateSection(index, "crop", event.target.value)}><option>Wheat</option><option>Mustard</option><option>Maize</option><option>Onion</option><option>Other</option></select><input aria-label={`Area for section ${index + 1}`} type="number" min="0.01" step="0.01" value={section.area || ""} placeholder="Acres" onChange={(event) => updateSection(index, "area", event.target.value)} />{sections.length > 1 && <button type="button" aria-label="Remove section" onClick={() => setSections((current) => current.filter((_, sectionIndex) => sectionIndex !== index))}>×</button>}</div>)}<button type="button" className="add-section" onClick={() => setSections((current) => [...current, { crop: "Maize", area: 0 }])}>+ Add crop section</button><div className="preference-row"><label>Water<select value={water} onChange={(event) => setWater(event.target.value)}><option>Low</option><option>Medium</option><option>High</option></select></label><label>Risk preference<select value={risk} onChange={(event) => setRisk(event.target.value)}><option>Conservative</option><option>Balanced</option><option>Growth focused</option></select></label></div></div><button type="button" className="save-boundary-button" onClick={saveBoundary}>Save farm and plan inputs</button>
  </div>;
}
