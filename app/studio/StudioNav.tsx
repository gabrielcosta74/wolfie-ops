"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, HelpCircle, Flag } from "lucide-react";

const navItems = [
  { href: "/studio/teacher", label: "Dashboard", icon: LayoutDashboard },
  { href: "/studio/teacher/conteudo", label: "Conteúdo", icon: BookOpen },
  { href: "/studio/teacher/perguntas", label: "Perguntas", icon: HelpCircle },
  { href: "/studio/teacher/flags", label: "Sinalizar erro", icon: Flag },
];

export function StudioNav() {
  const pathname = usePathname();

  return (
    <div className="st-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || (item.href !== "/studio/teacher" && pathname.startsWith(item.href));

        return (
          <Link key={item.href} href={item.href} className={`st-nav-item${active ? " active" : ""}`}>
            <Icon className="st-nav-icon" size={18} />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
