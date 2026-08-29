import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { SESSION_COOKIE_NAME, verifyJWT } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  let token = sessionToken;
  if (!token) {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHENTICATED", message: "No active session." } },
      { status: 401 }
    );
  }

  const user = await verifyJWT(token);
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_SESSION", message: "Session expired or invalid." } },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    user: {
      id: user.sub,
      phone: user.phone,
      name: user.name,
      role: user.role,
    },
  });
}

