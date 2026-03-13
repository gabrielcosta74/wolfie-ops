import Link from "next/link";
import { notFound } from "next/navigation";
import { MathText } from "@/components/math-text";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireTeacherUser } from "@/lib/studio-auth";

function OptionBlock({
  optionKey,
  value,
  isCorrect,
}: {
  optionKey: string;
  value: string;
  isCorrect: boolean;
}) {
  return (
    <div className="st-field">
      <span className="st-label">{optionKey}</span>
      <div
        style={{
          margin: 0,
          fontWeight: isCorrect ? 700 : 400,
          color: isCorrect ? "#059669" : "inherit",
          lineHeight: 1.8,
        }}
      >
        {isCorrect && <span style={{ marginRight: 6 }}>✓</span>}
        <MathText text={value} />
      </div>
    </div>
  );
}

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
            <div style={{ margin: 0, lineHeight: 1.8 }}>
              <MathText text={pergunta.pergunta} />
            </div>
          </div>

          <div className="st-field-row">
            <OptionBlock optionKey="A" value={pergunta.opcao_a} isCorrect={pergunta.opcao_correta === "A"} />
            <OptionBlock optionKey="B" value={pergunta.opcao_b} isCorrect={pergunta.opcao_correta === "B"} />
          </div>

          <div className="st-field-row">
            <OptionBlock optionKey="C" value={pergunta.opcao_c} isCorrect={pergunta.opcao_correta === "C"} />
            <OptionBlock optionKey="D" value={pergunta.opcao_d} isCorrect={pergunta.opcao_correta === "D"} />
          </div>

          <div className="st-field">
            <span className="st-label">Explicação</span>
            <div style={{ margin: 0, lineHeight: 1.8 }}>
              <MathText text={pergunta.explicacao} />
            </div>
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
