import { NextResponse } from "next/server";
import { marketService } from "@/lib/market-service";

type RouteParams = {
  params: Promise<{ cropSlug: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { cropSlug } = await params;
  try {
    const detail = await marketService.getCropPriceDetail(cropSlug);
    if (!detail) {
      return NextResponse.json(
        { success: false, error: { code: "CROP_MARKET_NOT_FOUND", message: `Market data for '${cropSlug}' not found.` } },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      market: detail,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "MARKET_FETCH_FAILED", message: "Failed to load crop price history." } },
      { status: 500 }
    );
  }
}

