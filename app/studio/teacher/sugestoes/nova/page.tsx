import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireTeacherUser } from "@/lib/studio-auth";
import { MCQForm } from "../../perguntas/nova/MCQForm";

export default async function TeacherSuggestionPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const user = await requireTeacherUser();
  const params = await searchParams;
  const admin = getSupabaseAdmin();

  const { data: subtemas } = await admin
    .from("edu_subtemas_exame")
    .select("id, nome, tema:edu_temas_exame(nome)")
    .order("tema_id")
    .order("ordem");

  const subtemasOptions = (subtemas ?? []).map((s) => ({
    id: s.id,
    label: `${(s.tema as unknown as { nome: string } | null)?.nome ?? "—"} → ${s.nome}`,
  }));

  return (
    <div className="st-stack-lg">
      <div className="st-page-header">
        <div>
          <span className="st-page-kicker">Nova sugestão</span>
          <h1 className="st-page-title">Sugerir uma nova pergunta</h1>
          <p className="st-page-subtitle">
            Quando encontrares uma lacuna no banco, deixa aqui uma proposta nova em formato simples.
          </p>
        </div>
        <Link href="/studio/teacher/revisao" className="st-btn st-btn--secondary">
          Voltar à revisão
        </Link>
      </div>

      {params.success === "1" && (
        <div className="st-feedback success">Sugestão enviada com sucesso. Já podes submeter outra, se quiseres.</div>
      )}

      <div className="st-form-card">
        <MCQForm subtemas={subtemasOptions} email={user.email ?? ""} submitLabel="Enviar sugestão" />
      </div>
    </div>
  );
}
