import { getSupabaseAdmin } from "@/lib/supabase-admin";
import Link from "next/link";
import { BookOpen, Plus, Pencil } from "lucide-react";
import { DeleteButton } from "../DeleteButton";

export const dynamic = "force-dynamic";

type ResourceRow = {
  id: number;
  subtema_id: number;
  title: string;
  type: string;
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

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}


export default async function ResumosPage() {
  const supabase = getSupabaseAdmin();

  const [resourcesRes, subtopicsRes, themesRes] = await Promise.all([
    supabase
      .from("edu_content_resources")
      .select("id, subtema_id, title, type, markdown_content, author_credit, is_premium, created_at")
      .eq("type", "summary")
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
          <h1 className="ac-page-title">Resumos</h1>
          <p className="ac-page-subtitle">
            {resources.length} resumo{resources.length !== 1 ? "s" : ""} criado{resources.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/manager/content/academy/resumos/novo" className="ac-btn ac-btn--primary">
          <Plus size={16} />
          Novo Resumo
        </Link>
      </div>

      {resources.length === 0 ? (
        <div className="ac-empty-state">
          <div className="ac-empty-state-icon">
            <BookOpen size={26} />
          </div>
          <p className="ac-empty-state-title">Nenhum resumo ainda</p>
          <p className="ac-empty-state-text">
            Cria o teu primeiro resumo com o editor de texto rico.
          </p>
          <Link href="/manager/content/academy/resumos/novo" className="ac-btn ac-btn--primary">
            <Plus size={16} />
            Criar Resumo
          </Link>
        </div>
      ) : (
        <div className="ac-list">
          {resources.map((resource) => {
            const subtopic = subtopicMap.get(resource.subtema_id);
            const theme = subtopic ? themeMap.get(subtopic.tema_id) : null;
            const snippet = resource.markdown_content ? stripHtml(resource.markdown_content) : "";

            return (
              <div key={resource.id} className="ac-item-card">
                <div className="ac-item-card-top">
                  <div className="ac-item-card-main">
                    <h3 className="ac-item-title">{resource.title}</h3>
                    {snippet && (
                      <p className="ac-item-snippet">{snippet}{snippet.length >= 120 ? "…" : ""}</p>
                    )}
                    <div className="ac-item-meta">
                      {theme && (
                        <span>{theme.nome}</span>
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
                  <div className="ac-item-actions">
                    <Link
                      href={`/manager/content/academy/resumos/${resource.id}`}
                      className="ac-btn ac-btn--secondary ac-btn--sm"
                    >
                      <Pencil size={13} />
                      Editar
                    </Link>
                    <DeleteButton
                      id={resource.id}
                      redirectTo="/manager/content/academy/resumos"
                      confirmMessage="Tens a certeza que queres eliminar este resumo?"
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
