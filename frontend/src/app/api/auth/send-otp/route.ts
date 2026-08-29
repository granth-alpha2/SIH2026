import { NextResponse } from "next/server";
import { checkRateLimit, cleanPhone, generateOtp, isValidIndianPhone } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const rawPhone = body?.phone;

  if (!rawPhone || typeof rawPhone !== "string") {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_PHONE", message: "Mobile number is required." } },
      { status: 400 }
    );
  }

  const phone = cleanPhone(rawPhone);
  if (!isValidIndianPhone(phone)) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_PHONE_FORMAT", message: "Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)." } },
      { status: 400 }
    );
  }

  if (!checkRateLimit(phone)) {
    return NextResponse.json(
      { success: false, error: { code: "RATE_LIMITED", message: "Too many OTP requests. Please wait a minute before trying again." } },
      { status: 429 }
    );
  }

  const otp = generateOtp(phone);
  const isDev = process.env.NODE_ENV !== "production";

  // In production, integrate with SMS Gateway (e.g., Fast2SMS, Twilio, MSG91)
  // For local development / demo, provide the safe test OTP in response and server log
  if (isDev) {
    console.log(`[AgriProfit Auth] Generated OTP for +91-${phone}: ${otp}`);
  }

  return NextResponse.json({
    success: true,
    message: `Verification code sent to +91 ${phone}`,
    devHint: isDev ? "Development mode: enter 123456 or the code from the server console." : undefined,
    devOtp: isDev ? otp : undefined,
  });
}

