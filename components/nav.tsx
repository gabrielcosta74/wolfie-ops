"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, History, Calendar, Settings, Database, LayoutDashboard, DollarSign, Users, BarChart3, Bot, FileText, Cpu, BookOpenCheck, CheckCircle } from "lucide-react";

type NavItem = { href: string; label: string; badge?: number; badgeColor?: string; icon: React.ReactNode; group: string };

const items: NavItem[] = [
  { group: "Curadoria Editorial", href: "/inbox", label: "Inbox", icon: <Inbox size={16} /> },
  { group: "Curadoria Editorial", href: "/reviews", label: "Revisões", icon: <History size={16} /> },
  { group: "Curadoria Editorial", href: "/schedule", label: "Calendário", icon: <Calendar size={16} /> },
  { group: "Curadoria Editorial", href: "/manager/agents-workflow", label: "Workflow AI", icon: <Cpu size={16} /> },
  { group: "Wolfie Manager", href: "/manager", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
  { group: "Wolfie Manager", href: "/manager/content/questions", label: "Perguntas", icon: <Database size={16} /> },
  { group: "Wolfie Manager", href: "/manager/content/academy", label: "Conteúdo Educativo", icon: <BookOpenCheck size={16} /> },
  { group: "Wolfie Manager", href: "/manager/exams", label: "Exames", icon: <FileText size={16} /> },
  { group: "Wolfie Manager", href: "/manager/approvals", label: "Aprovações", icon: <CheckCircle size={16} /> },
  { group: "Wolfie Manager", href: "/manager/users", label: "Utilizadores", icon: <Users size={16} /> },
  { group: "Wolfie Manager", href: "/manager/teachers", label: "Professores", icon: <Users size={16} /> },
  { group: "Wolfie Manager", href: "/manager/analytics", label: "Analytics", icon: <BarChart3 size={16} /> },
  { group: "Financeiro", href: "/manager/financials", label: "P&L Overview", icon: <DollarSign size={16} /> },
  { group: "Financeiro", href: "/manager/financials/pricing", label: "Pricing & Limits", icon: <Settings size={16} /> },
  { group: "Financeiro", href: "/manager/financials/scenarios", label: "Scenario Simulator", icon: <BarChart3 size={16} /> },
  { group: "Financeiro", href: "/manager/financials/users", label: "Custo / User", icon: <Users size={16} /> },
  { group: "Financeiro", href: "/manager/financials/tokens", label: "Token Analytics", icon: <BarChart3 size={16} /> },
  { group: "Financeiro", href: "/manager/financials/agents", label: "Agent Costs", icon: <Bot size={16} /> },
  { group: "Técnico", href: "/system", label: "Sistema", icon: <Settings size={16} /> },
];

export function MainNav() {
  const pathname = usePathname();
  const groups = Array.from(new Set(items.map((i) => i.group)));

  return (
    <nav className="ops-nav-tree" aria-label="Primary">
      {groups.map((group) => (
        <div key={group} className="ops-nav-group">
          <h4 className="ops-nav-group-title">{group}</h4>
          <div className="ops-nav-items">
            {items
              .filter((i) => i.group === group)
              .map((item) => {
                const active = pathname === item.href;

                return (
                  <Link key={item.href} href={item.href} data-active={active ? "true" : "false"} className="ops-nav-link">
                    <div className="ops-nav-label-group">
                      <span className="ops-nav-icon">{item.icon}</span>
                      <span className="ops-nav-label">{item.label}</span>
                    </div>
                    {item.badge ? (
                      <span className="ops-nav-badge" style={item.badgeColor ? { backgroundColor: item.badgeColor, color: "#fff" } : {}}>
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
          </div>
        </div>
      ))}
    </nav>
  );
}
