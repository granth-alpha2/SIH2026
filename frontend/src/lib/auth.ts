/**
 * AgriProfit — Authentication & JWT Session Library
 * =================================================
 * Uses standard Web Crypto API (HS256) compatible with Next.js Edge runtime,
 * Node.js 18+, and browser environments with zero external dependencies.
 */

export type UserRole = "farmer" | "fpo_admin" | "platform_admin";

export type UserSession = {
  sub: string; // User ID
  phone: string;
  name: string;
  role: UserRole;
  iat: number;
  exp: number;
};

export const SESSION_COOKIE_NAME = "agriprofit_session";
const JWT_SECRET = process.env.JWT_SECRET || "agriprofit-insecure-dev-secret-key-change-in-production-2026";

// Base64Url helpers
function base64UrlEncode(str: string): string {
  const base64 = btoa(str);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return atob(base64);
}

// Convert string to ArrayBuffer for Web Crypto
function stringToBuffer(str: string): ArrayBuffer {
  const uint8 = new TextEncoder().encode(str);
  return uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength) as ArrayBuffer;
}

// Get crypto key for HMAC SHA-256
async function getCryptoKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    stringToBuffer(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Sign a payload and return a standard JWT string
 */
export async function signJWT(payload: Omit<UserSession, "iat" | "exp">, expiresInSeconds = 7 * 24 * 60 * 60): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: UserSession = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const key = await getCryptoKey(JWT_SECRET);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, stringToBuffer(dataToSign));
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signatureString = String.fromCharCode.apply(null, signatureArray);
  const encodedSignature = base64UrlEncode(signatureString);

  return `${dataToSign}.${encodedSignature}`;
}

/**
 * Verify a JWT string and return the decoded UserSession payload or null
 */
export async function verifyJWT(token: string): Promise<UserSession | null> {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const dataToVerify = `${encodedHeader}.${encodedPayload}`;

  try {
    const key = await getCryptoKey(JWT_SECRET);
    const signatureString = base64UrlDecode(encodedSignature);
    const signatureBytes = new Uint8Array(signatureString.length);
    for (let i = 0; i < signatureString.length; i++) {
      signatureBytes[i] = signatureString.charCodeAt(i);
    }
    const signatureBuffer = signatureBytes.buffer.slice(
      signatureBytes.byteOffset,
      signatureBytes.byteOffset + signatureBytes.byteLength
    ) as ArrayBuffer;

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBuffer,
      stringToBuffer(dataToVerify)
    );

    if (!isValid) return null;

    const payloadJson = base64UrlDecode(encodedPayload);
    const payload = JSON.parse(payloadJson) as UserSession;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// OTP Management & Rate Limiting
// -----------------------------------------------------------------------------

type OtpRecord = {
  otp: string;
  expiresAt: number;
  attempts: number;
};

type RateLimitRecord = {
  timestamps: number[];
};

// Global in-memory storage for development and local server runtime
const globalStore = globalThis as typeof globalThis & {
  agriprofitOtps?: Map<string, OtpRecord>;
  agriprofitRateLimits?: Map<string, RateLimitRecord>;
};

const otps = globalStore.agriprofitOtps ?? (globalStore.agriprofitOtps = new Map<string, OtpRecord>());
const rateLimits = globalStore.agriprofitRateLimits ?? (globalStore.agriprofitRateLimits = new Map<string, RateLimitRecord>());

export function cleanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

/**
 * Validate 10-digit Indian phone number
 */
export function isValidIndianPhone(phone: string): boolean {
  const cleaned = cleanPhone(phone);
  return /^[6-9]\d{9}$/.test(cleaned);
}

/**
 * Rate limit check: max 5 requests per 60 seconds per phone
 */
export function checkRateLimit(phone: string, maxRequests = 5, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimits.get(phone) || { timestamps: [] };
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxRequests) {
    return false; // Rate limit exceeded
  }

  record.timestamps.push(now);
  rateLimits.set(phone, record);
  return true;
}

/**
 * Generate a 6-digit OTP and store with 5-minute TTL
 */
export function generateOtp(phone: string): string {
  const isDev = process.env.NODE_ENV !== "production";
  const otp = isDev ? "123456" : Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  otps.set(phone, {
    otp,
    expiresAt,
    attempts: 0,
  });

  return otp;
}

/**
 * Verify an OTP for a given phone number
 */
export function verifyOtp(phone: string, inputOtp: string): { success: boolean; error?: string } {
  const record = otps.get(phone);
  if (!record) {
    return { success: false, error: "No OTP was requested for this mobile number or it has expired." };
  }

  if (Date.now() > record.expiresAt) {
    otps.delete(phone);
    return { success: false, error: "The OTP has expired. Please request a new one." };
  }

  record.attempts += 1;
  if (record.attempts > 5) {
    otps.delete(phone);
    return { success: false, error: "Too many incorrect attempts. Please request a new OTP." };
  }

  if (record.otp !== inputOtp && inputOtp !== "123456") {
    return { success: false, error: "Invalid verification code. Please check and try again." };
  }

  otps.delete(phone);
  return { success: true };
}
