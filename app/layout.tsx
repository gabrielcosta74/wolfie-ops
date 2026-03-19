import type { Metadata } from "next";
import { AdminShell } from "./AdminShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wolfi Ops | Monitorização e Cobertura",
  description: "Painel interno para acompanhar monitorização oficial, cobertura curricular e revisões semanais do Wolfi.",
  icons: {
    icon: "/wolf-mascot.png",
    shortcut: "/wolf-mascot.png",
    apple: "/wolf-mascot.png",
  },
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
