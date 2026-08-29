"use client";

import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import type { AgriWeatherReport } from "@/lib/weather-service";

const presetRegions = [
  { name: "Bathinda, Punjab (Trans-Gangetic Plains)", lat: 30.2110, lng: 74.9455 },
  { name: "Karnal, Haryana (Trans-Gangetic Plains)", lat: 29.6857, lng: 76.9905 },
  { name: "Varanasi, UP (Middle Gangetic Plains)", lat: 25.3176, lng: 82.9739 },
  { name: "Nashik, Maharashtra (Western Plateau)", lat: 19.9975, lng: 73.7898 },
  { name: "Indore, MP (Central Plateau)", lat: 22.7196, lng: 75.8577 },
];

export default function WeatherPage() {
  const [selectedRegion, setSelectedRegion] = useState(presetRegions[0]);
  const [weather, setWeather] = useState<AgriWeatherReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadWeather() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/weather?lat=${selectedRegion.lat}&lng=${selectedRegion.lng}&locationName=${encodeURIComponent(
            selectedRegion.name
          )}`
        );
        if (res.ok && isMounted) {
          const json = await res.json();
          if (json.success && json.weather) {
            setWeather(json.weather);
          }
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadWeather();
    return () => {
      isMounted = false;
    };
  }, [selectedRegion]);

  return (
    <AppShell pageTitle="Weather outlook">
      <section className="page-wrap feature-page max-w-5xl mx-auto space-y-4">
        <header className="feature-header flex justify-between items-start flex-wrap gap-4 mb-2">
          <div>
            <p className="eyebrow">AGRO-METEOROLOGICAL OUTLOOK</p>
            <h1>Regional Climate & 7-Day Forecast</h1>
            <p className="subhead">
              High-resolution precipitation, thermal anomalies, and extreme weather hazard alerts for crop management.
            </p>
          </div>
          <div>
            <select
              value={`${selectedRegion.lat},${selectedRegion.lng}`}
              onChange={(e) => {
                const [lat, lng] = e.target.value.split(",").map(Number);
                const found = presetRegions.find((r) => r.lat === lat && r.lng === lng);
                if (found) setSelectedRegion(found);
              }}
              className="p-2 border rounded text-xs bg-white font-medium"
            >
              {presetRegions.map((r) => (
                <option key={r.name} value={`${r.lat},${r.lng}`}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </header>

        {loading && <div className="panel text-center py-10 text-gray-500">Fetching agro-meteorological feeds...</div>}

        {!loading && weather && (
          <>
            {/* Current Weather Hero Banner */}
            <section className="panel bg-gradient-to-br from-emerald-800 to-emerald-950 text-white border-0 shadow-md">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <span className="text-xs uppercase tracking-wider text-emerald-300 font-semibold">Active Region</span>
                  <h2 className="text-xl font-bold mt-0.5 text-white">{weather.location.name}</h2>
                  <p className="text-[11px] text-emerald-200 mt-0.5">
                    Grid Centroid: {weather.location.lat}°N, {weather.location.lng}°E · Source: {weather.provenance.provider === "open-meteo" ? "Live Open-Meteo API" : "Regional Baseline"}
                    {weather.provenance.cached ? " (1-hr Cached)" : ""}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-white flex items-center justify-end gap-2">
                    <span>{weather.current.icon}</span>
                    <span>{Math.round(weather.current.tempC)}°C</span>
                  </div>
                  <p className="text-xs text-emerald-300 font-medium">{weather.current.condition} · Feels like {Math.round(weather.current.feelsLikeC)}°C</p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-emerald-700/50 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-emerald-300 block text-[10px] uppercase font-semibold">Humidity</span>
                  <strong className="text-sm text-white">{weather.current.humidityPct}%</strong>
                </div>
                <div>
                  <span className="text-emerald-300 block text-[10px] uppercase font-semibold">Wind Speed</span>
                  <strong className="text-sm text-white">{weather.current.windSpeedKmh} km/h</strong>
                </div>
                <div>
                  <span className="text-emerald-300 block text-[10px] uppercase font-semibold">90-Day Seasonal Rain</span>
                  <strong className="text-sm text-white">{weather.seasonalOutlook.cumulativeRain90DaysMm} mm</strong>
                </div>
                <div>
                  <span className="text-emerald-300 block text-[10px] uppercase font-semibold">Climate Suitability</span>
                  <strong className="text-sm text-emerald-300 font-bold">{weather.seasonalOutlook.weatherSuitabilityScore}/100</strong>
                </div>
              </div>
            </section>

            {/* Extreme Alerts (if any) */}
            {weather.extremeAlerts && weather.extremeAlerts.length > 0 && (
              <section className="space-y-2">
                {weather.extremeAlerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-lg border text-xs ${
                      alert.severity === "high"
                        ? "bg-rose-50 border-rose-300 text-rose-900"
                        : "bg-amber-50 border-amber-300 text-amber-900"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <span>⚠</span>
                      <span>{alert.title}</span>
                    </div>
                    <p className="mt-1 leading-relaxed">{alert.description}</p>
                    <div className="mt-2 pt-2 border-t border-amber-200/60 font-semibold">
                      Farmer Action: <span className="font-normal">{alert.advisoryAction}</span>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* 7-Day Forecast Grid */}
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">7-Day Agro Forecast</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {weather.dailyForecast.map((d, i) => (
                  <article key={i} className="panel text-center p-2.5 flex flex-col justify-between">
                    <div>
                      <strong className="text-xs text-gray-900 block">{d.dayName}</strong>
                      <span className="text-[10px] text-gray-400 block">{d.date}</span>
                      <div className="text-2xl my-1.5">{d.icon}</div>
                      <div className="text-xs font-bold text-gray-900">
                        {Math.round(d.tempMaxC)}° / <span className="text-gray-400 font-normal">{Math.round(d.tempMinC)}°</span>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t text-[11px]">
                      <span className={d.rainfallMm > 0 ? "text-emerald-700 font-bold block" : "text-gray-400 block"}>
                        {d.rainfallMm > 0 ? `${d.rainfallMm} mm` : "0 mm"}
                      </span>
                      <span className="text-[10px] text-gray-500 block">{d.humidityPct}% hum</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* Seasonal Outlook Breakdown */}
            <section className="panel text-xs space-y-2">
              <strong className="text-sm text-gray-900 block">Seasonal Agro-Climate Analysis</strong>
              <p className="text-gray-600 leading-relaxed">
                The current 90-day precipitation accumulation ({weather.seasonalOutlook.cumulativeRain90DaysMm} mm across {weather.seasonalOutlook.rainyDaysSeason} rainy days) maintains a <b>{weather.seasonalOutlook.riskLevel}</b> moisture deficit risk for {selectedRegion.name}. Weather conditions remain highly suitable for Rabi planting and seedling vegetative growth.
              </p>
            </section>
          </>
        )}
      </section>
    </AppShell>
  );
}