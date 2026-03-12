import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { Users, CheckCircle, Percent, Award, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ExamSessionsPage() {
  const supabase = getSupabaseAdmin();

  const [sessionsRes, submissionsRes] = await Promise.all([
    supabase.from("exame_sessions")
      .select("id, user_id, exam_year, exam_phase, started_at, completed_at, total_questions, answered_questions, total_score, max_possible_score, mode, profiles(name)")
      .order("started_at", { ascending: false }),
    supabase.from("exame_submissions")
      .select("id, user_id, question_id, status, ai_score, created_at, exame_nacional_questions(question_number, exam_year)")
      .order("created_at", { ascending: false }),
  ]);

  const sessions = sessionsRes.data || [];
  const submissions = submissionsRes.data || [];

  // KPIs
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((s: any) => s.completed_at).length;
  const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
  const completedWithScores = sessions.filter((s: any) => s.completed_at && s.total_score != null);
  const avgScore = completedWithScores.length > 0
    ? Math.round(completedWithScores.reduce((acc: number, s: any) => acc + (s.total_score / s.max_possible_score) * 100, 0) / completedWithScores.length)
    : 0;

  // Problem submissions
  const problemSubmissions = submissions.filter((s: any) => s.status === "error" || s.status === "pending" || s.status === "grading");

  const kpis = [
    { label: "Sessões Totais", value: totalSessions.toString(), icon: <Users size={18} />, color: "var(--accent)" },
    { label: "Completadas", value: completedSessions.toString(), icon: <CheckCircle size={18} />, color: "var(--success)" },
    { label: "Taxa de Conclusão", value: `${completionRate}%`, icon: <Percent size={18} />, color: "var(--info)" },
    { label: "Score Médio", value: avgScore > 0 ? `${avgScore}%` : "—", icon: <Award size={18} />, color: "var(--warning)" },
  ];

  const statusColors: Record<string, string> = {
    error: "danger",
    pending: "warning",
    grading: "info",
    graded: "success",
  };

  return (
    <div style={{ padding: "48px 48px", maxWidth: 1400, margin: "0 auto", width: "100%" }}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>
          Sessões de Exame
        </h1>
        <p style={{ fontSize: "1.05rem", color: "var(--muted)" }}>
          Monitorização das sessões e submissões dos alunos nos exames nacionais.
        </p>
      </header>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {kpis.map(k => (
          <div key={k.label} className="panel pad" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {k.label}
              </span>
              <span style={{ color: k.color, opacity: 0.7 }}>{k.icon}</span>
            </div>
            <span style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em" }}>{k.value}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Sessions Table */}
        <div className="panel pad" style={{ alignSelf: "start" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "1rem", fontWeight: 600 }}>
            Sessões Recentes
          </h3>
          <div className="table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Exame</th>
                  <th style={{ textAlign: "center" }}>Resp.</th>
                  <th style={{ textAlign: "right" }}>Score</th>
                  <th style={{ textAlign: "center" }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {sessions.slice(0, 20).map((s: any) => {
                  const isCompleted = !!s.completed_at;
                  const scorePct = s.max_possible_score > 0 ? Math.round((s.total_score / s.max_possible_score) * 100) : null;
                  return (
                    <tr key={s.id}>
                      <td>
                        <span style={{ fontSize: "0.85rem" }}>
                          {new Date(s.started_at).toLocaleDateString("pt-PT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                          {s.exam_year} F{s.exam_phase}
                        </span>
                      </td>
                      <td style={{ textAlign: "center", fontSize: "0.85rem" }}>
                        {s.answered_questions}/{s.total_questions}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {scorePct != null && scorePct > 0 ? (
                          <span style={{ fontWeight: 700, fontSize: "0.9rem", color: scorePct >= 50 ? "var(--success)" : "var(--danger)" }}>
                            {scorePct}%
                          </span>
                        ) : (
                          <span style={{ color: "var(--muted-soft)", fontSize: "0.85rem" }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span className={`badge ${isCompleted ? "success" : "neutral"}`}>
                          {isCompleted ? "✓" : "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Problem Submissions */}
        <div className="panel pad" style={{ alignSelf: "start" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertCircle size={18} style={{ color: "var(--warning)" }} />
            Submissões com Problemas
            {problemSubmissions.length > 0 && (
              <span className="badge danger" style={{ fontSize: "0.7rem" }}>{problemSubmissions.length}</span>
            )}
          </h3>

          {problemSubmissions.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--muted)" }}>
              <CheckCircle size={24} style={{ color: "var(--success)", marginBottom: 8 }} />
              <p style={{ margin: 0 }}>Todas as submissões foram processadas com sucesso.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {problemSubmissions.map((sub: any) => (
                <div key={sub.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "var(--surface-raised)", borderRadius: 8 }}>
                  <div>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                      Q{sub.exame_nacional_questions?.question_number || "?"} ({sub.exame_nacional_questions?.exam_year || "?"})
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)", marginLeft: 8 }}>
                      {new Date(sub.created_at).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <span className={`badge ${statusColors[sub.status] || "neutral"}`}>{sub.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
