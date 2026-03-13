"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ClipboardCheck, LayoutDashboard, LifeBuoy, Lightbulb } from "lucide-react";

const navGroups = [
  {
    label: "Trabalho",
    items: [
      { href: "/studio/teacher", label: "Hoje", icon: LayoutDashboard },
      { href: "/studio/teacher/revisao", label: "Rever perguntas", icon: ClipboardCheck },
      { href: "/studio/teacher/progresso", label: "Meu progresso", icon: BarChart3 },
    ],
  },
  {
    label: "Criar",
    items: [{ href: "/studio/teacher/sugestoes/nova", label: "Nova sugestão", icon: Lightbulb }],
  },
  {
    label: "Ajuda",
    items: [{ href: "/studio/teacher/flags", label: "Sinalizar problema", icon: LifeBuoy }],
  },
];

export function StudioNav() {
  const pathname = usePathname();

  return (
    <div className="st-nav">
      {navGroups.map((group) => (
        <div key={group.label} className="st-nav-group">
          <div className="st-nav-group-label">{group.label}</div>
          {group.items.map((item) => {
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
      ))}
    </div>
  );
}
