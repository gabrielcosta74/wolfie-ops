import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { getFindingDetail } from "@/lib/ops-data";
import { Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SignalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const signal = await getFindingDetail(id);

  if (!signal) {
    notFound();
  }

  return (
    <div className="dashboard-stack">
      <header className="page-header">
        <h1 className="page-title">{signal.title}</h1>
        <div className="meta-row" style={{ marginTop: 12 }}>
          <span>Gerado via {signal.workflowName}</span>
          <span>{formatDateTime(signal.created_at)}</span>
          <StatusBadge kind={signal.status === "new" ? "info" : "neutral"}>
            {signal.status === "new" ? "Novo" : signal.status}
          </StatusBadge>
          <StatusBadge kind={signal.severity === "high" || signal.severity === "critical" ? "danger" : (signal.severity === "low" ? "success" : "warning")}>
            {signal.severity}
          </StatusBadge>
        </div>
      </header>

      <div className="panel-grid two">
        <section className="panel pad" style={{ borderTop: "4px solid var(--info)" }}>
          <div className="section-head">
            <div className="flex-row">
              <div style={{ color: "var(--info)" }}><Activity size={24} /></div>
              <div>
                <p className="eyebrow">Descoberta</p>
                <h2>Detalhes do Sinal</h2>
              </div>
            </div>
          </div>
          
          <div className="list-stack" style={{ marginTop: 24 }}>
            <div className="stack-item">
              <strong>Descrição</strong>
              <p className="description" style={{ marginTop: 4 }}>
                {signal.description || "Sem descrição detalhada."}
              </p>
            </div>
            
            <div className="stack-item">
              <strong>Contexto Educativo</strong>
              <div className="meta-row" style={{ marginTop: 4 }}>
                <span>Tema: {signal.affected_theme || "n/a"}</span>
                <span>Subtópico: {signal.affected_subtopic || "n/a"}</span>
              </div>
            </div>
            
            <div className="stack-item">
              <strong>Confiança do Auditor</strong>
              <div style={{ marginTop: 4 }}>
                <span className="badge neutral">
                  Nível {(signal.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </section>
        
        <section className="panel pad">
          <p className="eyebrow">Diagnóstico Técnico</p>
          <h3>Metadata & Payload</h3>
          <p className="description" style={{ marginBottom: 16 }}>
            JSON em bruto gerado pelo agente durante o workflow. Útil para tracing.
          </p>
          <pre className="code-block" style={{ fontSize: "0.75rem", overflowX: "auto" }}>
            {JSON.stringify(signal.metadata ?? {}, null, 2)}
          </pre>
        </section>
      </div>
    </div>
  );
}
