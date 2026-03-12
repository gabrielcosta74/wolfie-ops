import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireTeacherUser } from "@/lib/studio-auth";
import { NewContentForm } from "./NewContentForm";

export default async function NovoConteudoPage() {
  await requireTeacherUser();

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
          <h1 className="st-page-title">Novo conteúdo</h1>
          <p className="st-page-subtitle">Adiciona um vídeo, resumo ou exercício para os alunos.</p>
        </div>
      </div>

      <div className="st-form-card">
        <NewContentForm subtemas={subtemasOptions} />
      </div>
    </>
  );
}
