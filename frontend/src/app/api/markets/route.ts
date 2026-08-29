import { NextResponse } from "next/server";
import { marketService } from "@/lib/market-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const crop = searchParams.get("crop") || undefined;
  const state = searchParams.get("state") || undefined;

  try {
    const prices = await marketService.getMandiPrices({ crop, state });
    return NextResponse.json({
      success: true,
      total: prices.length,
      markets: prices,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "MARKET_FETCH_FAILED", message: "Could not fetch mandi market prices." } },
      { status: 500 }
    );
  }
}

