import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { listCurriculumFindings } from "@/lib/ops-data";

export const metadata = { title: "Radar Curricular | Wolfi Ops" };
export const dynamic = "force-dynamic";

export default async function RadarPage() {
  const findings = await listCurriculumFindings();
  const leadFinding =
    findings.find((finding) => finding.severity === "critical" || finding.severity === "high") ??
    findings[0] ??
    null;
  const history = leadFinding ? findings.filter((finding) => finding.id !== leadFinding.id) : findings;

  return (
    <div className="dashboard-stack">
      <header className="page-header">
        <h1 className="page-title">Radar Curricular</h1>
        <p className="page-description">
          Monitorização automática de fontes oficiais de Matemática A e exames. O objetivo aqui é perceber o que mudou e se isso deve gerar atualização no Wolfi.
        </p>
      </header>

      <section
        className="panel pad"
        style={{
          borderTop: `4px solid ${leadFinding ? "var(--warning)" : "var(--accent)"}`,
          marginBottom: "32px",
        }}
      >
        <div className="section-head" style={{ marginBottom: "24px" }}>
          <div>
            <div className="flex-row" style={{ alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <StatusBadge kind={leadFinding ? "warning" : "neutral"}>
                {leadFinding ? "Sinal curricular ativo" : "Sem alertas prioritários"}
              </StatusBadge>
            </div>
            <h2 style={{ fontSize: "1.5rem" }}>
              {leadFinding?.title ?? "Nenhum sinal curricular importante por rever"}
            </h2>
          </div>
          {leadFinding ? (
            <span style={{ fontSize: "0.9rem", color: "var(--fg-muted)" }}>
              {formatDateTime(leadFinding.created_at)}
            </span>
          ) : null}
        </div>

        <div className="panel" style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "20px" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "12px" }}>Leitura resumida</h3>
          <p className="description" style={{ color: "var(--fg)", marginBottom: "16px" }}>
            {leadFinding?.description ??
              "O monitor oficial não produziu nenhum finding curricular prioritário. Continua a ser possível forçar nova verificação em Sistema."}
          </p>

          {leadFinding ? (
            <div
              style={{
                padding: "16px",
                background: "rgba(255,100,0,0.08)",
                borderRadius: "8px",
                border: "1px solid rgba(255,100,0,0.18)",
              }}
            >
              <h4 style={{ margin: 0, color: "var(--warning)", fontSize: "1rem" }}>Próximo passo sugerido</h4>
              <p className="description" style={{ marginTop: 12 }}>
                {leadFinding.nextStep}
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex-row" style={{ marginTop: "24px", gap: "16px" }}>
          <Link className="button secondary" href="/system">
            Abrir Sistema
          </Link>
          {leadFinding ? (
            <Link className="button secondary" href="/reports">
              Ver relatórios
            </Link>
          ) : null}
        </div>
      </section>

      <h3 style={{ fontSize: "1.1rem", marginBottom: "16px" }}>Histórico recente</h3>

      <div className="stack-sm">
        {history.length === 0 ? (
          <div className="panel" style={{ padding: "16px 24px" }}>
            <span style={{ color: "var(--fg-muted)" }}>Ainda não há mais sinais curriculares recentes.</span>
          </div>
        ) : (
          history.slice(0, 10).map((finding) => (
            <div
              className="panel"
              key={finding.id}
              style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <div>
                <div className="flex-row" style={{ alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <StatusBadge kind={finding.severity === "high" || finding.severity === "critical" ? "warning" : "neutral"}>
                    {finding.severity}
                  </StatusBadge>
                  <h4 style={{ margin: 0, fontSize: "1.05rem" }}>{finding.title}</h4>
                </div>
                <span style={{ fontSize: "0.9rem", color: "var(--fg-muted)" }}>
                  {finding.workflowName} • {formatDateTime(finding.created_at)}
                </span>
              </div>
              <span style={{ fontSize: "0.95rem", color: "var(--fg-muted)" }}>{finding.nextStep}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
