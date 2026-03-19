import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { listWorkflows } from "@/lib/ops-data";
import { Settings as SettingsIcon, ShieldAlert } from "lucide-react";
import { requireManagerUser } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireManagerUser();
  const workflows = await listWorkflows();

  const activeWorkflows = workflows.filter((w) => w.is_active);
  const inactiveWorkflows = workflows.filter((w) => !w.is_active);

  return (
    <div className="dashboard-stack">
      <header className="page-header">
        <h1 className="page-title">Settings & Observability</h1>
        <p className="page-description">
          Gestão dos Workflows do Sistema Wolfi Ops.
        </p>
      </header>

      <div className="panel-grid two">
        <section className="panel pad" style={{ borderTop: "4px solid var(--success)" }}>
          <div className="section-head">
            <div className="flex-row">
              <div style={{ color: "var(--success)" }}><SettingsIcon size={24} /></div>
              <div>
                <p className="eyebrow">Ativos</p>
                <h2>Workflows em Produção</h2>
              </div>
            </div>
          </div>
          <div className="list-stack" style={{ marginTop: 24 }}>
            {activeWorkflows.length === 0 ? (
              <div className="empty-state">Sem workflows ativos.</div>
            ) : (
              activeWorkflows.map((workflow) => (
                <div className="data-block" key={workflow.id}>
                  <div className="data-block-header">
                    <div>
                      <h3 className="data-block-title">{workflow.name}</h3>
                      <div className="data-block-meta" style={{ marginTop: 6 }}>
                        <span style={{ fontFamily: "var(--font-mono)" }}>{workflow.code}</span>
                      </div>
                    </div>
                    <StatusBadge kind={workflow.risk_level === "high" || workflow.risk_level === "critical" ? "danger" : (workflow.risk_level === "low" ? "success" : "warning")}>
                      Risco {workflow.risk_level}
                    </StatusBadge>
                  </div>
                  <p className="description" style={{ marginTop: 12 }}>
                    {workflow.description || "Sem descrição detalhada configurada no momento."}
                  </p>
                  <div className="meta-row" style={{ marginTop: 12, fontSize: "0.80rem", color: "var(--muted)" }}>
                    <span>Categoria: {workflow.category || "Sistema"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="panel pad" style={{ borderTop: "4px solid var(--muted)" }}>
          <div className="section-head">
            <div className="flex-row">
              <div style={{ color: "var(--muted)" }}><ShieldAlert size={24} /></div>
              <div>
                <p className="eyebrow">Desativados</p>
                <h2>Workflows Inativos ou em Draft</h2>
              </div>
            </div>
          </div>
          <div className="list-stack" style={{ marginTop: 24 }}>
            {inactiveWorkflows.length === 0 ? (
              <div className="empty-state">Todos os workflows conhecidos estão ativos.</div>
            ) : (
              inactiveWorkflows.map((workflow) => (
                <div className="data-block" key={workflow.id} style={{ opacity: 0.7 }}>
                  <div className="data-block-header">
                    <div>
                      <h3 className="data-block-title">{workflow.name}</h3>
                      <div className="data-block-meta" style={{ marginTop: 6 }}>
                        <span style={{ fontFamily: "var(--font-mono)" }}>{workflow.code}</span>
                      </div>
                    </div>
                    <StatusBadge kind="neutral">Inativo</StatusBadge>
                  </div>
                  <p className="description" style={{ marginTop: 12 }}>
                    {workflow.description || "Sem descrição."}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
