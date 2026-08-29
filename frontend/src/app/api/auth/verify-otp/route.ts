import { NextResponse } from "next/server";
import { cleanPhone, SESSION_COOKIE_NAME, signJWT, verifyOtp } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const rawPhone = body?.phone;
  const rawOtp = body?.otp;

  if (!rawPhone || !rawOtp) {
    return NextResponse.json(
      { success: false, error: { code: "MISSING_FIELDS", message: "Both mobile number and OTP code are required." } },
      { status: 400 }
    );
  }

  const phone = cleanPhone(String(rawPhone));
  const otp = String(rawOtp).trim();

  const verification = verifyOtp(phone, otp);
  if (!verification.success) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_OTP", message: verification.error || "Invalid OTP code." } },
      { status: 401 }
    );
  }

  // Find or create user payload
  const userId = `usr_${phone.slice(-6)}`;
  const userName = `Farmer (+91-${phone.slice(0, 5)}...)`;
  
  const token = await signJWT({
    sub: userId,
    phone,
    name: userName,
    role: "farmer",
  });

  const response = NextResponse.json({
    success: true,
    message: "Authentication successful",
    token,
    user: {
      id: userId,
      phone,
      name: userName,
      role: "farmer",
    },
  });

  // Set HTTP-only secure session cookie
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return response;
}

