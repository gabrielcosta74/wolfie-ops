"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, FileText, Lightbulb, Sparkles } from "lucide-react";
import { CaseDecisionPanel } from "@/components/case-decision-panel";
import { GenerateCaseDraftButton } from "@/components/generate-case-draft-button";
import { StatusBadge } from "@/components/status-badge";

type PackageItem = {
  id: string;
  title: string;
  problem: string;
  impact: string;
  expectedOutcome: string;
  changeSummary: string;
  metadata: Record<string, unknown>;
};

type TriagePackage = {
  briefId: string;
  id: string;
  title: string;
  category: string;
  actionType?: string | null;
  summary?: string;
  problem: string;
  impact: string;
  expectedOutcome: string;
  pendingCount: number;
  items: PackageItem[];
  decisionStatus: "pending" | "accepted" | "deferred" | "ignored";
  humanStatus: string;
  draftStatus?: "none" | "ready";
  draftPackage?: Record<string, unknown> | null;
};

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatPercent(value: number | null, digits = 1) {
  if (value === null) return null;
  return `${(value * 100).toFixed(digits)}%`;
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

function readExampleChanges(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object");
}

function categoryLabel(category: string) {
  if (category === "curricular") return "Caso Curricular";
  if (category === "operational") return "Caso Operacional";
  return "Editorial Legado";
}

function categoryTone(category: string): "warning" | "info" | "neutral" {
  if (category === "curricular") return "info";
  if (category === "operational") return "warning";
  return "neutral";
}

function itemTitle(item: PackageItem) {
  return item.title || `Item ${item.id.slice(0, 8)}`;
}

function hasEditorialPreview(item: PackageItem) {
  return Boolean(
    readString(item.metadata?.statement_preview) ||
      readString(item.metadata?.current_explanation) ||
      readString(item.metadata?.suggested_fix_preview) ||
      readOptionRows(item.metadata?.current_options).length > 0,
  );
}

function buildPracticalSuggestion(item: PackageItem) {
  const signalKind = readString(item.metadata?.signal_kind);
  const expectedShare = readNumber(item.metadata?.expected_share);
  const actualShare = readNumber(item.metadata?.actual_share);
  const difficultyBuckets = readNumber(item.metadata?.difficulty_buckets);
  const hardRatio = readNumber(item.metadata?.hard_ratio);
  const quizCount = readNumber(item.metadata?.quiz_count);

  if (signalKind === "under_coverage") {
    const gap = expectedShare !== null && actualShare !== null ? expectedShare - actualShare : null;
    const targetRange =
      gap !== null && gap >= 0.05 ? "10-14" : gap !== null && gap >= 0.03 ? "8-12" : "4-8";
    const difficultyNote =
      difficultyBuckets !== null && difficultyBuckets < 3
        ? "com os três níveis de dificuldade representados"
        : hardRatio !== null && hardRatio < 0.15
          ? "com reforço explícito de itens médios e difíceis"
          : "com variedade de dificuldade suficiente";
    return `Sugestão inicial: preparar backlog para ${targetRange} itens novos ou revistos neste subtema, ${difficultyNote}.`;
  }

  if (signalKind === "low_variety") {
    const hardNote =
      hardRatio !== null && hardRatio < 0.1
        ? "Hoje quase não há treino difícil disponível."
        : "A distribuição de dificuldade está desequilibrada.";
    return `Sugestão inicial: rever a pool atual${quizCount !== null ? ` de ${quizCount} perguntas` : ""}, reduzir repetição de padrão e reforçar sobretudo dificuldade média/difícil. ${hardNote}`;
  }

  if (signalKind === "over_coverage") {
    return "Sugestão inicial: travar expansão deste subtema no backlog e redistribuir esforço editorial para áreas com menor cobertura.";
  }

  return item.changeSummary;
}

function buildEvidenceMetrics(item: PackageItem) {
  const metrics: Array<{ label: string; value: string }> = [];
  const expectedShare = formatPercent(readNumber(item.metadata?.expected_share));
  const actualShare = formatPercent(readNumber(item.metadata?.actual_share));
  const quizCount = readNumber(item.metadata?.quiz_count);
  const officialCount = readNumber(item.metadata?.official_count);
  const weightedCoverage = readNumber(item.metadata?.weighted_coverage);
  const difficultyBuckets = readNumber(item.metadata?.difficulty_buckets);
  const hardRatio = formatPercent(readNumber(item.metadata?.hard_ratio));

  if (expectedShare) metrics.push({ label: "Peso esperado", value: expectedShare });
  if (actualShare) metrics.push({ label: "Cobertura atual", value: actualShare });
  if (quizCount !== null) metrics.push({ label: "Perguntas quiz", value: String(quizCount) });
  if (officialCount !== null) metrics.push({ label: "Exercícios oficiais", value: String(officialCount) });
  if (weightedCoverage !== null) metrics.push({ label: "Cobertura ponderada", value: String(weightedCoverage) });
  if (difficultyBuckets !== null) metrics.push({ label: "Níveis presentes", value: `${difficultyBuckets}/3` });
  if (hardRatio) metrics.push({ label: "Peso difícil", value: hardRatio });

  return metrics;
}

function EvidenceSection({ examples }: { examples: PackageItem[] }) {
  return (
    <section className="panel pad" style={{ marginBottom: 24 }}>
      <div className="section-head" style={{ marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.15rem" }}>Evidência do caso</h2>
          <p className="description" style={{ margin: "6px 0 0" }}>
            O detalhe abaixo deve ajudar a perceber porque é que este caso entrou na Inbox e que ação prática faz sentido.
          </p>
        </div>
      </div>

      <div className="list-stack">
        {examples.map((item) => {
          const themeName = readString(item.metadata?.theme_name);
          const subtopicName = readString(item.metadata?.subtopic_name);
          const whyNow = readString(item.metadata?.why_now) || item.impact;
          const evidenceMetrics = buildEvidenceMetrics(item);
          const recommendation = buildPracticalSuggestion(item);

          return (
            <div className="data-block" key={item.id}>
              <div className="data-block-header">
                <div>
                  <h3 className="data-block-title">{itemTitle(item)}</h3>
                  <p className="description" style={{ margin: "6px 0 0" }}>{item.problem}</p>
                </div>
              </div>

              {(themeName || subtopicName) ? (
                <div className="flex-row" style={{ gap: 12, marginTop: 14, flexWrap: "wrap" }}>
                  {themeName ? <span className="metric-note">Tema: {themeName}</span> : null}
                  {subtopicName ? <span className="metric-note">Subtema: {subtopicName}</span> : null}
                </div>
              ) : null}

              <div className="stack-item" style={{ marginTop: 14 }}>
                <strong>Porque apareceu</strong>
                <p className="description" style={{ marginTop: 6, color: "var(--text)" }}>{whyNow}</p>
              </div>

              {evidenceMetrics.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginTop: 14 }}>
                  {evidenceMetrics.map((metric) => (
                    <div key={`${item.id}-${metric.label}`} style={{ padding: 12, borderRadius: 10, background: "var(--bg-subtle)", border: "1px solid var(--line)" }}>
                      <div className="metric-note" style={{ marginBottom: 4 }}>{metric.label}</div>
                      <div style={{ fontSize: "1.05rem", fontWeight: 700 }}>{metric.value}</div>
                    </div>
                  ))}
                </div>
              ) : null}

              <div style={{ marginTop: 14, padding: 12, background: "var(--bg-subtle)", borderRadius: 10, border: "1px solid var(--line)" }}>
                <strong>Próximo passo sugerido</strong>
                <p className="description" style={{ marginTop: 6, color: "var(--text)" }}>{recommendation}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function EditorialExamplesSection({ examples }: { examples: PackageItem[] }) {
  return (
    <section className="panel pad" style={{ marginBottom: 24 }}>
      <div className="section-head" style={{ marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.15rem" }}>Exemplos do caso</h2>
          <p className="description" style={{ margin: "6px 0 0" }}>
            Estas evidências servem para perceber o caso antes da decisão.
          </p>
        </div>
      </div>

      <div className="list-stack">
        {examples.map((item) => {
          const statement = readString(item.metadata?.statement_preview);
          const explanation = readString(item.metadata?.current_explanation);
          const fixPreview = readString(item.metadata?.suggested_fix_preview);
          const tags = readStringArray(item.metadata?.candidate_tags);
          const subtopic = readString(item.metadata?.candidate_subtopic);
          const options = readOptionRows(item.metadata?.current_options);

          return (
            <div className="data-block" key={item.id}>
              <div className="data-block-header">
                <div>
                  <h3 className="data-block-title">{itemTitle(item)}</h3>
                  <p className="description" style={{ margin: "6px 0 0" }}>{item.problem}</p>
                </div>
              </div>

              {statement ? (
                <div className="stack-item" style={{ marginTop: 14 }}>
                  <strong>Enunciado atual</strong>
                  <p className="description" style={{ marginTop: 6, color: "var(--text)" }}>{statement}</p>
                </div>
              ) : null}

              {options.length > 0 ? (
                <div className="stack-item" style={{ marginTop: 14 }}>
                  <strong>Opções atuais</strong>
                  <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "var(--fg-muted)" }}>
                    {options.map((option) => (
                      <li key={`${item.id}-${option.label}`}>
                        <strong>{option.label}.</strong> {option.text}
                        {option.isCorrect ? " (correta)" : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {explanation ? (
                <div className="stack-item" style={{ marginTop: 14 }}>
                  <strong>Explicação atual</strong>
                  <p className="description" style={{ marginTop: 6 }}>{explanation}</p>
                </div>
              ) : null}

              {fixPreview ? (
                <div className="stack-item" style={{ marginTop: 14, padding: 12, background: "var(--bg-subtle)", borderRadius: 8 }}>
                  <strong>Sugestão da IA</strong>
                  <p className="description" style={{ marginTop: 6, color: "var(--text)" }}>{fixPreview}</p>
                </div>
              ) : null}

              {(tags.length > 0 || subtopic) ? (
                <div className="flex-row" style={{ gap: 12, marginTop: 14, flexWrap: "wrap" }}>
                  {tags.length > 0 ? (
                    <span className="metric-note">Tags sugeridas: {tags.join(", ")}</span>
                  ) : null}
                  {subtopic ? (
                    <span className="metric-note">Subtema sugerido: {subtopic}</span>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function FocusTriageView({ pkg }: { pkg: TriagePackage }) {
  const examples = pkg.items.slice(0, 3);
  const isEditorialEvidence = examples.some((item) => hasEditorialPreview(item));
  const hasDraft = Boolean(pkg.draftPackage);
  const draftExamples = readExampleChanges(pkg.draftPackage?.example_changes);
  const checklist = readStringArray(pkg.draftPackage?.action_checklist);

  return (
    <div style={{ padding: "40px 24px 56px", maxWidth: 1080, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/inbox"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--muted)", fontWeight: 600, textDecoration: "none" }}
        >
          <ArrowLeft size={18} />
          Voltar à Caixa de Entrada
        </Link>
      </div>

      <header style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          <StatusBadge kind={categoryTone(pkg.category)}>{categoryLabel(pkg.category)}</StatusBadge>
          <StatusBadge kind={pkg.decisionStatus === "accepted" ? "success" : pkg.decisionStatus === "deferred" ? "warning" : "neutral"}>
            {pkg.humanStatus}
          </StatusBadge>
        </div>
        <h1 style={{ fontSize: "2.2rem", lineHeight: 1.15, margin: 0 }}>{pkg.title}</h1>
        <p style={{ color: "var(--muted)", fontSize: "1.05rem", marginTop: 14, maxWidth: 860 }}>
          {pkg.summary || "Primeiro decides se este caso merece acompanhamento humano. Só depois é preparada uma proposta concreta de ação."}
        </p>
      </header>

      <section className="panel pad" style={{ marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          <div className="data-block">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Lightbulb size={16} style={{ color: "var(--warning)" }} />
              <strong>Problema comum</strong>
            </div>
            <p className="description" style={{ margin: 0, color: "var(--text)" }}>{pkg.problem}</p>
          </div>
          <div className="data-block">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Sparkles size={16} style={{ color: "var(--accent)" }} />
              <strong>Melhoria esperada</strong>
            </div>
            <p className="description" style={{ margin: 0, color: "var(--text)" }}>{pkg.expectedOutcome}</p>
          </div>
          <div className="data-block">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <CheckCircle2 size={16} style={{ color: "var(--success)" }} />
              <strong>Impacto</strong>
            </div>
            <p className="description" style={{ margin: 0, color: "var(--text)" }}>{pkg.impact}</p>
          </div>
        </div>
      </section>

      {isEditorialEvidence ? (
        <EditorialExamplesSection examples={examples} />
      ) : (
        <EvidenceSection examples={examples} />
      )}

      <section className="panel pad" style={{ marginBottom: hasDraft ? 24 : 0 }}>
        <div className="section-head" style={{ marginBottom: 18 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.15rem" }}>Decisão do caso</h2>
            <p className="description" style={{ margin: "6px 0 0" }}>
              Decide apenas se vale a pena avançar com este caso nesta revisão.
            </p>
          </div>
        </div>

        <CaseDecisionPanel briefId={pkg.briefId} caseId={pkg.id} currentStatus={pkg.decisionStatus} />

        {pkg.decisionStatus === "accepted" ? (
          <div style={{ marginTop: 20, padding: 16, background: "var(--bg-subtle)", border: "1px solid var(--line)", borderRadius: 12 }}>
            <div className="section-head" style={{ marginBottom: 12 }}>
              <div>
                <strong>Próximo passo</strong>
                <p className="description" style={{ margin: "6px 0 0" }}>
                  O caso já foi aceite. Agora podes pedir à IA que prepare a proposta concreta.
                </p>
              </div>
              <GenerateCaseDraftButton briefId={pkg.briefId} caseId={pkg.id} currentDraftStatus={pkg.draftStatus} />
            </div>
          </div>
        ) : null}
      </section>

      {hasDraft ? (
        <section className="panel pad">
          <div className="section-head" style={{ marginBottom: 18 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.15rem" }}>Proposta concreta</h2>
              <p className="description" style={{ margin: "6px 0 0" }}>
                Este é o pacote gerado pela IA para revisão final humana.
              </p>
            </div>
            <StatusBadge kind="success">Pronta</StatusBadge>
          </div>

          {readString(pkg.draftPackage?.summary) ? (
            <div className="data-block" style={{ marginBottom: 16 }}>
              <strong>Resumo</strong>
              <p className="description" style={{ marginTop: 6, color: "var(--text)" }}>
                {readString(pkg.draftPackage?.summary)}
              </p>
            </div>
          ) : null}

          {readString(pkg.draftPackage?.why_now) ? (
            <div className="data-block" style={{ marginBottom: 16 }}>
              <strong>Porque agora</strong>
              <p className="description" style={{ marginTop: 6 }}>{readString(pkg.draftPackage?.why_now)}</p>
            </div>
          ) : null}

          {checklist.length > 0 ? (
            <div className="data-block" style={{ marginBottom: 16 }}>
              <strong>Checklist editorial</strong>
              <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "var(--fg-muted)" }}>
                {checklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="list-stack">
            {draftExamples.map((example, index) => {
              const title = readString(example.item_title) ?? `Exemplo ${index + 1}`;
              const originalStatement = readString(example.original_statement);
              const proposedStatement = readString(example.proposed_statement);
              const proposedExplanation = readString(example.proposed_explanation);
              const distractorNotes = readStringArray(example.distractor_notes);
              const tagsSuggested = readStringArray(example.tags_suggested);
              const subtopicSuggested = readString(example.subtopic_suggested);

              return (
                <div className="data-block" key={`${pkg.id}-draft-${index}`}>
                  <div className="data-block-header">
                    <h3 className="data-block-title">{title}</h3>
                  </div>
                  {originalStatement ? (
                    <p className="description" style={{ marginTop: 8 }}>
                      <strong>Enunciado atual:</strong> {originalStatement}
                    </p>
                  ) : null}
                  {proposedStatement ? (
                    <p className="description" style={{ marginTop: 8, color: "var(--text)" }}>
                      <strong>Enunciado sugerido:</strong> {proposedStatement}
                    </p>
                  ) : null}
                  {proposedExplanation ? (
                    <p className="description" style={{ marginTop: 8 }}>
                      <strong>Explicação sugerida:</strong> {proposedExplanation}
                    </p>
                  ) : null}
                  {distractorNotes.length > 0 ? (
                    <p className="description" style={{ marginTop: 8 }}>
                      <strong>Distratores:</strong> {distractorNotes.join(" ")}
                    </p>
                  ) : null}
                  {tagsSuggested.length > 0 ? (
                    <p className="description" style={{ marginTop: 8 }}>
                      <strong>Tags sugeridas:</strong> {tagsSuggested.join(", ")}
                    </p>
                  ) : null}
                  {subtopicSuggested ? (
                    <p className="description" style={{ marginTop: 8 }}>
                      <strong>Subtema sugerido:</strong> {subtopicSuggested}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 18, padding: 16, background: "var(--bg-subtle)", borderRadius: 12, border: "1px solid var(--line)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <FileText size={16} style={{ color: "var(--accent)" }} />
              <strong>Decisão Final</strong>
            </div>
            <p className="description" style={{ margin: "0 0 16px 0" }}>
              Analisa a proposta concreta gerada pela IA. Se tudo estiver correto, aprova as alterações para entrarem no ecossistema do Wolfi.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="action-btn" type="button" disabled style={{ background: "transparent", color: "var(--danger)", border: "1px solid var(--danger)", padding: "8px 16px", borderRadius: 8, fontWeight: 600 }}>
                Rejeitar Proposta
              </button>
              <button className="action-btn" type="button" disabled style={{ background: "transparent", color: "var(--warning)", border: "1px solid var(--warning)", padding: "8px 16px", borderRadius: 8, fontWeight: 600 }}>
                Pedir Revisão
              </button>
              <button className="action-btn" type="button" disabled style={{ background: "var(--success)", color: "white", border: "none", padding: "8px 24px", borderRadius: 8, fontWeight: 600, marginLeft: "auto" }}>
                Aprovar Proposta
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
