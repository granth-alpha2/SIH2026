"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navigation = [
  ["Overview", "/", "⌂"],
  ["My farms", "/farms", "▧"],
  ["Crop plan", "/crop-plan", "◒"],
  ["Market watch", "/markets", "↗"],
  ["Weather", "/weather", "☼"],
  ["Assistant", "/assistant", "◌"],
] as const;

type AppShellProps = { children: ReactNode; pageTitle: string };

export default function AppShell({ children, pageTitle }: AppShellProps) {
  const pathname = usePathname();
  return <main className="app-shell">
    <aside className="sidebar">
      <Link className="brand" href="/"><span className="brand-mark">✳</span><span>agriprofit</span></Link>
      <div className="profile"><div className="avatar" aria-hidden="true">RK</div><div><strong>Farmer workspace</strong><small>Development mode</small></div></div>
      <nav aria-label="Main navigation">
        {navigation.map(([label, href, icon]) => <Link key={href} className={`nav-item ${pathname === href || (href !== "/" && pathname.startsWith(href)) ? "active" : ""}`} href={href}><span aria-hidden="true">{icon}</span>{label}</Link>)}
      </nav>
      <div className="sidebar-bottom"><Link className="nav-item" href="/notifications"><span aria-hidden="true">♧</span>Notifications</Link><p>AgriProfit v1.0<br /><b>Farmer decision workspace.</b></p></div>
    </aside>
    <section className="content">
      <header className="topbar"><div className="mobile-brand"><span className="brand-mark">✳</span> agriprofit</div><div className="breadcrumbs">Workspace <span>/</span> <b>{pageTitle}</b></div><div className="top-actions"><Link className="icon-button" aria-label="Open notifications" href="/notifications">♧</Link><span className="mini-avatar" aria-label="Development farmer account">RK</span></div></header>
      {children}
    </section>
  </main>;
}