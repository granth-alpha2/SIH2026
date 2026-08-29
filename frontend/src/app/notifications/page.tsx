"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import AppShell from "../components/AppShell";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  level?: string;
  read: boolean;
  createdAt: string;
};

async function fetchNotifications(): Promise<NotificationItem[]> {
  try {
    const res = await fetch("/api/notifications");
    if (!res.ok) return [];
    const js = await res.json();
    return (js.notifications || []) as NotificationItem[];
  } catch {
    return [];
  }
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const seenRef = useRef<Record<string, boolean>>({});

  const refreshList = useCallback(async () => {
    const data = await fetchNotifications();
    setItems(data);
    data.forEach((x) => {
      seenRef.current[x.id] = true;
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const data = await fetchNotifications();
      if (!mounted) return;
      setItems(data);
      setLoading(false);
      data.forEach((x) => {
        seenRef.current[x.id] = true;
      });
    }
    load();

    const interval = setInterval(async () => {
      const latest = await fetchNotifications();
      const newItems = latest.filter((x) => !seenRef.current[x.id]);
      if (newItems.length > 0) {
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          newItems.slice(0, 3).forEach((n) => new Notification(n.title, { body: n.body }));
        }
        newItems.forEach((x) => {
          seenRef.current[x.id] = true;
        });
      }
      setItems(latest);
    }, 12000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  async function markRead(id: string, read: boolean) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read }),
    });
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read } : item)));
  }

  async function markAllRead() {
    const unread = items.filter((item) => !item.read);
    await Promise.all(
      unread.map((item) =>
        fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id, read: true }),
        })
      )
    );
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
  }

  async function createMockAlert(type: string) {
    const alertTitles: Record<string, string> = {
      irrigation: "Palewa Irrigation Reminder",
      weather: "Thunderstorm & Rain Alert",
      disease: "Rust Spore Advisory",
      market: "Wheat Mandi Price Spike (+₹110/q)",
      "crop-stage": "Flowering Stage Reached",
    };
    const alertBodies: Record<string, string> = {
      irrigation: "Optimal soil moisture window is approaching in Bathinda field section 1.",
      weather: "IMD forecast predicts 24mm precipitation over the next 48 hours. Postpone chemical spray.",
      disease: "Warm humid conditions increase Yellow Rust vulnerability. Inspect crop leaf undersides.",
      market: "Bathinda APMC modal price reached ₹2,380/q today, exceeding current MSP by 4.6%.",
      "crop-stage": "Wheat is entering flowering stage. Ensure critical moisture and potassium availability.",
    };

    const body = {
      type,
      title: alertTitles[type] || `${type} notification`,
      body: alertBodies[type] || `Advisory notification for ${type}.`,
      level: type === "weather" || type === "disease" ? "warning" : "info",
    };

    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await refreshList();
  }

  return (
    <AppShell pageTitle="Notifications">
      <section className="page-wrap feature-page">
        <header className="feature-header flex justify-between items-start flex-wrap gap-4">
          <div>
            <p className="eyebrow">ALERT CENTER</p>
            <h1>Notifications & Advisory Feed</h1>
            <p className="subhead">Operational reminders for irrigation timing, weather hazards, market moves, and crop lifecycle stages.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined" && "Notification" in window && Notification.permission !== "granted") {
                  Notification.requestPermission();
                }
              }}
              className="text-button"
            >
              Enable Browser Alerts
            </button>
            <button type="button" onClick={markAllRead} className="primary-button">
              Mark all as read
            </button>
          </div>
        </header>

        <section className="panel mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Generate Test Advisory Alerts</p>
          <div className="flex gap-2 flex-wrap">
            <button type="button" onClick={() => createMockAlert("irrigation")} className="nav-item border px-3 py-1.5 rounded text-xs">
              + Irrigation Alert
            </button>
            <button type="button" onClick={() => createMockAlert("weather")} className="nav-item border px-3 py-1.5 rounded text-xs">
              + Weather Warning
            </button>
            <button type="button" onClick={() => createMockAlert("disease")} className="nav-item border px-3 py-1.5 rounded text-xs">
              + Pest/Disease Alert
            </button>
            <button type="button" onClick={() => createMockAlert("market")} className="nav-item border px-3 py-1.5 rounded text-xs">
              + Mandi Price Movement
            </button>
            <button type="button" onClick={() => createMockAlert("crop-stage")} className="nav-item border px-3 py-1.5 rounded text-xs">
              + Crop Stage Milestone
            </button>
          </div>
        </section>

        <section className="space-y-3">
          {loading && <div className="panel text-center py-6 text-gray-500">Loading alerts...</div>}
          {!loading && items.length === 0 && (
            <div className="panel text-center py-8 text-gray-500">
              <p className="text-base font-medium">No notifications right now.</p>
              <p className="text-xs mt-1">Operational alerts will appear here as weather conditions and crop stages evolve.</p>
            </div>
          )}
          {items.map((item) => (
            <article
              key={item.id}
              className={`panel flex justify-between items-start gap-4 transition-opacity ${item.read ? "opacity-70 bg-gray-50/50" : "border-green-600/30"}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${item.level === "warning" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                    {item.type.toUpperCase()}
                  </span>
                  <strong className="text-sm font-semibold">{item.title}</strong>
                  {!item.read && <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-red-600 text-white rounded">NEW</span>}
                  <span className="text-xs text-gray-400 ml-auto">{new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">{item.body}</p>
              </div>
              <button
                type="button"
                onClick={() => markRead(item.id, !item.read)}
                className="text-xs font-medium text-emerald-700 hover:underline whitespace-nowrap pt-1"
              >
                {item.read ? "Mark unread" : "Mark read"}
              </button>
            </article>
          ))}
        </section>
      </section>
    </AppShell>
  );
}