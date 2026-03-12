import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { ExamsDataTable } from "../../exams-data-table";
import { ArrowLeft, Hash, Award } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;
type Params = Promise<{ year: string; phase: string }>;

export default async function ExamDetailPage({ 
  params,
  searchParams 
}: { 
  params: Params;
  searchParams: SearchParams;
}) {
  const resolvedParams = await params;
  const year = parseInt(resolvedParams.year, 10);
  const phase = parseInt(resolvedParams.phase, 10);

  if (isNaN(year) || isNaN(phase)) {
    notFound();
  }

  const sParams = await searchParams;
  const typeFilter = (sParams.type as string) || "";
  const diffFilter = (sParams.difficulty as string) || "";
  const optionalFilter = (sParams.optional as string) || "";

  const supabase = getSupabaseAdmin();

  // Build query
  let query = supabase
    .from("exame_nacional_questions")
    .select("*, edu_subtemas_exame(nome)", { count: "exact" })
    .eq("exam_year", year)
    .eq("exam_phase", phase);

  if (typeFilter) query = query.eq("question_type", typeFilter);
  if (diffFilter) query = query.eq("difficulty_level", diffFilter);
  if (optionalFilter === "true") query = query.eq("is_optional", true);
  if (optionalFilter === "false") query = query.eq("is_optional", false);

  query = query.order("question_number");

  // Summary stats (unfiltered for top KPIs)
  const [questionsRes, totalCotacaoRes] = await Promise.all([
    query,
    supabase.from("exame_nacional_questions")
      .select("cotacao")
      .eq("exam_year", year)
      .eq("exam_phase", phase),
  ]);

  const questions = questionsRes.data || [];
  const totalCountFiltered = questionsRes.count || 0;
  
  // Unfiltered stats
  const totalCountUnfiltered = (totalCotacaoRes.data || []).length;
  const totalCotacao = (totalCotacaoRes.data || []).reduce((acc, r) => acc + (r.cotacao || 0), 0);

  const stats = [
    { label: "Questões no Exame", value: totalCountUnfiltered.toString(), icon: <Hash size={18} />, color: "var(--accent)" },
    { label: "Cotação Total", value: `${totalCotacao} pts`, icon: <Award size={18} />, color: "var(--warning)" },
  ];

  return (
    <div style={{ padding: "48px 48px", maxWidth: 1400, margin: "0 auto", width: "100%" }}>
      <Link 
        href="/manager/exams" 
        style={{ 
          display: "inline-flex", 
          alignItems: "center", 
          gap: 6, 
          fontSize: "0.85rem", 
          fontWeight: 600, 
          color: "var(--muted)",
          textDecoration: "none",
          marginBottom: 24,
          background: "var(--surface)",
          padding: "6px 12px",
          borderRadius: 20,
          border: "1px solid var(--line)"
        }}
      >
        <ArrowLeft size={16} /> Voltar aos Exames
      </Link>

      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>
          Exame Nacional {year}
        </h1>
        <p style={{ fontSize: "1.05rem", color: "var(--muted)" }}>
          <span className="badge neutral" style={{ fontWeight: 700, fontSize: "0.9rem", marginRight: 10 }}>
            {phase}ª Fase
          </span>
          Matemática A
        </p>
      </header>

      {/* Mini KPIs */}
      <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
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

      <ExamsDataTable
        questions={questions}
        totalCount={totalCountFiltered}
        activeFilters={{ type: typeFilter, difficulty: diffFilter, optional: optionalFilter }}
      />
    </div>
  );
}
