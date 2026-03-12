import { StatusBadge } from "@/components/status-badge";
import { formatDateTime, formatRelativeWindow } from "@/lib/format";
import { RunControlledExecutorButton } from "@/components/run-controlled-executor-button";
import { RunCurriculumDiffButton } from "@/components/run-curriculum-diff-button";
import { RunExerciseAuditorButton } from "@/components/run-exercise-auditor-button";
import { RunBriefGeneratorButton } from "@/components/run-brief-generator-button";
import { RunMonitorButton } from "@/components/run-monitor-button";
import { RunProposalEngineButton } from "@/components/run-proposal-engine-button";
import { Calendar, Clock, RefreshCw } from "lucide-react";
import { getDashboardData } from "@/lib/ops-data";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const data = await getDashboardData();
  const workflows = data.workflows;
  const triggerButtonByCode = {
    "official-monitor": <RunMonitorButton />,
    "curriculum-diff": <RunCurriculumDiffButton />,
    "proposal-engine": <RunProposalEngineButton />,
    "brief-generator": <RunBriefGeneratorButton periodType="weekly" />,
    "exercise-auditor": <RunExerciseAuditorButton />,
    "controlled-executor": <RunControlledExecutorButton />,
  } as const;

  const activeWorkflows = workflows.filter(w => w.is_active);
  const inactiveWorkflows = workflows.filter(w => !w.is_active);

  return (
    <div className="dashboard-stack">
      <header className="page-header">
        <h1 className="page-title">Agenda & Automações</h1>
        <p className="page-description">
          Vista consolidada do ciclo semanal e mensal recomendado para os agentes. Hoje os workflows estao em modo manual, por isso este ecra serve para supervisionar o ritmo certo e disparar runs fora do horario normal.
        </p>
      </header>

      <div className="panel-grid main-sidebar">
        {/* Main Content: Agenda and Workflows */}
        <div className="stack-lg">
          
          <section className="panel pad">
            <div className="section-head">
              <div className="flex-row">
                <div style={{ color: "var(--accent)" }}><Calendar size={24} /></div>
                <div>
                  <p className="eyebrow">Ciclo Recorrente</p>
                  <h2>Automações Ativas</h2>
                  <p className="description">
                    Estado real do ciclo operativo. Mostra o modo atual, a cadencia recomendada e a ultima atividade de cada workflow.
                  </p>
                </div>
              </div>
            </div>

            <div className="list-stack">
              {activeWorkflows.map((workflow) => {
                // Find last run for this workflow
                const lastRun = data.recentRuns.find(r => r.workflow_id === workflow.id);
                return (
                  <div key={workflow.id} className="data-block">
                    <div className="data-block-header">
                      <div>
                        <h3 className="data-block-title">{workflow.name}</h3>
                        <div className="data-block-meta" style={{ marginTop: 6 }}>
                          <span>{workflow.code}</span>
                          <span style={{ opacity: 0.5 }}>|</span>
                          <span>{workflow.category}</span>
                        </div>
                      </div>
                      <div className="flex-row">
                        <StatusBadge kind="success">Ativo</StatusBadge>
                        <StatusBadge kind={workflow.risk_level === "high" || workflow.risk_level === "critical" ? "danger" : (workflow.risk_level === "low" ? "success" : "warning")}>
                          Risco {workflow.risk_level}
                        </StatusBadge>
                      </div>
                    </div>
                    
                    <p className="description" style={{ marginTop: 12, marginBottom: 16 }}>
                      {workflow.description ?? "Sem descrição configurada."}
                    </p>

                    <div className="panel-grid two" style={{ gap: 12 }}>
                      <div className="detail-block" style={{ padding: "12px 16px", background: "var(--surface)" }}>
                        <div className="meta-row" style={{ marginBottom: 8 }}>
                          <StatusBadge kind={workflow.scheduleSummary.isRecurring ? "success" : "warning"}>
                            {workflow.scheduleSummary.modeLabel}
                          </StatusBadge>
                          <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                            {workflow.scheduleSummary.cadenceLabel}
                          </span>
                        </div>
                        <p className="description" style={{ margin: 0, fontSize: "0.85rem" }}>
                          {workflow.scheduleSummary.note}
                        </p>
                      </div>

                      <div className="detail-block" style={{ padding: "12px 16px", background: "var(--surface)" }}>
                        <div className="flex-row" style={{ gap: 8, fontSize: "0.85rem", color: "var(--muted)" }}>
                          <Clock size={16} />
                          <span>Ultima execucao: {lastRun ? formatRelativeWindow(lastRun.created_at) : "Nunca correu"}</span>
                        </div>
                        <div className="meta-row" style={{ marginTop: 8 }}>
                          <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                            {lastRun ? formatDateTime(lastRun.created_at) : "Sem runs registadas"}
                          </span>
                          {lastRun ? <StatusBadge kind={lastRun.status}>{lastRun.status}</StatusBadge> : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Sidebar: Triggers & Offline */}
        <div className="stack-lg">
          <section className="panel pad">
            <div className="section-head">
              <div className="flex-row">
                <div style={{ color: "var(--warning)" }}><RefreshCw size={24} /></div>
                <div>
                  <p className="eyebrow">Ações</p>
                  <h2>Triggers Manuais</h2>
                </div>
              </div>
            </div>
            <p className="description" style={{ marginBottom: 16, fontSize: "0.85rem" }}>
              Executa workflows manualmente quando queres testar, recuperar falhas ou antecipar o ciclo semanal ou mensal.
            </p>
            <div className="stack-sm">
              {activeWorkflows.map((workflow) => (
                <div key={workflow.id} className="data-block">
                  <div className="data-block-header">
                    <div>
                      <h3 className="data-block-title">{workflow.name}</h3>
                      <div className="data-block-meta" style={{ marginTop: 6 }}>
                        <span>{workflow.scheduleSummary.cadenceLabel}</span>
                        <span>• {workflow.category}</span>
                      </div>
                    </div>
                    {triggerButtonByCode[workflow.code as keyof typeof triggerButtonByCode] ?? (
                      <span className="metric-note">Sem trigger manual configurado</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel pad">
            <div className="section-head">
              <div>
                <p className="eyebrow">Inativos</p>
                <h2>Workflows Pausados</h2>
              </div>
            </div>
            <div className="list-stack" style={{ marginTop: 16 }}>
              {inactiveWorkflows.length === 0 ? (
                <div className="description" style={{ fontSize: "0.85rem" }}>Nenhum workflow pausado.</div>
              ) : (
                inactiveWorkflows.map(workflow => (
                  <div key={workflow.id} className="data-block" style={{ padding: 12, opacity: 0.7 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{workflow.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 4 }}>{workflow.category}</div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
