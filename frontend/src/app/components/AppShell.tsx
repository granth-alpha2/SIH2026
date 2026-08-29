"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import DemoTourBanner from "./DemoTourBanner";
import ThemeToggle from "./ThemeToggle";

const navigation = [
  { label: "Overview", href: "/", icon: "⌂" },
  { label: "My Farms", href: "/farms", icon: "▧" },
  { label: "Recommendations", href: "/recommendations", icon: "✦" },
  { label: "Crop Plan", href: "/crop-plan", icon: "◒" },
  { label: "Market Watch", href: "/markets", icon: "↗" },
  { label: "Weather", href: "/weather", icon: "☼" },
  { label: "Crop Database", href: "/crops", icon: "🌿" },
  { label: "AI Agronomist", href: "/assistant", icon: "◌" },
  { label: "Preferences", href: "/preferences", icon: "⚙" },
  { label: "Admin Telemetry", href: "/admin", icon: "⚡" },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        // Fallback
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

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
    : user?.phone
    ? user.phone.slice(-2)
    : "FP";

  const displayName = user?.name || "Farmer Workspace";

  return (
    <main className="app-shell">
      {/* 1. Desktop Sidebar */}
      <aside className="sidebar">
        {/* Brand Logo */}
        <Link className="brand" href="/">
          <span className="brand-mark">✳</span>
          <span className="tracking-tight">agriprofit</span>
        </Link>

        {/* Active Profile Pill */}
        <div className="profile-card">
          <div className="profile-avatar" aria-hidden="true">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <strong className="block text-xs font-bold font-['Space_Grotesk'] text-[var(--text-primary)] truncate">
              {displayName}
            </strong>
            <small className="block text-[11px] text-[var(--text-muted)] truncate">
              {user?.phone ? `+91 ${user.phone}` : "Active Field Plot"}
            </small>
          </div>
        </div>

        {/* Main Navigation Items */}
        <nav className="flex-1 space-y-0.5" aria-label="Main Navigation">
          {navigation.map(({ label, href, icon }) => {
            const isActive =
              pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                className={`nav-item ${isActive ? "active" : ""}`}
                href={href}
              >
                <span className="nav-icon" aria-hidden="true">
                  {icon}
                </span>
                <span>{label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-[var(--border-subtle)] space-y-1">
          <Link
            className="nav-item text-xs"
            href="/notifications"
          >
            <span className="nav-icon" aria-hidden="true">♧</span>
            <span>Alerts & Notifications</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="nav-item text-xs w-full text-left text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
          >
            <span className="nav-icon" aria-hidden="true">⇦</span>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <section className="content-wrap">
        {/* Global Topbar Header */}
        <header className="topbar">
          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm font-bold"
              aria-label="Toggle navigation menu"
            >
              ☰
            </button>

            {/* Breadcrumb Path */}
            <div className="breadcrumbs flex items-center gap-2 text-xs font-['Space_Grotesk'] text-[var(--text-muted)]">
              <span>AgriProfit</span>
              <span className="opacity-40">/</span>
              <b className="text-[var(--text-primary)] font-bold">{pageTitle}</b>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            <Link
              className="p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)] transition-colors relative"
              aria-label="View notifications"
              href="/notifications"
            >
              <span className="text-sm">🔔</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--color-rose)]" />
            </Link>

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[var(--border-subtle)]">
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold text-xs flex items-center justify-center border border-[var(--border-accent)]">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Slide-Over Menu */}
        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="w-72 bg-[var(--bg-surface)] border-r border-[var(--border-default)] p-4 flex flex-col h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)] mb-4">
                <Link className="brand mb-0" href="/" onClick={() => setMobileMenuOpen(false)}>
                  <span className="brand-mark">✳</span>
                  <span>agriprofit</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  ✕
                </button>
              </div>

              <nav className="flex-1 space-y-1 overflow-y-auto">
                {navigation.map(({ label, href, icon }) => (
                  <Link
                    key={href}
                    className={`nav-item ${pathname === href ? "active" : ""}`}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="nav-icon">{icon}</span>
                    <span>{label}</span>
                  </Link>
                ))}
              </nav>

              <div className="pt-4 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="nav-item text-xs w-full text-left text-rose-500"
                >
                  <span>⇦</span>
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Demo Tour Banner (If applicable) */}
        <DemoTourBanner />

        {/* Page Content Viewport */}
        {children}
      </section>
    </main>
  );
}