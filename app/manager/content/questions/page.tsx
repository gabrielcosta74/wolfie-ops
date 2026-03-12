import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { QuestionsDataTable } from "./questions-data-table";
import { Database, Target, Percent } from "lucide-react";
import "./catalog.css";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function ContentQuestionsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const difficulty = (params.dificuldade as string) || "";
  const subtemaId = (params.subtema as string) || "";
  const search = (params.q as string) || "";
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("quiz_perguntas")
    .select("id, pergunta, subtema_id, dificuldade, num_tentativas, taxa_acerto, opcao_a, opcao_b, opcao_c, opcao_d, opcao_correta, explicacao, created_at", { count: "exact" });

  if (difficulty) query = query.eq("dificuldade", difficulty);
  if (subtemaId) query = query.eq("subtema_id", Number(subtemaId));
  if (search) query = query.ilike("pergunta", `%${search}%`);

  query = query.order("created_at", { ascending: false }).range(offset, offset + PAGE_SIZE - 1);

  // Fetch subtemas for the filter dropdown
  const [questionsRes, subtemasRes] = await Promise.all([
    query,
    supabase.from("edu_subtemas_exame").select("id, nome, codigo").order("codigo"),
  ]);

  const questions = questionsRes.data || [];
  const totalCount = questionsRes.count || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const subtemas = subtemasRes.data || [];

  // Derived Top Analytics
  const avgAccuracy = questions.length 
    ? (questions.reduce((acc, q) => acc + Number(q.taxa_acerto), 0) / questions.length) * 100 
    : 0;

  let topSubtemaText = "N/A";
  if (questions.length > 0) {
     const counts: Record<number, number> = {};
     questions.forEach(q => counts[q.subtema_id] = (counts[q.subtema_id] || 0) + 1);
     const topId = parseInt(Object.keys(counts).reduce((a, b) => counts[parseInt(a)] > counts[parseInt(b)] ? a : b));
     topSubtemaText = subtemas.find(s => s.id === topId)?.nome || `ID ${topId}`;
  }

  return (
    <div className="qc-main">
      <header className="qc-header">
         <div className="qc-title-block">
            <h1>Catálogo de Currículo</h1>
            <p>Gestão e Auditoria do Banco de Perguntas</p>
         </div>

         <div className="qc-stats-row">
            <div className="qc-stat-box">
              <Database size={18} className="qc-icon blue" />
              <div>
                 <span className="qc-val">{totalCount.toLocaleString("pt-PT")}</span>
                 <span className="qc-lbl">Total Filtradas</span>
              </div>
            </div>
            <div className="qc-stat-box">
              <Percent size={18} className="qc-icon green" />
              <div>
                 <span className="qc-val">{avgAccuracy.toFixed(1)}%</span>
                 <span className="qc-lbl">Acerto Médio (Pág.)</span>
              </div>
            </div>
            <div className="qc-stat-box flex-grow">
              <Target size={18} className="qc-icon purple" />
              <div>
                 <span className="qc-val truncate">{topSubtemaText}</span>
                 <span className="qc-lbl">Subtema Dominante (Pág.)</span>
              </div>
            </div>
         </div>
      </header>

      <div className="qc-content-wrapper">
        <QuestionsDataTable
          questions={questions}
          subtemas={subtemas}
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalCount}
          activeFilters={{ difficulty, subtemaId, search }}
        />
      </div>
    </div>
  );
}
