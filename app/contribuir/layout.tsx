import type { Metadata } from "next";
import "./contribuir.css";

export const metadata: Metadata = {
  title: "Wolfi | Contribuir",
  description: "Junta-te à comunidade Wolfi e partilha materiais de estudo.",
};

export default function ContribuirLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="ct-root">{children}</div>;
}
