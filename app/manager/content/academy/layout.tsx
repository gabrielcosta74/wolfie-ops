import "./academy.css";
import { AcademyNav } from "./AcademyNav";

export default function AcademyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ac-portal">
      <header className="ac-portal-header">
        <div className="ac-portal-brand">
          <div className="ac-portal-logo">W</div>
          <div>
            <span className="ac-portal-name">Wolfi Academy</span>
            <span className="ac-portal-sub">Portal de Conteúdo</span>
          </div>
        </div>
      </header>
      <div className="ac-shell">
        <nav className="ac-sidebar">
          <AcademyNav />
        </nav>
        <div className="ac-body">{children}</div>
      </div>
    </div>
  );
}
