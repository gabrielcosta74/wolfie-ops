import type { Metadata } from "next";
import "./contribuir.css";

export const metadata: Metadata = {
  title: "Contribui para o Wolfi",
  description:
    "Partilha vídeos, resumos, exercícios e recursos úteis para ajudar outros alunos a prepararem-se para o exame.",
};

export default function ContribuirLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="ct-root">{children}</div>;
}
