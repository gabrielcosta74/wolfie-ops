import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireTeacherUser } from "@/lib/studio-auth";

export default async function EditPerguntaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireTeacherUser();

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: pergunta } = await supabase
    .from("quiz_perguntas")
    .select("*, subtema:edu_subtemas_exame(nome)")
    .eq("id", id)
    .single();

  if (!pergunta) return notFound();

  const statusClass = pergunta.status === "live" ? "live" : pergunta.status === "rejected" ? "rejected" : "pending";

  return (
    <>
      <div className="st-page-header">
        <div>
          <h1 className="st-page-title">Detalhes da pergunta</h1>
          <p className="st-page-subtitle">
            <span className={`st-badge st-badge--${statusClass}`}>{pergunta.status ?? "pending"}</span>
          </p>
        </div>
        <Link href="/studio/teacher/perguntas" className="st-btn st-btn--secondary st-btn--sm">
          ← Voltar
        </Link>
      </div>

      <div className="st-form-card">
        <div className="st-form" style={{ gap: 16 }}>
          <div className="st-field">
            <span className="st-label">Pergunta</span>
            <p style={{ margin: 0, lineHeight: 1.6 }}>{pergunta.pergunta}</p>
          </div>

          <div className="st-field-row">
            <div className="st-field">
              <span className="st-label">A</span>
              <p style={{ margin: 0, fontWeight: pergunta.opcao_correta === "A" ? 700 : 400, color: pergunta.opcao_correta === "A" ? "#059669" : "inherit" }}>
                {pergunta.opcao_correta === "A" && "✓ "}{pergunta.opcao_a}
              </p>
            </div>
            <div className="st-field">
              <span className="st-label">B</span>
              <p style={{ margin: 0, fontWeight: pergunta.opcao_correta === "B" ? 700 : 400, color: pergunta.opcao_correta === "B" ? "#059669" : "inherit" }}>
                {pergunta.opcao_correta === "B" && "✓ "}{pergunta.opcao_b}
              </p>
            </div>
          </div>

          <div className="st-field-row">
            <div className="st-field">
              <span className="st-label">C</span>
              <p style={{ margin: 0, fontWeight: pergunta.opcao_correta === "C" ? 700 : 400, color: pergunta.opcao_correta === "C" ? "#059669" : "inherit" }}>
                {pergunta.opcao_correta === "C" && "✓ "}{pergunta.opcao_c}
              </p>
            </div>
            <div className="st-field">
              <span className="st-label">D</span>
              <p style={{ margin: 0, fontWeight: pergunta.opcao_correta === "D" ? 700 : 400, color: pergunta.opcao_correta === "D" ? "#059669" : "inherit" }}>
                {pergunta.opcao_correta === "D" && "✓ "}{pergunta.opcao_d}
              </p>
            </div>
          </div>

          <div className="st-field">
            <span className="st-label">Explicação</span>
            <p style={{ margin: 0, lineHeight: 1.6 }}>{pergunta.explicacao}</p>
          </div>

          <div className="st-field-row">
            <div className="st-field">
              <span className="st-label">Subtema</span>
              <p style={{ margin: 0 }}>{(pergunta.subtema as unknown as { nome: string } | null)?.nome ?? "—"}</p>
            </div>
            <div className="st-field">
              <span className="st-label">Dificuldade</span>
              <p style={{ margin: 0 }}>{pergunta.dificuldade}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
