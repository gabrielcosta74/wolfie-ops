import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { ContribuirForm } from "./ContribuirForm";
import secondarySchools from "./secondary-schools.json";

export default async function ContribuirPage() {
  const supabase = getSupabaseAdmin();

  const { data: subtemas } = await supabase
    .from("edu_subtemas_exame")
    .select("id, nome, tema:edu_temas_exame(nome)")
    .order("tema_id")
    .order("ordem");

  const subtemasOptions = (subtemas ?? []).map((subtema) => ({
    id: subtema.id,
    label: `${(subtema.tema as unknown as { nome: string } | null)?.nome ?? "Geral"} - ${subtema.nome}`,
  }));

  return (
    <main className="ct-main">
      <section className="ct-shell">
        <div className="ct-intro">
          <p className="ct-eyebrow">Contribuir</p>
          <h1>Partilha um recurso util em segundos.</h1>
          <p className="ct-lead">
            O objetivo desta pagina e ser super pratica no telemovel: escolhes o formato, juntas um link ou um ficheiro
            e envias.
          </p>

          <div className="ct-highlight-list">
            <div className="ct-highlight">
              <strong>Rapido de usar</strong>
              <span>O fluxo foi reduzido ao essencial para submeter em menos de um minuto.</span>
            </div>
            <div className="ct-highlight">
              <strong>Link ou ficheiro</strong>
              <span>Podes enviar um URL, anexos ou ambos no mesmo contributo.</span>
            </div>
            <div className="ct-highlight">
              <strong>Revisao interna</strong>
              <span>A equipa revê tudo antes de publicar ou aproveitar o material.</span>
            </div>
          </div>
        </div>

        <div className="ct-card">
          <ContribuirForm subtemas={subtemasOptions} schools={secondarySchools} />
        </div>
      </section>

      <footer className="ct-footer">
        Wolfie © {new Date().getFullYear()} · <a href="/">Voltar ao inicio</a>
      </footer>
    </main>
  );
}
