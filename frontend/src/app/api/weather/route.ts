import { NextResponse } from "next/server";
import { getAgriWeather } from "@/lib/weather-service";
import { getFarm } from "../farms/repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const farmId = searchParams.get("farmId");
  const rawLat = searchParams.get("lat");
  const rawLng = searchParams.get("lng");
  const nameParam = searchParams.get("locationName");

  let lat = 30.2110;
  let lng = 74.9455;
  let locationName = nameParam || "Bathinda, Punjab (Trans-Gangetic Plains)";

  if (farmId) {
    try {
      const farm = await getFarm(farmId);
      if (farm && farm.center) {
        lat = farm.center.lat;
        lng = farm.center.lng;
        locationName = `${farm.name} (${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E)`;
      }
    } catch {
      // Fallback to coordinates
    }
  } else if (rawLat && rawLng) {
    const parsedLat = parseFloat(rawLat);
    const parsedLng = parseFloat(rawLng);
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      lat = parsedLat;
      lng = parsedLng;
    }
  }

  try {
    const weather = await getAgriWeather(lat, lng, locationName);
    return NextResponse.json({
      success: true,
      weather,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "WEATHER_FAILED", message: "Weather data temporarily unavailable." } },
      { status: 503 }
    );
  }
}

