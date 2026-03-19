"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  Inbox, History, Calendar, Settings, Database, LayoutDashboard, 
  DollarSign, Users, BarChart3, Bot, FileText, Cpu, BookOpenCheck, 
  CheckCircle, ChevronDown, ChevronRight 
} from "lucide-react";

type NavItem = { href: string; label: string; badge?: number; badgeColor?: string; icon: React.ReactNode; group: string };

const items: NavItem[] = [
  { group: "Curadoria Editorial", href: "/inbox", label: "Inbox", icon: <Inbox size={16} /> },
  { group: "Curadoria Editorial", href: "/reviews", label: "Revisões", icon: <History size={16} /> },
  { group: "Curadoria Editorial", href: "/schedule", label: "Calendário", icon: <Calendar size={16} /> },
  { group: "Curadoria Editorial", href: "/manager/agents-workflow", label: "Workflow AI", icon: <Cpu size={16} /> },
  { group: "Wolfi Manager", href: "/manager", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
  { group: "Wolfi Manager", href: "/manager/content/questions", label: "Perguntas", icon: <Database size={16} /> },
  { group: "Wolfi Manager", href: "/manager/content/academy", label: "Conteúdo Educativo", icon: <BookOpenCheck size={16} /> },
  { group: "Wolfi Manager", href: "/manager/exams", label: "Exames", icon: <FileText size={16} /> },
  { group: "Wolfi Manager", href: "/manager/approvals", label: "Aprovações", icon: <CheckCircle size={16} /> },
  { group: "Wolfi Manager", href: "/manager/users", label: "Utilizadores", icon: <Users size={16} /> },
  { group: "Wolfi Manager", href: "/manager/teachers", label: "Professores", icon: <Users size={16} /> },
  { group: "Wolfi Manager", href: "/manager/analytics", label: "Analytics", icon: <BarChart3 size={16} /> },
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
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Auto-open group based on current pathname
  useEffect(() => {
    // Determine the active group by matching the path
    const activeGroup = items.find((i) => 
      pathname === i.href || (i.href !== "/manager" && i.href !== "/inbox" && pathname.startsWith(i.href))
    )?.group;
    
    if (activeGroup) {
      setOpenGroups(prev => ({ ...prev, [activeGroup]: true }));
    }
  }, [pathname]);

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  return (
    <nav className="ops-nav-tree space-y-4" aria-label="Primary">
      {groups.map((group) => {
        // We can default all groups to false (closed), relying on the useEffect to open the active one.
        // However, if we want the first render to not be fully collapsed if it's SSR, we might check it directly on render too.
        // Let's check on render to avoid layout shift over useEffect.
        const isActiveGroup = items.some((i) => 
          i.group === group && (pathname === i.href || (i.href !== "/manager" && i.href !== "/inbox" && pathname.startsWith(i.href)))
        );
        
        // Use state, but default to true if it corresponds to the active route, otherwise use whatever is in state or false.
        const isOpen = openGroups[group] !== undefined ? openGroups[group] : isActiveGroup;

        return (
          <div key={group} className="ops-nav-group flex flex-col gap-1">
            <button 
              className="flex items-center justify-between w-full cursor-pointer py-1 hover:bg-slate-100/50 rounded-lg pr-2 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-slate-300"
              onClick={() => toggleGroup(group)}
            >
              <h4 className="ops-nav-group-title !mb-0">{group}</h4>
              <span className="text-slate-400">
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
            </button>
            
            {isOpen && (
              <div className="ops-nav-items animate-in slide-in-from-top-1 fade-in duration-200">
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
            )}
          </div>
        );
      })}
    </nav>
  );
}
