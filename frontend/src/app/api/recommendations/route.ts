import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifyJWT } from "@/lib/auth";
import { getPreferences } from "../preferences/repository";
import { getFarm } from "../farms/repository";
import { getAgriWeather } from "@/lib/weather-service";
import { generateRecommendations, type RecommendationInput } from "@/lib/recommendation-engine";
import type { CropSeason } from "@/lib/crop-data";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const farmId = body.farmId;

  // Resolve authenticated user
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  let userId = "default-farmer";
  if (token) {
    const user = await verifyJWT(token);
    if (user?.sub) userId = user.sub;
  }

  // Load preferences
  let preferences = await getPreferences(userId);
  if (body.preferences && typeof body.preferences === "object") {
    preferences = { ...preferences, ...body.preferences };
  }

  let farmAreaAcres = body.farmAreaAcres || 2.5;
  let lat = 30.2110;
  let lng = 74.9455;
  let locationName = "Bathinda, Punjab";

  if (farmId) {
    try {
      const farm = await getFarm(farmId);
      if (farm) {
        farmAreaAcres = farm.areaAcres || farmAreaAcres;
        lat = farm.center.lat;
        lng = farm.center.lng;
        locationName = farm.name;
        if (farm.preferences) {
          const water = farm.preferences.water === "Low" || farm.preferences.water === "Medium" || farm.preferences.water === "High" ? farm.preferences.water : undefined;
          const risk = farm.preferences.risk === "Conservative" || farm.preferences.risk === "Balanced" || farm.preferences.risk === "Growth" ? farm.preferences.risk : undefined;
          preferences = {
            ...preferences,
            ...(water ? { waterAvailability: water } : {}),
            ...(risk ? { riskAppetite: risk } : {}),
          };
        }
      }
    } catch {
      // Fallback to coordinates
    }
  }

  // Fetch weather report for centroid
  const weather = await getAgriWeather(lat, lng, locationName);

  const season: CropSeason = body.season || "Rabi";

  const recInput: RecommendationInput = {
    farmAreaAcres,
    currentSeason: season,
    preferences,
    weather,
  };

  try {
    const portfolio = generateRecommendations(recInput);
    return NextResponse.json({
      success: true,
      recommendation: portfolio,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "RECOMMENDATION_FAILED", message: "Failed to generate crop recommendations." } },
      { status: 500 }
    );
  }
}
