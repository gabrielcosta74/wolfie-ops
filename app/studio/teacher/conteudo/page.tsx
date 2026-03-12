import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireTeacherUser } from "@/lib/studio-auth";

export default async function TeacherConteudoPage() {
  await requireTeacherUser();

  const supabase = getSupabaseAdmin();

  const { data: resources } = await supabase
    .from("edu_content_resources")
    .select("id, title, type, subtema_id, created_at, subtema:edu_subtemas_exame(nome)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <>
      <div className="st-page-header">
        <div>
          <h1 className="st-page-title">Conteúdo Educativo</h1>
          <p className="st-page-subtitle">Recursos publicados na plataforma</p>
        </div>
        <Link href="/studio/teacher/conteudo/novo" className="st-btn st-btn--primary">
          + Novo conteúdo
        </Link>
      </div>

      {!resources?.length ? (
        <div className="st-empty">
          <div className="st-empty-icon">📚</div>
          <p>Ainda não há conteúdo publicado. Sê o primeiro a contribuir!</p>
        </div>
      ) : (
        <div className="st-list">
          {resources.map((r) => (
            <div key={r.id} className="st-list-item">
              <div className="st-list-item-top">
                <div>
                  <h3 className="st-list-item-title">{r.title}</h3>
                  <div className="st-list-item-meta">
                    <span className={`st-badge st-badge--live`}>{r.type}</span>
                    {(r.subtema as unknown as { nome: string } | null)?.nome && (
                      <span>{(r.subtema as unknown as { nome: string }).nome}</span>
                    )}
                    <span>{new Date(r.created_at!).toLocaleDateString("pt-PT")}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
