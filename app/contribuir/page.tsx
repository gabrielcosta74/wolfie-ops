import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { ContribuirForm } from "./ContribuirForm";

export default async function ContribuirPage() {
  const supabase = getSupabaseAdmin();

  const { data: subtemas } = await supabase
    .from("edu_subtemas_exame")
    .select("id, nome, tema:edu_temas_exame(nome)")
    .order("tema_id")
    .order("ordem");

  const subtemasOptions = (subtemas ?? []).map((s) => ({
    id: s.id,
    label: `${(s.tema as unknown as { nome: string } | null)?.nome ?? "—"} → ${s.nome}`,
  }));

  return (
    <main className="ct-main">
      <div className="ct-hero">
        <div className="ct-hero-icon">🎓</div>
        <h1>Ajuda-nos a melhorar o Wolfie</h1>
        <p>
          Conheces um bom vídeo, resumo ou exercício de Matemática A?
          Envia a tua sugestão e ajuda milhares de alunos.
        </p>
      </div>

      <div className="ct-card">
        <ContribuirForm subtemas={subtemasOptions} />
      </div>

      <footer className="ct-footer">
        Wolfie © {new Date().getFullYear()} · <a href="/">Voltar ao início</a>
      </footer>
    </main>
  );
}
