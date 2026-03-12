import { getSupabaseAdmin } from "@/lib/supabase-admin";
import Link from "next/link";
import { BookOpen, Video, Paperclip, Link2, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

type ResourceRow = {
  id: number;
  subtema_id: number;
  title: string;
  type: string;
  created_at: string;
  is_premium: boolean;
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
}

function typeBadge(type: string) {
  const map: Record<string, { label: string; cls: string }> = {
    summary: { label: "Resumo", cls: "ac-badge--summary" },
    video: { label: "Vídeo", cls: "ac-badge--video" },
    file: { label: "Ficheiro", cls: "ac-badge--file" },
    link: { label: "Link", cls: "ac-badge--link" },
  };
  return map[type] ?? { label: type, cls: "ac-badge--summary" };
}

export default async function AcademyDashboardPage() {
  const supabase = getSupabaseAdmin();

  const { data: resources } = await supabase
    .from("edu_content_resources")
    .select("id, subtema_id, title, type, created_at, is_premium")
    .order("created_at", { ascending: false });

  const all = (resources ?? []) as ResourceRow[];

  const counts = {
    summary: all.filter((r) => r.type === "summary").length,
    video: all.filter((r) => r.type === "video").length,
    file: all.filter((r) => r.type === "file").length,
    link: all.filter((r) => r.type === "link").length,
  };

  const recent = all.slice(0, 8);

  const cards = [
    {
      type: "summary",
      label: "Resumos",
      count: counts.summary,
      icon: BookOpen,
      href: "/manager/content/academy/resumos",
      newHref: "/manager/content/academy/resumos/novo",
    },
    {
      type: "video",
      label: "Vídeos",
      count: counts.video,
      icon: Video,
      href: "/manager/content/academy/videos",
      newHref: "/manager/content/academy/videos/novo",
    },
    {
      type: "file",
      label: "Ficheiros",
      count: counts.file,
      icon: Paperclip,
      href: "/manager/content/academy/ficheiros",
      newHref: "/manager/content/academy/ficheiros/novo",
    },
    {
      type: "link",
      label: "Links",
      count: counts.link,
      icon: Link2,
      href: "/manager/content/academy/links",
      newHref: "/manager/content/academy/links/novo",
    },
  ];

  return (
    <div className="ac-main">
      <div className="ac-page-header">
        <div>
          <h1 className="ac-page-title">Início</h1>
          <p className="ac-page-subtitle">Visão geral do portal de conteúdo educativo</p>
        </div>
      </div>

      <div className="ac-dash-grid">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.type} className="ac-dash-card">
              <div className="ac-dash-card-icon">
                <Icon size={22} />
              </div>
              <div>
                <div className="ac-dash-card-count">{card.count}</div>
                <div className="ac-dash-card-label">{card.label}</div>
              </div>
              <div className="ac-dash-card-actions">
                <Link href={card.href} className="ac-dash-card-cta">
                  Ver todos
                </Link>
                <Link href={card.newHref} className="ac-dash-card-cta" style={{ marginLeft: "auto" }}>
                  + Criar
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="ac-recent-section">
        <div className="ac-recent-header">
          <h2 className="ac-recent-title">Conteúdo recente</h2>
          <span style={{ fontSize: "13px", color: "var(--ac-muted)" }}>{all.length} itens no total</span>
        </div>
        {recent.length === 0 ? (
          <div className="ac-empty-state" style={{ padding: "40px 24px" }}>
            <div className="ac-empty-state-icon">
              <BookOpen size={24} />
            </div>
            <p className="ac-empty-state-title">Nenhum conteúdo ainda</p>
            <p className="ac-empty-state-text">Começa por criar um resumo, vídeo, ficheiro ou link.</p>
          </div>
        ) : (
          recent.map((item) => {
            const badge = typeBadge(item.type);
            const editHref =
              item.type === "summary"
                ? `/manager/content/academy/resumos/${item.id}`
                : item.type === "video"
                  ? `/manager/content/academy/videos/${item.id}`
                  : item.type === "file"
                    ? `/manager/content/academy/ficheiros/${item.id}`
                    : `/manager/content/academy/links/${item.id}`;

            return (
              <div key={item.id} className="ac-recent-item">
                <div className="ac-recent-item-info">
                  <div className="ac-recent-item-title">{item.title}</div>
                  <div className="ac-recent-item-meta">
                    <span className={`ac-badge ${badge.cls}`}>{badge.label}</span>
                    {item.is_premium && (
                      <span className="ac-badge ac-badge--premium">Premium</span>
                    )}
                  </div>
                </div>
                <span className="ac-recent-item-date">{formatDate(item.created_at)}</span>
                <Link href={editHref} className="ac-btn ac-btn--ghost ac-btn--sm">
                  Editar
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
