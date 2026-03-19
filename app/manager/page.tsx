import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { PREMIUM_PRICE_EUR, COST_PER_CALL_EUR, TOTAL_INFRA_MONTHLY_EUR, MODEL_PRICING_EUR } from "@/lib/pricing-constants";
import { Activity, BookOpen, AlertTriangle, TrendingDown, TrendingUp, Zap, MessageSquare, DollarSign, Server, Users, Calendar } from "lucide-react";
import { DifficultyDonutChart } from "./DashboardCharts";
import React from "react";
import {
  calculateAfterTaxProfit,
  calculateSubscriptionUnitEconomics,
  CONSERVATIVE_PREMIUM_CHANNEL_KEY,
} from "@/lib/subscription-economics";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function eur(value: number, decimals = 2): string {
  return `€${value.toFixed(decimals)}`;
}

// ---------------------------------------------------------------------------
// Data Fetching Master Queries
// ---------------------------------------------------------------------------
async function getMasterDashboardData() {
  const supabase = getSupabaseAdmin();

  const now = new Date();
  const todayStr = now.toISOString().substring(0, 10);
  const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

  // Fire all queries in parallel
  const [
    // Operational
    questionsRes,
    usedQuestionsRes,
    answersRes,
    sessionsRes,
    diffFacilRes,
    diffMedioRes,
    diffDificilRes,
    recentDoubtsRes,
    lowAccuracyRes,
    dauRes,
    mauRes,
    // Financials
    walletsRes,
    examSubmissionsRes,
    agentRunsRes,
    totalUsersRes,
    aiCostsViewRes
  ] = await Promise.all([
    supabase.from("quiz_perguntas").select("id", { count: "exact", head: true }),
    supabase.from("quiz_perguntas").select("id", { count: "exact", head: true }).gt("num_tentativas", 0),
    supabase.from("quiz_respostas").select("id", { count: "exact", head: true }),
    supabase.from("quiz_sessoes").select("id", { count: "exact", head: true }),
    supabase.from("quiz_perguntas").select("id", { count: "exact", head: true }).eq("dificuldade", "facil"),
    supabase.from("quiz_perguntas").select("id", { count: "exact", head: true }).eq("dificuldade", "medio"),
    supabase.from("quiz_perguntas").select("id", { count: "exact", head: true }).eq("dificuldade", "dificil"),
    supabase.from("quiz_doubt_events")
      .select("id, doubt_type, custom_input, tokens_spent, created_at, quiz_perguntas(pergunta)")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("quiz_perguntas")
      .select("id, pergunta, dificuldade, num_tentativas, taxa_acerto, subtema_id")
      .gt("num_tentativas", 2)
      .order("taxa_acerto", { ascending: true })
      .limit(6),
    supabase.from("profiles").select("user_id", { count: "exact", head: true }).eq("last_active_date", todayStr),
    supabase.from("profiles").select("user_id", { count: "exact", head: true }).gte("last_activity", monthAgo),

    // Financial calculations
    supabase.from("user_token_wallets").select("plan_code"), // The fix: explicit direct query instead of RPC
    supabase.from("exame_submissions").select("id", { count: "exact", head: true }).eq("status", "graded"),
    supabase.from("agent_runs").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("user_id", { count: "exact", head: true }),
    supabase.from("vw_ai_costs_by_action").select("*")
  ]);

  // Operational Processing
  const diffDist = {
    facil: diffFacilRes.count || 0,
    medio: diffMedioRes.count || 0,
    dificil: diffDificilRes.count || 0,
  };
  const totalQuestions = questionsRes.count || 0;
  const usedQuestions = usedQuestionsRes.count || 0;
  const usageRate = totalQuestions > 0 ? Math.round((usedQuestions / totalQuestions) * 100) : 0;

  let totalDoubtTokens = 0;
  const recentDoubts = (recentDoubtsRes.data || []).map((d: any) => {
    const tokens = d.tokens_spent || 0;
    totalDoubtTokens += tokens;
    return {
      ...d,
      question_excerpt: d.quiz_perguntas?.pergunta
        ? d.quiz_perguntas.pergunta.substring(0, 90)
        : null,
    };
  });

  // Financials Processing / Premium Fix
  let premiumUsers = 0;
  if (walletsRes.data) {
     const counts: Record<string, number> = {};
     for (const row of walletsRes.data) {
       counts[row.plan_code] = (counts[row.plan_code] || 0) + 1;
     }
     premiumUsers = counts["premium"] || 0;
  }
  
  const premiumRevenueUnit = calculateSubscriptionUnitEconomics(
    PREMIUM_PRICE_EUR,
    CONSERVATIVE_PREMIUM_CHANNEL_KEY,
  );
  const grossMonthlyRevenue = premiumUsers * PREMIUM_PRICE_EUR;
  const monthlyRevenue = premiumUsers * premiumRevenueUnit.platformProceedsPreTaxEur;

  let aiCostsView: any[] = aiCostsViewRes.data || [];
  const aiCostBreakdown = aiCostsView
    .filter(a => !a.action_key.includes("refund"))
    .map(a => {
      const fallbackConfig = COST_PER_CALL_EUR[a.action_key as keyof typeof COST_PER_CALL_EUR];
      const modelKey = a.model || fallbackConfig?.model || "unknown";
      const exactPricing = MODEL_PRICING_EUR[modelKey as keyof typeof MODEL_PRICING_EUR];
      
      let totalCost = 0;
      if (exactPricing && a.total_input_tokens !== null && a.total_output_tokens !== null) {
        totalCost = (a.total_input_tokens / 1_000_000 * exactPricing.inputPer1M) + 
                    (a.total_output_tokens / 1_000_000 * exactPricing.outputPer1M);
      } else {
        totalCost = a.event_count * (fallbackConfig?.cost || 0.001);
      }
      return {
        action_key: a.action_key,
        label: fallbackConfig?.description || a.action_key,
        estimated_cost_eur: totalCost,
      };
    });

  const totalAgentRuns = agentRunsRes.count || 0;
  const totalAgentCostEur = totalAgentRuns * (COST_PER_CALL_EUR.agent_run_generic?.cost || 0.03);
  const examGradedCount = examSubmissionsRes.count || 0;
  const examGradingCost = examGradedCount * (COST_PER_CALL_EUR.grade_exam?.cost || 0.004);

  const totalUserAiCostEur = aiCostBreakdown.reduce((a, b) => a + b.estimated_cost_eur, 0);
  const totalAiCost = totalUserAiCostEur + totalAgentCostEur + examGradingCost;
  const totalMonthlyCost = totalAiCost + TOTAL_INFRA_MONTHLY_EUR;
  const pretaxNetMonthly = monthlyRevenue - totalMonthlyCost;
  const netMonthly = calculateAfterTaxProfit(pretaxNetMonthly).afterTaxProfitEur;

  return {
    operational: {
      totalQuestions,
      usedQuestions,
      usageRate,
      totalAnswers: answersRes.count || 0,
      totalSessions: sessionsRes.count || 0,
      dau: dauRes.count || 0,
      mau: mauRes.count || 0,
      diffDist,
      recentDoubts,
      lowAccuracyQuestions: lowAccuracyRes.data || [],
      avgRecentTokens: recentDoubts.length > 0 ? Math.round(totalDoubtTokens / recentDoubts.length) : 0,
    },
    financial: {
      totalUsers: totalUsersRes.count || 0,
      premiumUsers,
      grossMonthlyRevenue,
      monthlyRevenue,
      totalUserAiCostEur,
      totalAgentCostEur,
      examGradingCost,
      totalAiCost,
      infraCost: TOTAL_INFRA_MONTHLY_EUR,
      totalMonthlyCost,
      pretaxNetMonthly,
      premiumRevenueChannelLabel: premiumRevenueUnit.channelLabel,
      netMonthly,
      isProfit: netMonthly >= 0
    }
  };
}

export default async function MasterDashboard() {
  const data = await getMasterDashboardData();
  const ops = data.operational;
  const fin = data.financial;

  const doubtTypeLabels: Record<string, string> = {
    not_understood: "Re-explicação",
    why_wrong: "Erro Aluno",
    why_correct: "Verificação",
    another_method: "Alternativa",
    similar_example: "Exemplo",
    custom: "Prompt Livre",
    follow_up: "Follow-up",
  };

  return (
    <>
      <style>{`
        .dashboard-layout {
          min-height: 100vh;
          background-color: #05050f; 
          color: #f8fafc;
          position: relative;
          overflow-x: hidden;
          font-family: 'Inter', system-ui, sans-serif;
          padding-bottom: 40px;
        }

        .bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(140px);
          opacity: 0.15;
          pointer-events: none;
          z-index: 0;
        }
        .orb-1 { width: 600px; height: 600px; background: #4f46e5; top: -100px; left: -100px; }
        .orb-2 { width: 500px; height: 500px; background: #ec4899; bottom: 0; right: -100px; }

        .content-wrap {
          position: relative;
          z-index: 10;
          padding: 32px 48px;
          margin: 0; 
          width: 100%; 
        }

        .panel {
          background: rgba(18, 16, 36, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }

        .metric-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }
        .metric-row:last-child {
          border-bottom: none;
        }

        .scroller::-webkit-scrollbar { width: 4px; }
        .scroller::-webkit-scrollbar-track { background: transparent; }
        .scroller::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .scroller::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `}</style>

      <div className="dashboard-layout">
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>

        <div className="content-wrap">
          {/* ───────────────────────────────────────────────────────── 
              Header Row
          ───────────────────────────────────────────────────────── */}
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
            <div>
              <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 4px 0" }}>
                Telemetria Central
              </h1>
              <p style={{ fontSize: "0.95rem", color: "#94a3b8", margin: 0 }}>
                Saúde Financeira e Operacional do Wolfi em tempo real.
              </p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div className="panel" style={{ padding: "8px 16px", borderRadius: "100px", display: "flex", alignItems: "center", gap: 10 }}>
                 <div style={{ width: 8, height: 8, background: "#10b981", borderRadius: "50%", boxShadow: "0 0 10px #10b981" }}></div>
                 <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", textTransform: "uppercase" }}>Sistemas Online</span>
              </div>
            </div>
          </header>

          {/* ───────────────────────────────────────────────────────── 
              NORTH STAR METRICS (Top Row)
          ───────────────────────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 24 }}>
            
             {/* Revenue MRR */}
             <div className="panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Receita Líq. MRR</span>
                <DollarSign size={18} color="#34d399" />
              </div>
              <div>
                <span style={{ fontSize: "2.2rem", fontWeight: 800, color: "#f8fafc" }}>{eur(fin.monthlyRevenue)}</span>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#64748b" }}>{fin.premiumUsers} premium · bruto {eur(fin.grossMonthlyRevenue)} · {fin.premiumRevenueChannelLabel}</p>
              </div>
            </div>

            {/* Net P&L */}
            <div className="panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 8, borderLeft: `3px solid ${fin.isProfit ? "#10b981" : "#ef4444"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Lucro / Prejuízo Líquido</span>
                {fin.isProfit ? <TrendingUp size={18} color="#10b981" /> : <TrendingDown size={18} color="#ef4444" />}
              </div>
              <div>
                <span style={{ fontSize: "2.2rem", fontWeight: 800, color: fin.isProfit ? "#10b981" : "#ef4444", textShadow: `0 0 15px ${fin.isProfit ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}` }}>
                  {eur(fin.netMonthly)}
                </span>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#64748b" }}>Após IVA/store fees e imposto estimado</p>
              </div>
            </div>

            {/* AI Costs */}
            <div className="panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Custos IA (Total)</span>
                <Server size={18} color="#f59e0b" />
              </div>
              <div>
                <span style={{ fontSize: "2.2rem", fontWeight: 800, color: "#f8fafc" }}>{eur(fin.totalAiCost)}</span>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#64748b" }}>Agrega todos os modelos API</p>
              </div>
            </div>

             {/* Study DAU/MAU */}
             <div className="panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Alunos Ativos (Hoje)</span>
                <Users size={18} color="#6366f1" />
              </div>
              <div>
                <span style={{ fontSize: "2.2rem", fontWeight: 800, color: "#f8fafc" }}>{ops.dau.toLocaleString("pt-PT")} DAU</span>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#64748b" }}>{ops.mau.toLocaleString("pt-PT")} mensais (MAU) | {fin.totalUsers} inst.</p>
              </div>
            </div>

             {/* Operations (Interaction) */}
            <div className="panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sessões de Estudo</span>
                <Activity size={18} color="#38bdf8" />
              </div>
              <div>
                <span style={{ fontSize: "2.2rem", fontWeight: 800, color: "#f8fafc" }}>{ops.totalSessions.toLocaleString("pt-PT")}</span>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#64748b" }}>{ops.totalAnswers.toLocaleString("pt-PT")} exercícios resolvidos globais</p>
              </div>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────── 
              ACTION CENTER (Middle Row)
          ───────────────────────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
             
             {/* Left side: Financial Burn Breakdown */}
             <div className="panel" style={{ padding: "24px" }}>
                <h3 style={{ margin: "0 0 20px", fontSize: "1.1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, color: "#cbd5e1" }}>
                  <Zap size={20} style={{ color: "#f59e0b" }} />
                  Detalhe da Fatura e Operação
                </h3>
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <div className="metric-row">
                      <span style={{ color: "#94a3b8" }}>1. Interações Aluno-IA (GPT/Gemini)</span>
                      <span style={{ fontWeight: 600 }}>{eur(fin.totalUserAiCostEur, 3)}</span>
                    </div>
                    <div className="metric-row">
                      <span style={{ color: "#94a3b8" }}>2. Motores de Correção de Exames</span>
                      <span style={{ fontWeight: 600 }}>{eur(fin.examGradingCost, 3)}</span>
                    </div>
                    <div className="metric-row">
                      <span style={{ color: "#94a3b8" }}>3. Agentes em Background (Ops)</span>
                      <span style={{ fontWeight: 600 }}>{eur(fin.totalAgentCostEur, 3)}</span>
                    </div>
                     <div className="metric-row">
                      <span style={{ color: "#94a3b8" }}>4. Vercel & Supabase (Previsão)</span>
                      <span style={{ fontWeight: 600 }}>{eur(fin.infraCost, 2)}</span>
                    </div>
                    <div className="metric-row" style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 12 }}>
                      <span style={{ color: "#e2e8f0", fontWeight: 600 }}>Custo de Operação Mensal</span>
                      <span style={{ fontWeight: 800, color: "#f59e0b" }}>{eur(fin.totalMonthlyCost, 2)}</span>
                    </div>
                </div>
             </div>

             {/* Right side: Needs Attention (Low Accuracy) */}
             <div className="panel" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, color: "#cbd5e1" }}>
                    <AlertTriangle size={20} style={{ color: "#ef4444" }} />
                    Gargalos Pedagógicos (A Rever)
                  </h3>
                  <a href="/manager/content" style={{ fontSize: "0.85rem", color: "#6366f1", textDecoration: "none" }}>Lista Completa →</a>
                </div>
                <div className="scroller" style={{ flex: 1, maxHeight: "200px", overflowY: "auto", paddingRight: 8, display: "grid", gap: 8 }}>
                  {ops.lowAccuracyQuestions.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>Nenhum conteúdo sinalizado com taxa de sucesso alarmante.</div>
                  ) : (
                    ops.lowAccuracyQuestions.map((q: any) => (
                      <div key={q.id} style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        padding: "10px 14px", 
                        background: "rgba(239, 68, 68, 0.05)", 
                        borderLeft: "2px solid #ef4444",
                        borderRadius: "6px", 
                        gap: 16 
                      }}>
                        <div style={{ flex: 1, overflow: "hidden" }}>
                          <p style={{ margin: 0, fontSize: "0.85rem", color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {q.pergunta}
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: "0.75rem", padding: "2px 6px", borderRadius: "4px", background: "rgba(255,255,255,0.05)", color: "#94a3b8" }}>{q.dificuldade}</span>
                          <span style={{ fontSize: "1rem", fontWeight: 800, color: "#ef4444" }}>
                            {Math.round(Number(q.taxa_acerto) * 100)}% Acerto
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
             </div>
          </div>

          {/* ───────────────────────────────────────────────────────── 
              TELEMETRY & HEALTH (Bottom Row)
          ───────────────────────────────────────────────────────── */}
           <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 24 }}>
            
            {/* Left: Full Width Telemetry Table */}
            <div className="panel" style={{ padding: "0", display: "flex", flexDirection: "column", height: 400 }}>
              <div style={{ padding: "20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, color: "#cbd5e1" }}>
                  <MessageSquare size={18} style={{ color: "#f472b6" }} />
                  Feed Vivo de Intervenções de IA
                </h3>
                 <span style={{ fontSize: "0.75rem", padding: "4px 8px", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", borderRadius: "100px", fontWeight: 600, border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                   Média: ~{ops.avgRecentTokens} tokens/pedido
                 </span>
              </div>
              
              <div className="scroller" style={{ flex: 1, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
                  <thead style={{ position: "sticky", top: 0, background: "rgba(18, 16, 36, 0.95)", backdropFilter: "blur(4px)" }}>
                    <tr style={{ color: "#64748b", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <th style={{ padding: "12px 20px", fontWeight: 500, width: "10%" }}>Hora</th>
                      <th style={{ padding: "12px 20px", fontWeight: 500, width: "15%" }}>Intenção</th>
                      <th style={{ padding: "12px 20px", fontWeight: 500, width: "65%" }}>Contexto do Aluno</th>
                      <th style={{ padding: "12px 20px", fontWeight: 500, textAlign: "right", width: "10%" }}>Gasto (Tk)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ops.recentDoubts.length === 0 ? (
                       <tr><td colSpan={4} style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>A aguardar conectividade dos estudantes.</td></tr>
                    ) : (
                      ops.recentDoubts.map((d: any) => (
                        <tr key={d.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                          <td style={{ padding: "12px 20px", color: "#94a3b8" }}>
                            {new Date(d.created_at).toLocaleTimeString("pt-PT", { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ padding: "12px 20px" }}>
                            <span style={{ 
                                padding: "4px 8px", 
                                borderRadius: "4px", 
                                background: "rgba(244, 114, 182, 0.1)",
                                color: "#f472b6",
                                fontSize: "0.75rem",
                                whiteSpace: "nowrap"
                              }}>
                              {doubtTypeLabels[d.doubt_type] || d.doubt_type}
                            </span>
                          </td>
                          <td style={{ padding: "12px 20px", color: "#cbd5e1" }}>
                            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                              {d.custom_input ? (
                                <span style={{ color: "#e2e8f0" }}>"{d.custom_input}"</span>
                              ) : (
                                <span style={{ color: "#64748b", fontStyle: "italic" }}>Problema: {d.question_excerpt || "Oculto..."}</span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: "12px 20px", textAlign: "right", color: d.tokens_spent > 1500 ? "#f59e0b" : "#10b981", fontFamily: "monospace", opacity: d.tokens_spent === 0 ? 0.3 : 1 }}>
                            {d.tokens_spent.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Difficulty Radar */}
            <div className="panel" style={{ padding: "24px", display: "flex", flexDirection: "column", height: 400 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, color: "#cbd5e1" }}>
                <BookOpen size={18} style={{ color: "#818cf8" }} />
                Dificuldade (Banco Físico)
              </h3>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DifficultyDonutChart data={ops.diffDist} />
              </div>
               <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, padding: "12px", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>
                 <div style={{ textAlign: "center" }}>
                   <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: 2 }}>Fácil</div>
                   <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#10b981" }}>{ops.diffDist.facil}</div>
                 </div>
                 <div style={{ textAlign: "center" }}>
                   <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: 2 }}>Médio</div>
                   <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#f59e0b" }}>{ops.diffDist.medio}</div>
                 </div>
                 <div style={{ textAlign: "center" }}>
                   <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: 2 }}>Difícil</div>
                   <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#ef4444" }}>{ops.diffDist.dificil}</div>
                 </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
