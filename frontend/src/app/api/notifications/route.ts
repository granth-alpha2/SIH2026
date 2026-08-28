import { NextResponse } from "next/server";
import { saveNotification, listNotifications, markNotificationRead, type NotificationRecord } from "./repository";

export async function GET() {
  try {
    const items = await listNotifications();
    return NextResponse.json({ success: true, notifications: items });
  } catch (e) {
    return NextResponse.json({ success: false, error: { code: 'NOTIFICATION_LIST_FAILED', message: 'Could not list notifications' } }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !body.type || !body.title) {
    return NextResponse.json({ success: false, error: { code: 'INVALID_NOTIFICATION', message: 'Missing type or title' } }, { status: 400 });
  }
  const n: NotificationRecord = {
    id: crypto.randomUUID(),
    type: String(body.type),
    title: String(body.title),
    body: body.body ? String(body.body) : '',
    data: body.data ?? null,
    level: body.level ?? 'info',
    read: false,
    createdAt: new Date().toISOString(),
  };
  try {
    await saveNotification(n);
    return NextResponse.json({ success: true, notification: n }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, error: { code: 'NOTIFICATION_SAVE_FAILED', message: 'Could not save notification' } }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !body.id || typeof body.read !== 'boolean') {
    return NextResponse.json({ success: false, error: { code: 'INVALID_UPDATE', message: 'Missing id or read flag' } }, { status: 400 });
  }
  try {
    await markNotificationRead(String(body.id), Boolean(body.read));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: { code: 'NOTIFICATION_UPDATE_FAILED', message: 'Could not update notification' } }, { status: 503 });
  }
}
