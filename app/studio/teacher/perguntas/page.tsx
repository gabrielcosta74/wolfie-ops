import Link from "next/link";
import { MathText } from "@/components/math-text";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireTeacherUser } from "@/lib/studio-auth";

export default async function TeacherPerguntasPage() {
  await requireTeacherUser();

  const supabase = getSupabaseAdmin();

  const { data: perguntas } = await supabase
    .from("quiz_perguntas")
    .select("id, pergunta, subtema_id, dificuldade, status, source, created_at, subtema:edu_subtemas_exame(nome)")
    .eq("source", "teacher")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <>
      <div className="st-page-header">
        <div>
          <h1 className="st-page-title">Perguntas MCQ</h1>
          <p className="st-page-subtitle">Perguntas de escolha múltipla submetidas por professores</p>
        </div>
        <Link href="/studio/teacher/perguntas/nova" className="st-btn st-btn--primary">
          + Nova pergunta
        </Link>
      </div>

      {!perguntas?.length ? (
        <div className="st-empty">
          <div className="st-empty-icon">?</div>
          <p>Ainda não foram submetidas perguntas MCQ.</p>
        </div>
      ) : (
        <div className="st-list">
          {perguntas.map((pergunta) => {
            const statusClass =
              pergunta.status === "live" ? "live" : pergunta.status === "rejected" ? "rejected" : "pending";

            return (
              <Link
                key={pergunta.id}
                href={`/studio/teacher/perguntas/${pergunta.id}`}
                className="st-list-item"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className="st-list-item-top">
                  <div>
                    <h3 className="st-list-item-title">
                      <MathText
                        text={`${pergunta.pergunta.substring(0, 120)}${pergunta.pergunta.length > 120 ? "..." : ""}`}
                      />
                    </h3>
                    <div className="st-list-item-meta">
                      <span className={`st-badge st-badge--${statusClass}`}>{pergunta.status ?? "pending"}</span>
                      {(pergunta.subtema as unknown as { nome: string } | null)?.nome && (
                        <span>{(pergunta.subtema as unknown as { nome: string }).nome}</span>
                      )}
                      <span>{pergunta.dificuldade}</span>
                      <span>{new Date(pergunta.created_at!).toLocaleDateString("pt-PT")}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
