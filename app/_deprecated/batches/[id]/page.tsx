import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseDecisionPanel } from "@/components/case-decision-panel";
import { GenerateCaseDraftButton } from "@/components/generate-case-draft-button";
import { StatusBadge } from "@/components/status-badge";
import { getLatestReviewBrief } from "@/lib/ops-data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Detalhe do Caso | Wolfie Ops" };

function categoryTone(category: string) {
  if (category === "editorial") return "warning";
  if (category === "curricular") return "info";
  return "neutral";
}

function readStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function readOptionRows(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      label: typeof item.label === "string" ? item.label : "?",
      text: typeof item.text === "string" ? item.text : "",
      isCorrect: item.is_correct === true,
    }))
    .filter((item) => item.text.trim().length > 0);
}

function readDraftExamples(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object");
}

export default async function BatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const batchId = decodeURIComponent(id);
  const latestBrief = await getLatestReviewBrief();

  if (!latestBrief) {
    notFound();
  }

  const cases = latestBrief.cases ?? [];
  const batch = cases.find((entry) => entry.id === batchId);

  if (!batch) {
    notFound();
  }

  const items = latestBrief.items.filter((item) => batch.itemIds.includes(item.id));

  return (
    <div className="dashboard-stack">
      <header className="page-header">
        <div className="flex-row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div>
            <Link
              href="/batches"
              style={{
                color: "var(--fg-muted)",
                textDecoration: "none",
                fontSize: "0.9rem",
                display: "inline-block",
                marginBottom: "8px",
              }}
            >
              &larr; Voltar aos casos
            </Link>
            <h1 className="page-title">{batch.title}</h1>
            <p className="page-description" style={{ marginTop: 8, maxWidth: 860 }}>
              {batch.summary}
            </p>
          </div>
          <div className="flex-row" style={{ gap: 8, alignItems: "center" }}>
            <StatusBadge kind={categoryTone(batch.category) as "warning" | "info" | "neutral"}>
              {batch.category}
            </StatusBadge>
            <StatusBadge kind={batch.decisionStatus === "accepted" ? "success" : batch.decisionStatus === "deferred" ? "warning" : "neutral"}>
              {batch.humanStatus}
            </StatusBadge>
            <StatusBadge kind={batch.highPriorityCount > 0 ? "danger" : "warning"}>
              {batch.pendingCount} por decidir
            </StatusBadge>
          </div>
        </div>
      </header>

      <section className="panel pad" style={{ borderTop: "4px solid var(--accent)", maxWidth: 900, margin: "0 auto", position: "relative", paddingBottom: 100 }}>
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: 16 }}>Análise do Padrão</h2>
          <div className="triage-content-box">
            <h4>Problema Encontrado</h4>
            <p>{batch.problem}</p>
          </div>
          <div className="triage-content-box triage-diff">
            <h4>A Nossa Sugestão</h4>
            <p>{batch.changeSummary}</p>
          </div>
        </div>

        <div className="panel-grid two" style={{ marginBottom: 40, padding: 24, background: "var(--surface-raised)", borderRadius: "var(--radius)" }}>
          <div>
            <strong style={{ display: "block", marginBottom: 8, color: "var(--muted)" }}>Impacto Esperado</strong>
            <p className="description" style={{ margin: 0 }}>{batch.impact}</p>
          </div>
          <div>
            <strong style={{ display: "block", marginBottom: 8, color: "var(--muted)" }}>Resultado Final</strong>
            <p className="description" style={{ margin: 0 }}>{batch.expectedOutcome}</p>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <CaseDecisionPanel
            briefId={latestBrief.id}
            caseId={batch.id}
            currentStatus={batch.decisionStatus}
          />
        </div>

        {batch.decisionStatus === "accepted" ? (
          <div
            style={{
              marginTop: 20,
              padding: "16px",
              background: "var(--surface)",
              borderRadius: 10,
              border: "1px solid var(--border)",
            }}
          >
            <div className="section-head" style={{ marginBottom: 12 }}>
              <div>
                <strong style={{ display: "block", marginBottom: 6 }}>Próximo passo</strong>
                <p className="description" style={{ margin: 0 }}>
                  Agora já faz sentido preparar a proposta concreta de alteração para este caso.
                </p>
              </div>
              <GenerateCaseDraftButton
                briefId={latestBrief.id}
                caseId={batch.id}
                currentDraftStatus={batch.draftStatus}
              />
            </div>
          </div>
        ) : null}

        {batch.draftPackage ? (
          <div
            style={{
              marginTop: 20,
              padding: "18px",
              background: "rgba(180, 145, 104, 0.08)",
              borderRadius: 10,
              border: "1px solid rgba(180, 145, 104, 0.2)",
            }}
          >
            <div className="section-head" style={{ marginBottom: 16 }}>
              <div>
                <strong style={{ display: "block", marginBottom: 6 }}>Proposta concreta</strong>
                <p className="description" style={{ margin: 0 }}>
                  {typeof batch.draftPackage.summary === "string"
                    ? batch.draftPackage.summary
                    : "O sistema preparou uma proposta concreta para revisão final."}
                </p>
              </div>
              <StatusBadge kind="success">Pronta</StatusBadge>
            </div>

            {typeof batch.draftPackage.why_now === "string" ? (
              <div className="stack-item" style={{ marginBottom: 14 }}>
                <strong>Porque agora</strong>
                <p className="description" style={{ marginTop: 6 }}>{batch.draftPackage.why_now}</p>
              </div>
            ) : null}

            {Array.isArray(batch.draftPackage.action_checklist) && batch.draftPackage.action_checklist.length > 0 ? (
              <div className="stack-item" style={{ marginBottom: 14 }}>
                <strong>Checklist editorial</strong>
                <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "var(--fg-muted)" }}>
                  {batch.draftPackage.action_checklist.map((item) => (
                    <li key={String(item)}>{String(item)}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="list-stack">
              {readDraftExamples(batch.draftPackage.example_changes).map((example, index) => (
                <div key={`${batch.id}-draft-${index}`} className="data-block">
                  <strong>{typeof example.item_title === "string" ? example.item_title : `Exemplo ${index + 1}`}</strong>
                  {typeof example.original_statement === "string" ? (
                    <p className="description" style={{ marginTop: 8 }}>
                      <strong>Enunciado atual:</strong> {example.original_statement}
                    </p>
                  ) : null}
                  {typeof example.proposed_statement === "string" ? (
                    <p className="description" style={{ marginTop: 8 }}>
                      <strong>Enunciado sugerido:</strong> {example.proposed_statement}
                    </p>
                  ) : null}
                  {typeof example.proposed_explanation === "string" ? (
                    <p className="description" style={{ marginTop: 8 }}>
                      <strong>Explicação sugerida:</strong> {example.proposed_explanation}
                    </p>
                  ) : null}
                  {Array.isArray(example.distractor_notes) && example.distractor_notes.length > 0 ? (
                    <p className="description" style={{ marginTop: 8 }}>
                      <strong>Distratores:</strong> {example.distractor_notes.map(String).join(" ")}
                    </p>
                  ) : null}
                  {Array.isArray(example.tags_suggested) && example.tags_suggested.length > 0 ? (
                    <p className="description" style={{ marginTop: 8 }}>
                      <strong>Tags sugeridas:</strong> {example.tags_suggested.map(String).join(", ")}
                    </p>
                  ) : null}
                  {typeof example.subtopic_suggested === "string" ? (
                    <p className="description" style={{ marginTop: 8 }}>
                      <strong>Subtema sugerido:</strong> {example.subtopic_suggested}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex-row" style={{ marginTop: 20, gap: 12 }}>
          <Link className="button secondary" href={`/briefs/${latestBrief.id}`}>
            Abrir revisão completa
          </Link>
        </div>
      </section>

      <section className="panel pad" style={{ maxWidth: 900, margin: "0 auto", marginTop: 32 }}>
        <div className="section-head" style={{ marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--line)" }}>
          <div>
            <h2 style={{ fontSize: "1.2rem", margin: 0 }}>Amostra de Perguntas Afetadas</h2>
            <p className="description" style={{ margin: "4px 0 0" }}>Avalia o padrão nestes exemplos.</p>
          </div>
        </div>

        <div className="list-stack">
          {items.map((item) => (
            <div className="data-block" key={item.id} style={{ background: "var(--surface)" }}>
              <div className="data-block-header">
                <div>
                  <h3 className="data-block-title">{item.title}</h3>
                </div>
              </div>

              <div className="list-stack" style={{ marginTop: 14 }}>
                <div className="stack-item">
                  <strong style={{ color: "var(--muted)" }}>O Erro</strong>
                  <p className="description" style={{ marginTop: 6, color: "var(--text)" }}>{item.problem}</p>
                </div>
                {typeof item.metadata?.suggested_fix_preview === "string" ? (
                  <div className="stack-item" style={{ marginTop: 12, padding: 12, background: "var(--bg-subtle)", borderRadius: 6 }}>
                    <strong style={{ color: "var(--info)" }}>Preview da Correção</strong>
                    <p className="description" style={{ marginTop: 6, color: "var(--text)", fontFamily: "monospace", fontSize: "0.85rem" }}>{item.metadata.suggested_fix_preview}</p>
                  </div>
                ) : null}
              </div>

              <details style={{ marginTop: 16 }}>
                <summary style={{ cursor: "pointer", fontWeight: 600, color: "var(--accent)", fontSize: "0.85rem" }}>
                  Inspecionar pergunta completa
                </summary>
                <div className="list-stack" style={{ marginTop: 16, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
                  {typeof item.metadata?.statement_preview === "string" ? (
                    <div className="stack-item">
                      <strong style={{ color: "var(--muted)", fontSize: "0.8rem", textTransform: "uppercase" }}>Enunciado Original</strong>
                      <p className="description" style={{ marginTop: 6 }}>{item.metadata.statement_preview}</p>
                    </div>
                  ) : null}
                  {readOptionRows(item.metadata?.options_current).length > 0 ? (
                    <div className="stack-item" style={{ marginTop: 16 }}>
                      <strong style={{ color: "var(--muted)", fontSize: "0.8rem", textTransform: "uppercase" }}>Opções</strong>
                      <div className="list-stack" style={{ marginTop: 8 }}>
                        {readOptionRows(item.metadata?.options_current).map((option) => (
                          <div
                            key={`${item.id}-${option.label}`}
                            style={{
                              padding: "10px 14px",
                              border: option.isCorrect ? "1px solid var(--success-soft)" : "1px solid var(--line)",
                              background: option.isCorrect ? "rgba(52, 211, 153, 0.05)" : "transparent",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "0.9rem"
                            }}
                          >
                            <strong style={{ color: option.isCorrect ? "var(--success)" : "inherit" }}>{option.label})</strong> {option.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {typeof item.metadata?.explanation_current === "string" ? (
                    <div className="stack-item" style={{ marginTop: 16 }}>
                      <strong style={{ color: "var(--muted)", fontSize: "0.8rem", textTransform: "uppercase" }}>Explicação Atual</strong>
                      <p className="description" style={{ marginTop: 6 }}>{item.metadata.explanation_current}</p>
                    </div>
                  ) : null}
                </div>
              </details>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
