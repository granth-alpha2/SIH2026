"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

const navigation = [
  ["Overview", "/", "⌂"],
  ["My farms", "/farms", "▧"],
  ["Crop database", "/crops", "✦"],
  ["Preferences", "/preferences", "⚙"],
  ["Crop plan", "/crop-plan", "◒"],
  ["Market watch", "/markets", "↗"],
  ["Weather", "/weather", "☼"],
  ["Assistant", "/assistant", "◌"],
] as const;

type AppShellProps = { children: ReactNode; pageTitle: string };

type UserInfo = {
  id: string;
  phone: string;
  name: string;
  role: string;
};

export default function AppShell({ children, pageTitle }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.user) {
            setUser(json.user);
          }
        }
      } catch {
        // Fallback to default
      }
    }
    loadUser();
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  }

  const initials = user?.phone ? user.phone.slice(-2) : "RK";
  const displayName = user?.name || "Farmer Workspace";

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span className="brand-mark">✳</span>
          <span>agriprofit</span>
        </Link>
        <div className="profile">
          <div className="avatar" aria-hidden="true">
            {initials}
          </div>
          <div>
            <strong>{displayName}</strong>
            <small>{user?.phone ? `+91 ${user.phone}` : "Development mode"}</small>
          </div>
        </div>
        <nav aria-label="Main navigation">
          {navigation.map(([label, href, icon]) => (
            <Link
              key={href}
              className={`nav-item ${
                pathname === href || (href !== "/" && pathname.startsWith(href)) ? "active" : ""
              }`}
              href={href}
            >
              <span aria-hidden="true">{icon}</span>
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link className="nav-item" href="/notifications">
            <span aria-hidden="true">♧</span>Notifications
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="nav-item w-full text-left text-rose-300 hover:text-rose-100 hover:bg-rose-950/40 mt-1 cursor-pointer"
          >
            <span aria-hidden="true">⇦</span>Sign out
          </button>
          <p className="mt-3 text-[11px] text-gray-400">
            AgriProfit v1.0
            <br />
            <b>Farmer decision workspace.</b>
          </p>
        </div>
      </aside>
      <section className="content">
        <header className="topbar">
          <div className="mobile-brand">
            <span className="brand-mark">✳</span> agriprofit
          </div>
          <div className="breadcrumbs">
            Workspace <span>/</span> <b>{pageTitle}</b>
          </div>
          <div className="top-actions">
            <Link className="icon-button" aria-label="Open notifications" href="/notifications">
              ♧
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="text-[11px] text-gray-600 hover:text-rose-600 font-medium px-2 py-1 border rounded hidden sm:inline-block cursor-pointer"
            >
              Sign out
            </button>
            <span className="mini-avatar" aria-label="Authenticated farmer account">
              {initials}
            </span>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}