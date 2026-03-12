"use client";

import Link from "next/link";
import { Sparkles, Layers, BookOpen, Clock } from "lucide-react";

type MinimalPackage = {
  id: string;
  title: string;
  category: "curricular" | "operational" | "editorial" | string;
  problem: string;
};

function CategoryIcon({ category }: { category: string }) {
  if (category === "curricular") return <Layers size={15} style={{ color: "var(--accent)" }} />;
  if (category === "operational") return <BookOpen size={15} style={{ color: "var(--warning)" }} />;
  return <Sparkles size={15} style={{ color: "var(--success)" }} />;
}

function categoryLabel(category: string) {
  if (category === "curricular") return "Caso Curricular";
  if (category === "operational") return "Caso Operacional";
  return "Editorial Legado";
}

export function InboxFeed({ packages }: { packages: MinimalPackage[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid var(--border)" }}>
      {packages.map((pkg) => (
        <Link 
          key={pkg.id} 
          href={`/${pkg.id}`}
          className="inbox-row-hover"
          style={{ 
             display: "grid",
             gridTemplateColumns: "180px 1fr 60px",
             gap: 24,
             alignItems: "center",
             padding: "16px 20px",
             borderBottom: "1px solid var(--border)", 
             textDecoration: "none",
             color: "inherit",
             transition: "background 0.15s ease",
           }}
        >
          {/* Col 1: Category Tag */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", fontWeight: 600, color: "var(--fg-muted)" }}>
             <CategoryIcon category={pkg.category} />
             <span>{categoryLabel(pkg.category)}</span>
          </div>

          {/* Col 2: Title & Excerpt */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
             <div style={{ display: "flex", alignItems: "baseline", gap: 8, overflow: "hidden" }}>
               <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "40%" }}>
                 {pkg.title}
               </span>
               <span style={{ fontSize: "0.95rem", color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                 <span style={{ color: "var(--border-strong)", margin: "0 4px" }}>—</span>
                 {pkg.problem}
               </span>
             </div>
          </div>

          {/* Col 3: Time or Status */}
          <div style={{ display: "flex", justifyContent: "flex-end", color: "var(--muted)", fontSize: "0.8rem", fontWeight: 500 }}>
             <Clock size={14} style={{ marginRight: 6 }} />
             Rever
          </div>
        </Link>
      ))}
    </div>
  );
}
