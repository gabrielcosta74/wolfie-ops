import type { ReactNode } from "react";
import { getLatestReviewBrief } from "@/lib/ops-data";
import { RunBriefGeneratorButton } from "@/components/run-brief-generator-button";
import { RunMonitorButton } from "@/components/run-monitor-button";
import { RunCoverageProfilerButton } from "@/components/run-coverage-profiler-button";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

function WorkflowCard(props: {
  title: string;
  description: string;
  note: string;
  action: ReactNode;
}) {
  return (
    <div className="panel pad">
      <div className="section-head" style={{ marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>{props.title}</h2>
          <p className="description" style={{ margin: "6px 0 0" }}>{props.description}</p>
        </div>
        {props.action}
      </div>
      <p className="metric-note" style={{ margin: 0 }}>{props.note}</p>
    </div>
  );
}

export default async function SystemPage() {
  const latestBrief = await getLatestReviewBrief();

  return (
    <div style={{ padding: 48, maxWidth: 1000, margin: "0 auto" }}>
      <header className="page-header" style={{ marginBottom: 36 }}>
        <div>
          <h1 className="page-title">Sistema</h1>
          <p className="page-description" style={{ marginTop: 8 }}>
            Área secundária para correr manualmente o ciclo V1 de monitorização oficial e revisão semanal.
          </p>
        </div>
      </header>

      <section className="panel pad" style={{ marginBottom: 24 }}>
        <div className="section-head">
          <div>
            <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Estado atual</h2>
            <p className="description" style={{ margin: "6px 0 0" }}>
              {latestBrief
                ? `Existe uma revisão ativa com ${latestBrief.cases.length} casos e ${latestBrief.stats.pending} decisões pendentes.`
                : "Ainda não existe nenhuma revisão ativa."}
            </p>
          </div>
          <StatusBadge kind={latestBrief ? "info" : "neutral"}>
            {latestBrief ? "Revisão ativa" : "Sem revisão"}
          </StatusBadge>
        </div>
      </section>

      <div className="list-stack">
        <WorkflowCard
          title="Monitorizar Fontes Oficiais"
          description="Corre o `official-monitor` e verifica IAVE, DGE e DGES por mudanças com impacto curricular."
          note="Workflow já ativo. Cria findings oficiais e alimenta o resto do ciclo."
          action={<RunMonitorButton />}
        />

        <WorkflowCard
          title="Coverage Profiler"
          description="Analisa cobertura, variedade e desequilíbrios da taxonomia oficial face ao conteúdo do Wolfie."
          note="Gera sinais curriculares e de desequilíbrio para a revisão semanal."
          action={<RunCoverageProfilerButton />}
        />

        <WorkflowCard
          title="Gerar Revisão Semanal"
          description="Corre o `brief-generator` e o `case-builder` encadeado para preparar a revisão semanal."
          note="Fecha o ciclo semanal e atualiza a experiência principal de Inbox/Revisões."
          action={<RunBriefGeneratorButton periodType="weekly" />}
        />
      </div>
    </div>
  );
}
