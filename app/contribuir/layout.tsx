import type { Metadata } from "next";
import "./contribuir.css";

export const metadata: Metadata = {
  title: "Contribuir | Wolfie",
  description: "Sugere vídeos, resumos ou exercícios para ajudar outros alunos a prepararem-se para o exame de Matemática A.",
};

export default function ContribuirLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="contribuir-portal">
      <header className="ct-header">
        <div className="ct-header-inner">
          <div className="ct-logo">W</div>
          <div>
            <div className="ct-header-title">Wolfie</div>
            <div className="ct-header-sub">Contribuir</div>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
