import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { FileText, Award, Hash, ChevronRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ExamsPage() {
  const supabase = getSupabaseAdmin();

  // Fetch summary data for all exams
  const { data: questionsRes } = await supabase
    .from("exame_nacional_questions")
    .select("exam_year, exam_phase, cotacao");

  const questions = questionsRes || [];
  
  // Group by exam
  const examMap = new Map<string, { year: number, phase: number, count: number, totalCotacao: number }>();
  
  for (const q of questions) {
    const key = `${q.exam_year}-${q.exam_phase}`;
    if (!examMap.has(key)) {
      examMap.set(key, { year: q.exam_year, phase: q.exam_phase, count: 0, totalCotacao: 0 });
    }
    const stat = examMap.get(key)!;
    stat.count++;
    stat.totalCotacao += q.cotacao || 0;
  }

  const exams = Array.from(examMap.values()).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.phase - a.phase; // Phase 2 first, then 1 
  });

  const totalCount = questions.length;
  const distinctExams = exams.length;
  const totalCotacao = exams.reduce((acc, ex) => acc + ex.totalCotacao, 0);

  const stats = [
    { label: "Exames Disponíveis", value: distinctExams.toString(), icon: <FileText size={18} />, color: "var(--info)" },
    { label: "Total de Questões", value: totalCount.toString(), icon: <Hash size={18} />, color: "var(--accent)" },
    { label: "Cotação Acumulada", value: `${totalCotacao} pts`, icon: <Award size={18} />, color: "var(--warning)" },
  ];

  return (
    <div style={{ padding: "48px 48px", maxWidth: 1400, margin: "0 auto", width: "100%" }}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>
          Catálogo de Exames
        </h1>
        <p style={{ fontSize: "1.05rem", color: "var(--muted)" }}>
          Todos os exames nacionais de Matemática A guardados na plataforma e prontos para uso.
        </p>
      </header>

      {/* Mini KPIs */}
      <div style={{ display: "flex", gap: 16, marginBottom: 36 }}>
        {stats.map(s => (
          <div key={s.label} className="panel pad" style={{ display: "flex", gap: 12, alignItems: "center", padding: "14px 20px" }}>
            <span style={{ color: s.color, opacity: 0.7 }}>{s.icon}</span>
            <div>
              <span style={{ fontSize: "1.4rem", fontWeight: 800 }}>{s.value}</span>
              <span style={{ fontSize: "0.8rem", color: "var(--muted)", marginLeft: 8 }}>{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 20 }}>Exames Disponíveis</h2>
      
      {/* Exam Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
        {exams.map(exam => (
          <Link 
            key={`${exam.year}-${exam.phase}`}
            href={`/manager/exams/${exam.year}/${exam.phase}`}
            className="panel pad inbox-row-hover"
            style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              textDecoration: "none",
              color: "inherit"
            }}
          >
            <div>
              <h3 style={{ margin: "0 0 6px", fontSize: "1.3rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
                Exame Nacional {exam.year}
              </h3>
              <span className="badge neutral" style={{ fontWeight: 700, marginBottom: 12, display: "inline-block" }}>
                {exam.phase}ª Fase
              </span>
              
              <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--muted-soft)", fontSize: "0.85rem" }}>
                  <Hash size={14} /> <span style={{ fontWeight: 600 }}>{exam.count} questões</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--muted-soft)", fontSize: "0.85rem" }}>
                  <Award size={14} /> <span style={{ fontWeight: 600 }}>{exam.totalCotacao} pts</span>
                </div>
              </div>
            </div>
            
            <div style={{ width: 40, height: 40, borderRadius: 20, background: "var(--surface-raised)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--line)" }}>
              <ChevronRight size={18} style={{ color: "var(--muted)" }} />
            </div>
          </Link>
        ))}
        
        {exams.length === 0 && (
          <div className="panel pad" style={{ gridColumn: "1 / -1", textAlign: "center", padding: 60, color: "var(--muted)" }}>
            Nenhum exame nacional encontrado na base de dados.
          </div>
        )}
      </div>
    </div>
  );
}
