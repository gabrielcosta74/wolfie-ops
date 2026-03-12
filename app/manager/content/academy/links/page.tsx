import { getSupabaseAdmin } from "@/lib/supabase-admin";
import Link from "next/link";
import { Link2, Plus, Pencil, ExternalLink } from "lucide-react";
import { DeleteButton } from "../DeleteButton";

export const dynamic = "force-dynamic";

type ResourceRow = {
  id: number;
  subtema_id: number;
  title: string;
  type: string;
  video_url: string | null;
  markdown_content: string | null;
  author_credit: string | null;
  is_premium: boolean;
  created_at: string;
};

type SubtopicRow = {
  id: number;
  tema_id: number;
  nome: string;
};

type ThemeRow = {
  id: number;
  nome: string;
};

function getDomain(url: string | null): string {
  if (!url) return "";
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}


export default async function LinksPage() {
  const supabase = getSupabaseAdmin();

  const [resourcesRes, subtopicsRes, themesRes] = await Promise.all([
    supabase
      .from("edu_content_resources")
      .select("id, subtema_id, title, type, video_url, markdown_content, author_credit, is_premium, created_at")
      .eq("type", "link")
      .order("created_at", { ascending: false }),
    supabase.from("edu_subtemas_exame").select("id, tema_id, nome").order("ordem"),
    supabase.from("edu_temas_exame").select("id, nome").order("ordem"),
  ]);

  const resources = (resourcesRes.data ?? []) as ResourceRow[];
  const subtopics = (subtopicsRes.data ?? []) as SubtopicRow[];
  const themes = (themesRes.data ?? []) as ThemeRow[];

  const subtopicMap = new Map(subtopics.map((s) => [s.id, s]));
  const themeMap = new Map(themes.map((t) => [t.id, t]));

  return (
    <div className="ac-main">
      <div className="ac-page-header">
        <div>
          <h1 className="ac-page-title">Links</h1>
          <p className="ac-page-subtitle">
            {resources.length} link{resources.length !== 1 ? "s" : ""} adicionado{resources.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/manager/content/academy/links/novo" className="ac-btn ac-btn--primary">
          <Plus size={16} />
          Adicionar Link
        </Link>
      </div>

      {resources.length === 0 ? (
        <div className="ac-empty-state">
          <div className="ac-empty-state-icon">
            <Link2 size={26} />
          </div>
          <p className="ac-empty-state-title">Nenhum link ainda</p>
          <p className="ac-empty-state-text">
            Adiciona links úteis para os alunos — artigos, ferramentas, recursos externos.
          </p>
          <Link href="/manager/content/academy/links/novo" className="ac-btn ac-btn--primary">
            <Plus size={16} />
            Adicionar Link
          </Link>
        </div>
      ) : (
        <div className="ac-list">
          {resources.map((resource) => {
            const subtopic = subtopicMap.get(resource.subtema_id);
            const theme = subtopic ? themeMap.get(subtopic.tema_id) : null;
            const domain = getDomain(resource.video_url);

            return (
              <div key={resource.id} className="ac-item-card">
                <div className="ac-item-card-top">
                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        background: "var(--ac-green-bg)",
                        borderRadius: "var(--ac-r-sm)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--ac-green)",
                        flexShrink: 0,
                      }}
                    >
                      <ExternalLink size={16} />
                    </div>
                    <div className="ac-item-card-main">
                      <h3 className="ac-item-title">{resource.title}</h3>
                      {resource.markdown_content && (
                        <p className="ac-item-snippet">{resource.markdown_content}</p>
                      )}
                      <div className="ac-item-meta">
                        {domain && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              color: "var(--ac-green)",
                              fontSize: "12px",
                              fontWeight: 500,
                            }}
                          >
                            <Link2 size={11} />
                            {domain}
                          </span>
                        )}
                        {theme && (
                          <>
                            <span className="ac-item-meta-dot" />
                            <span>{theme.nome}</span>
                          </>
                        )}
                        {subtopic && (
                          <>
                            <span className="ac-item-meta-dot" />
                            <span>{subtopic.nome}</span>
                          </>
                        )}
                        {resource.author_credit && (
                          <>
                            <span className="ac-item-meta-dot" />
                            <span>{resource.author_credit}</span>
                          </>
                        )}
                        <span className="ac-item-meta-dot" />
                        <span>{formatDate(resource.created_at)}</span>
                        {resource.is_premium && (
                          <>
                            <span className="ac-item-meta-dot" />
                            <span className="ac-badge ac-badge--premium">Premium</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="ac-item-actions">
                    <Link
                      href={`/manager/content/academy/links/${resource.id}`}
                      className="ac-btn ac-btn--secondary ac-btn--sm"
                    >
                      <Pencil size={13} />
                      Editar
                    </Link>
                    <DeleteButton
                      id={resource.id}
                      redirectTo="/manager/content/academy/links"
                      confirmMessage="Tens a certeza que queres eliminar este link?"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
