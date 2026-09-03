"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import DemoTourBanner from "./DemoTourBanner";
import { DISTRICT_MASTER } from "@/lib/geo-service";

const navigation = [
  { label: "Dashboard", href: "/", icon: "▦" },
  { label: "Farm & Land", href: "/farms", icon: "⚲" },
  { label: "Recommendations", href: "/recommendations", icon: "◈" },
  { label: "Crop Lifecycle", href: "/crop-plan", icon: "🗓" },
  { label: "Weather & Climate", href: "/weather", icon: "☁" },
  { label: "Market & Mandi", href: "/markets", icon: "☵" },
  { label: "Crop Database", href: "/crops", icon: "⸙" },
  { label: "AI Agronomist", href: "/assistant", icon: "⚡" },
  { label: "Preferences", href: "/preferences", icon: "⚙" },
  { label: "Admin Telemetry", href: "/admin", icon: "⌗" },
];

type AppShellProps = {
  children: React.ReactNode;
  pageTitle: string;
};

type UserInfo = {
  id: string;
  phone: string;
  name: string;
  role: string;
  state?: string;
  district?: string;
  village?: string;
  preferredLanguage?: string;
};

export default function AppShell({ children, pageTitle }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Profile modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editVillage, setEditVillage] = useState("");
  const [editDistrict, setEditDistrict] = useState("Ludhiana");
  const [editState, setEditState] = useState("Punjab");
  const [editLang, setEditLang] = useState("en");
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.user) {
            setUser(json.user);
            setEditName(
              json.user.name && !json.user.name.includes("(+91") && !json.user.name.startsWith("Farmer (")
                ? json.user.name
                : ""
            );
            if (json.user.village) setEditVillage(json.user.village);
            if (json.user.district) setEditDistrict(json.user.district);
            if (json.user.state) setEditState(json.user.state);
            if (json.user.preferredLanguage) setEditLang(json.user.preferredLanguage);
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

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!editName.trim()) {
      setSaveStatus("Please enter your name.");
      return;
    }

    setSavingProfile(true);
    setSaveStatus(null);

    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          village: editVillage.trim(),
          district: editDistrict,
          state: editState,
          preferredLanguage: editLang,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setUser(data.user);
        setSaveStatus("✓ Details saved to database successfully!");
        setTimeout(() => {
          setShowEditModal(false);
          setSaveStatus(null);
        }, 1200);
      } else {
        setSaveStatus(data.error?.message || "Failed to update profile.");
      }
    } catch {
      setSaveStatus("Network error while updating profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  // Calculate clean, human initials (never "F(")
  const isDefaultName = !user?.name || user.name.startsWith("Farmer (") || user.name.includes("(+91");
  const cleanName = user?.name?.replace(/\([^)]*\)/g, "").trim() || "";

  let initials = "FP";
  if (cleanName && !isDefaultName) {
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length >= 2) {
      initials = parts[0].slice(0, 2).toUpperCase();
    } else if (parts.length === 1) {
      initials = parts[0][0].toUpperCase();
    }
  } else if (user?.phone) {
    initials = "F" + user.phone.slice(-1);
  }

  const displayName = isDefaultName
    ? user?.phone
      ? `Farmer (${user.phone.slice(-4)})`
      : "Farmer Workspace"
    : user?.name || "Farmer Workspace";

  return (
    <main className="app-shell">
      {/* 1. Desktop Sidebar */}
      <aside className="sidebar">
        {/* Brand Logo */}
        <Link className="brand" href="/">
          <span className="brand-mark">✳</span>
          <span className="tracking-tight">agriprofit</span>
        </Link>

        {/* Active Profile Pill with Edit Action */}
        <div
          onClick={() => setShowEditModal(true)}
          className="profile-card cursor-pointer group hover:border-[var(--color-primary)] transition-all relative"
          title="Click to edit account and farmer details"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setShowEditModal(true);
          }}
        >
          <div className="profile-avatar shrink-0 font-['Space_Grotesk'] text-xs font-bold" aria-hidden="true">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 justify-between">
              <strong className="block text-xs font-bold font-['Space_Grotesk'] text-[var(--text-primary)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                {displayName}
              </strong>
              <span className="text-[11px] text-[var(--text-muted)] group-hover:text-[var(--color-primary)] opacity-70 group-hover:opacity-100 transition-opacity">
                ✏️
              </span>
            </div>
            <small className="block text-[11px] text-[var(--text-muted)] truncate">
              {user?.phone ? `+91 ${user.phone}` : "Active Field Plot"}
            </small>

            {/* Quick Call to Action if Name is Not Set */}
            {isDefaultName && (
              <span className="inline-block mt-1 text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                + Set Your Name
              </span>
            )}
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

            {/* Topbar User Pill with Modal Trigger */}
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="hidden sm:flex items-center gap-2 pl-2 border-l border-[var(--border-subtle)] cursor-pointer hover:opacity-80 transition-opacity"
              title="Click to edit farmer account details"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold text-xs flex items-center justify-center border border-[var(--border-accent)]">
                {initials}
              </div>
              <span className="text-xs font-bold text-[var(--text-primary)] max-w-[120px] truncate hidden md:inline-block">
                {displayName}
              </span>
            </button>
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

              {/* Mobile Profile Card */}
              <div
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowEditModal(true);
                }}
                className="p-3 mb-4 rounded-xl bg-[var(--bg-surface-accent)] border border-[var(--border-accent)] flex items-center gap-3 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold text-xs flex items-center justify-center border border-[var(--border-accent)] shrink-0">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <strong className="block text-xs font-bold text-[var(--text-primary)] truncate">
                    {displayName}
                  </strong>
                  <small className="block text-[11px] text-[var(--text-muted)] truncate">
                    {user?.phone ? `+91 ${user.phone}` : "Farmer Account"}
                  </small>
                </div>
                <span className="text-xs text-[var(--color-primary)]">✏️</span>
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

        {/* 3. Farmer Profile & Account Naming Modal */}
        {showEditModal && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowEditModal(false)}
          >
            <div
              className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-[var(--border-subtle)] pb-3.5">
                <div>
                  <h3 className="text-lg font-bold font-['Space_Grotesk'] text-[var(--text-primary)] flex items-center gap-2">
                    <span>🌾</span> Farmer Profile & Account Details
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Your details are saved directly to the database and linked to your farm recommendations.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg text-lg leading-none"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Farmer Full Name */}
                <div>
                  <label htmlFor="farmer-name-input" className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Farmer Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="farmer-name-input"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Ramesh Patel / Gurpreet Singh"
                    required
                    className="agri-input w-full font-medium"
                    autoFocus
                  />
                  <span className="text-[11px] text-[var(--text-muted)] block mt-1">
                    This name will appear on all your crop plans, advisory notifications, and harvest records.
                  </span>
                </div>

                {/* Mobile Number (Read-Only) */}
                <div>
                  <label htmlFor="farmer-phone-input" className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Registered Mobile Number
                  </label>
                  <input
                    id="farmer-phone-input"
                    type="text"
                    value={user?.phone ? `+91 ${user.phone}` : "+91-9648153123"}
                    disabled
                    className="agri-input w-full bg-[var(--bg-surface-subtle)] opacity-75 cursor-not-allowed font-mono text-xs"
                  />
                </div>

                {/* State & District Dropdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="farmer-district-select" className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                      District & Zone
                    </label>
                    <select
                      id="farmer-district-select"
                      value={editDistrict}
                      onChange={(e) => {
                        const selectedDist = DISTRICT_MASTER.find((d) => d.district === e.target.value);
                        setEditDistrict(e.target.value);
                        if (selectedDist) setEditState(selectedDist.state);
                      }}
                      className="agri-select w-full text-xs"
                    >
                      {DISTRICT_MASTER.map((d) => (
                        <option key={d.districtId} value={d.district}>
                          {d.district} ({d.state})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="farmer-state-input" className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                      State
                    </label>
                    <input
                      id="farmer-state-input"
                      type="text"
                      value={editState}
                      readOnly
                      className="agri-input w-full bg-[var(--bg-surface-subtle)] text-xs"
                    />
                  </div>
                </div>

                {/* Village & Language */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="farmer-village-input" className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                      Village / Gram Panchayat
                    </label>
                    <input
                      id="farmer-village-input"
                      type="text"
                      value={editVillage}
                      onChange={(e) => setEditVillage(e.target.value)}
                      placeholder="e.g. Samrala / Rampur"
                      className="agri-input w-full text-xs"
                    />
                  </div>

                  <div>
                    <label htmlFor="farmer-lang-select" className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                      Preferred Language
                    </label>
                    <select
                      id="farmer-lang-select"
                      value={editLang}
                      onChange={(e) => setEditLang(e.target.value)}
                      className="agri-select w-full text-xs"
                    >
                      <option value="en">English</option>
                      <option value="hi">हिन्दी (Hindi)</option>
                      <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
                      <option value="mr">मराठी (Marathi)</option>
                      <option value="gu">ગુજરાતી (Gujarati)</option>
                    </select>
                  </div>
                </div>

                {/* Status Message */}
                {saveStatus && (
                  <div
                    className={`p-3 rounded-xl text-xs font-medium border ${
                      saveStatus.startsWith("✓")
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                    }`}
                  >
                    {saveStatus}
                  </div>
                )}

                {/* Modal Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="agri-btn-secondary text-xs"
                    disabled={savingProfile}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="agri-btn-primary text-xs flex items-center gap-2"
                    disabled={savingProfile}
                  >
                    {savingProfile ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving to Database...</span>
                      </>
                    ) : (
                      <>
                        <span>💾</span>
                        <span>Save Details in Database</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}