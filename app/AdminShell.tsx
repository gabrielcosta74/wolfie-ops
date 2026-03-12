"use client";

import { usePathname } from "next/navigation";
import { MainNav } from "@/components/nav";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicPortal =
    pathname === "/" ||
    pathname.startsWith("/contribuir") ||
    pathname.startsWith("/studio");

  if (isPublicPortal) {
    return <>{children}</>;
  }

  return (
    <div className="ops-app-container">
      <aside className="ops-sidebar">
        <div className="ops-brand">
          <div className="brand-logo">W</div>
          <div className="brand-text">
            <h1 className="ops-sidebar-title">Wolfie Ops</h1>
            <p className="eyebrow">Monitorização e Cobertura</p>
          </div>
        </div>
        <MainNav />
      </aside>

      <div className="ops-main-wrapper">
        <header className="ops-topbar" style={{ justifyContent: "flex-end" }}>
          <div className="topbar-actions">
            <div className="avatar-placeholder">Admin</div>
          </div>
        </header>

        <main className="ops-main">{children}</main>
      </div>
    </div>
  );
}
