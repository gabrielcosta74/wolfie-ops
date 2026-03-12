import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { listReviewBriefs } from "@/lib/ops-data";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const briefs = await listReviewBriefs();

  return (
    <div className="dashboard-stack">
      <header className="page-header">
        <h1 className="page-title">Historico</h1>
        <p className="page-description">
          Relatorios semanais, mensais e manuais ja gerados. Esta pagina substitui o modelo antigo de navegar proposal a proposal sem contexto agregado.
        </p>
      </header>

      <section className="panel pad" style={{ borderTop: "4px solid var(--accent)" }}>
        <div className="table-wrap">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Relatorio</th>
                <th>Periodo</th>
                <th>Resumo</th>
                <th>Itens</th>
                <th>Status</th>
                <th>Criado</th>
              </tr>
            </thead>
            <tbody>
              {briefs.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">Ainda nao existem review briefs.</div>
                  </td>
                </tr>
              ) : (
                briefs.map((brief) => (
                  <tr key={brief.id}>
                    <td>
                      <Link className="link-inline" href={`/briefs/${brief.id}`}>
                        <strong>{brief.title}</strong>
                      </Link>
                    </td>
                    <td>{brief.period_type}</td>
                    <td style={{ maxWidth: 420 }}>
                      <span className="description" style={{ fontSize: "0.85rem" }}>{brief.summary}</span>
                    </td>
                    <td>{brief.item_count}</td>
                    <td>
                      <StatusBadge kind={brief.status === "published" ? "success" : "neutral"}>
                        {brief.status}
                      </StatusBadge>
                    </td>
                    <td>{formatDateTime(brief.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
