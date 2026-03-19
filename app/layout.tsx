import type { Metadata } from "next";
import { AdminShell } from "./AdminShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wolfi Ops",
  description: "Painel interno de operações e gestão do Wolfi.",
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
