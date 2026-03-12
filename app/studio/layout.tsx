import type { Metadata } from "next";
import { getStudioSession } from "@/lib/studio-auth";
import { StudioNav } from "./StudioNav";
import "./studio.css";

export const metadata: Metadata = {
  title: "Wolfie Studio | Portal do Professor",
  description: "Portal para professores publicarem conteúdo, criarem perguntas e sinalizarem erros.",
};

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const { user, role } = await getStudioSession();
  const isTeacher = role === "teacher";

  return (
    <div className="studio-portal">
      <header className="st-header">
        <div className="st-header-brand">
          <div className="st-logo">W</div>
          <div>
            <div className="st-header-name">Wolfie Studio</div>
            <div className="st-header-sub">Portal do Professor</div>
          </div>
        </div>
        {user && (
          <div className="st-header-actions">
            <span className="st-header-email">{user.email}</span>
            <form action="/studio/logout" method="POST">
              <button type="submit" className="st-logout-btn">Sair</button>
            </form>
          </div>
        )}
      </header>

      {isTeacher ? (
        <div className="st-shell">
          <nav className="st-sidebar">
            <StudioNav />
          </nav>
          <main className="st-body">{children}</main>
        </div>
      ) : (
        <div className="st-shell">
          <main className="st-body" style={{ display: "flex", flex: 1 }}>{children}</main>
        </div>
      )}
    </div>
  );
}
