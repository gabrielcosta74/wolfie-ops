"use client";

import { usePathname } from "next/navigation";
import { MainNav } from "@/components/nav";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicPortal =
    pathname === "/" ||
    pathname.startsWith("/landing") ||
    pathname.startsWith("/contribuir") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/ops") ||
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
            <h1 className="ops-sidebar-title">Wolfi Ops</h1>
            <p className="eyebrow">Monitorização e Cobertura</p>
          </div>
        </div>
        <MainNav />
      </aside>

      <div className="ops-main-wrapper">
        <header className="ops-topbar" style={{ justifyContent: "flex-end" }}>
          <div className="topbar-actions">
            <form
              action="/ops/logout?next=/ops/login"
              method="POST"
            >
              <button
                type="submit"
                style={{
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.03)",
                  color: "var(--text)",
                  padding: "10px 14px",
                  cursor: "pointer",
                }}
              >
                Sair
              </button>
            </form>
          </div>
        </header>

        <main className="ops-main">{children}</main>
      </div>
    </div>
  );
}
