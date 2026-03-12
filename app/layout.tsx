import type { Metadata } from "next";
import { AdminShell } from "./AdminShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wolfie Ops | Monitorização e Cobertura",
  description: "Painel interno para acompanhar monitorização oficial, cobertura curricular e revisões semanais do Wolfie.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT">
      <body>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
