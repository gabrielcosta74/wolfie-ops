import type { Metadata } from "next";
import Link from "next/link";
import { getStudioSession, isStudioRole } from "@/lib/studio-auth";
import { StudioNav } from "./StudioNav";
import "./studio.css";

export const metadata: Metadata = {
  title: "Wolfi Studio",
  description: "Portal do Professor para curadoria e validação académica do Wolfi.",
};

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const { user, role } = await getStudioSession();
  const hasAccess = isStudioRole(role);

  return (
    <div className="studio-portal">
      <header className="st-header">
        <div className="st-header-brand">
          <div className="st-logo">W</div>
          <div>
            <div className="st-header-name">Wolfi Studio</div>
            <div className="st-header-sub">Revisão guiada para professores</div>
          </div>
        </div>
        {user && (
          <div className="st-header-actions">
            <span className="st-header-email">{user.email}</span>
            <form action="/studio/logout" method="POST">
              <button type="submit" className="st-logout-btn">
                Sair
              </button>
            </form>
          </div>
        )}
      </header>

      {hasAccess ? (
        <div className="st-shell">
          <nav className="st-sidebar">
            <div className="st-sidebar-top">
              <span className="st-sidebar-kicker">Workspace</span>
              <h2 className="st-sidebar-title">Revisão de Matemática</h2>
              <p className="st-sidebar-copy">Escolhe tema, revê uma pergunta de cada vez e deixa feedback rápido.</p>
              <Link href="/studio/teacher/revisao" className="st-btn st-btn--primary st-btn--wide">
                Nova revisão
              </Link>
            </div>
            <StudioNav />
            <div className="st-sidebar-footer">
              <div className="st-sidebar-foot-label">Objetivo</div>
              <p>Dar aos professores uma ferramenta simples para validar qualidade, clareza e correção das perguntas.</p>
            </div>
          </nav>
          <main className="st-body">{children}</main>
        </div>
      ) : (
        <div className="st-shell">
          <main className="st-body" style={{ display: "flex", flex: 1 }}>
            {children}
          </main>
        </div>
      )}
    </div>
  );
}
