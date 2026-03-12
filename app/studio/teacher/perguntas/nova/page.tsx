import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireTeacherUser } from "@/lib/studio-auth";
import { MCQForm } from "./MCQForm";

export default async function NovaPerguntaPage() {
  const user = await requireTeacherUser();

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
    <>
      <div className="st-page-header">
        <div>
          <h1 className="st-page-title">Nova pergunta MCQ</h1>
          <p className="st-page-subtitle">Submete uma pergunta de escolha múltipla para revisão.</p>
        </div>
      </div>

      <div className="st-form-card">
        <MCQForm subtemas={subtemasOptions} email={user.email ?? ""} />
      </div>
    </>
  );
}
