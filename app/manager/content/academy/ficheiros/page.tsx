import { getSupabaseAdmin } from "@/lib/supabase-admin";
import Link from "next/link";
import { Paperclip, Plus, Pencil, FileText, Presentation, FileType2, File } from "lucide-react";
import { DeleteButton } from "../DeleteButton";

export const dynamic = "force-dynamic";

type ResourceRow = {
  id: number;
  subtema_id: number;
  title: string;
  type: string;
  video_url: string | null;
  video_provider: string | null;
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

function FileIcon({ type }: { type: string | null }) {
  if (type === "pdf") return <FileText size={16} />;
  if (type === "powerpoint") return <Presentation size={16} />;
  if (type === "word") return <FileType2 size={16} />;
  return <File size={16} />;
}

function fileTypeLabel(type: string | null): string {
  if (type === "pdf") return "PDF";
  if (type === "powerpoint") return "PowerPoint";
  if (type === "word") return "Word";
  return "Ficheiro";
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}


export default async function FicheirosPage() {
  const supabase = getSupabaseAdmin();

  const [resourcesRes, subtopicsRes, themesRes] = await Promise.all([
    supabase
      .from("edu_content_resources")
      .select("id, subtema_id, title, type, video_url, video_provider, author_credit, is_premium, created_at")
      .eq("type", "file")
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
          <h1 className="ac-page-title">Ficheiros</h1>
          <p className="ac-page-subtitle">
            {resources.length} ficheiro{resources.length !== 1 ? "s" : ""} adicionado{resources.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/manager/content/academy/ficheiros/novo" className="ac-btn ac-btn--primary">
          <Plus size={16} />
          Adicionar Ficheiro
        </Link>
      </div>

      {resources.length === 0 ? (
        <div className="ac-empty-state">
          <div className="ac-empty-state-icon">
            <Paperclip size={26} />
          </div>
          <p className="ac-empty-state-title">Nenhum ficheiro ainda</p>
          <p className="ac-empty-state-text">
            Partilha PDFs, apresentações e documentos Word com os alunos.
          </p>
          <Link href="/manager/content/academy/ficheiros/novo" className="ac-btn ac-btn--primary">
            <Plus size={16} />
            Adicionar Ficheiro
          </Link>
        </div>
      ) : (
        <div className="ac-list">
          {resources.map((resource) => {
            const subtopic = subtopicMap.get(resource.subtema_id);
            const theme = subtopic ? themeMap.get(subtopic.tema_id) : null;

            return (
              <div key={resource.id} className="ac-item-card">
                <div className="ac-item-card-top">
                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        background: "var(--ac-amber-bg)",
                        borderRadius: "var(--ac-r-sm)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--ac-amber)",
                        flexShrink: 0,
                      }}
                    >
                      <FileIcon type={resource.video_provider} />
                    </div>
                    <div className="ac-item-card-main">
                      <h3 className="ac-item-title">{resource.title}</h3>
                      <div className="ac-item-meta">
                        <span className="ac-badge ac-badge--file">
                          {fileTypeLabel(resource.video_provider)}
                        </span>
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
                      {resource.video_url && (
                        <div className="ac-url-text" style={{ marginTop: "6px", fontSize: "12px", color: "var(--ac-light)" }}>
                          {(() => {
                            try { return new URL(resource.video_url).hostname; } catch { return resource.video_url; }
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ac-item-actions">
                    <Link
                      href={`/manager/content/academy/ficheiros/${resource.id}`}
                      className="ac-btn ac-btn--secondary ac-btn--sm"
                    >
                      <Pencil size={13} />
                      Editar
                    </Link>
                    <DeleteButton
                      id={resource.id}
                      redirectTo="/manager/content/academy/ficheiros"
                      confirmMessage="Tens a certeza que queres eliminar este ficheiro?"
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
