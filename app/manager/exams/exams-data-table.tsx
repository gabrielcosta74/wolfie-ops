"use client";

import type { CSSProperties, FormEvent } from "react";
import { useEffect, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, CheckCircle, Eye, Image as ImageIcon, Save } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MathText } from "@/components/math-text";
import { updateExamQuestion } from "./actions";
import styles from "./exams-data-table.module.css";

type ExamQuestion = {
  id: string;
  exam_year: number;
  exam_phase: number;
  question_number: string;
  cotacao: number;
  question_text: string;
  question_type: string;
  has_image: boolean | null;
  image_url: string | null;
  opcao_a: string | null;
  opcao_b: string | null;
  opcao_c: string | null;
  opcao_d: string | null;
  opcao_correta: string | null;
  grading_rubric: unknown;
  subtopic_id: number | null;
  topics_covered: string[] | null;
  difficulty_level: string | null;
  created_at: string | null;
  updated_at: string | null;
  is_optional: boolean | null;
  parent_question_number: string | null;
  edu_subtemas_exame: { nome: string } | null;
};

type Props = {
  questions: ExamQuestion[];
  totalCount: number;
  activeFilters: { type: string; difficulty: string; optional: string };
};

const typeLabels: Record<string, string> = {
  multiple_choice: "Escolha Múltipla",
  open_ended: "Desenvolvimento",
  procedural: "Procedimental",
  proof: "Demonstração",
  graph: "Gráfico",
};

const typeBadgeColors: Record<string, string> = {
  multiple_choice: "info",
  open_ended: "warning",
  procedural: "accent",
  proof: "danger",
  graph: "success",
};

const diffLabels: Record<string, string> = {
  "básico": "Básico",
  "intermédio": "Intermédio",
  "avançado": "Avançado",
};

const diffBadgeColors: Record<string, string> = {
  "básico": "success",
  "intermédio": "warning",
  "avançado": "danger",
};

export function ExamsDataTable({ questions, totalCount, activeFilters }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [selectedId, setSelectedId] = useState<string | null>(questions[0]?.id ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
    if (questions.length === 0) {
      setSelectedId(null);
      return;
    }

    if (!selectedId || !questions.some((question) => question.id === selectedId)) {
      setSelectedId(questions[0].id);
    }
  }, [questions, selectedId]);

  const selectedIndex = questions.findIndex((question) => question.id === selectedId);
  const selected = selectedIndex >= 0 ? questions[selectedIndex] : null;

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, button, summary")) return;
      if (!selected || questions.length <= 1) return;

      if (event.key === "ArrowRight" && selectedIndex < questions.length - 1) {
        event.preventDefault();
        setSelectedId(questions[selectedIndex + 1].id);
      }

      if (event.key === "ArrowLeft" && selectedIndex > 0) {
        event.preventDefault();
        setSelectedId(questions[selectedIndex - 1].id);
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [questions, selected, selectedIndex]);

  const buildUrl = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    return `${pathname}?${params.toString()}`;
  };

  const navigate = (updates: Record<string, string>) => {
    startTransition(() => router.push(buildUrl(updates)));
  };

  const goToQuestion = (direction: -1 | 1) => {
    if (!selected) return;
    const nextIndex = selectedIndex + direction;
    if (nextIndex < 0 || nextIndex >= questions.length) return;
    setSelectedId(questions[nextIndex].id);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;

    setIsSaving(true);
    const formData = new FormData(event.currentTarget);
    const result = await updateExamQuestion(selected.id, {
      question_text: String(formData.get("question_text") || ""),
      opcao_a: String(formData.get("opcao_a") || ""),
      opcao_b: String(formData.get("opcao_b") || ""),
      opcao_c: String(formData.get("opcao_c") || ""),
      opcao_d: String(formData.get("opcao_d") || ""),
      opcao_correta: String(formData.get("opcao_correta") || ""),
      cotacao: Number(formData.get("cotacao") || 0),
      difficulty_level: String(formData.get("difficulty_level") || ""),
      is_optional: formData.get("is_optional") === "true",
      question_type: String(formData.get("question_type") || ""),
    });

    setIsSaving(false);

    if (!result.success) {
      alert(`Erro ao guardar: ${result.error}`);
      return;
    }

    startTransition(() => router.refresh());
  };

  const visibleFields = selected
    ? [
        { label: "ID", value: selected.id },
        { label: "exam_year", value: selected.exam_year },
        { label: "exam_phase", value: selected.exam_phase },
        { label: "question_number", value: selected.question_number },
        { label: "cotacao", value: selected.cotacao },
        { label: "question_text", value: selected.question_text, math: true },
        { label: "question_type", value: selected.question_type },
        { label: "has_image", value: selected.has_image },
        { label: "image_url", value: selected.image_url },
        { label: "opcao_a", value: selected.opcao_a, math: true },
        { label: "opcao_b", value: selected.opcao_b, math: true },
        { label: "opcao_c", value: selected.opcao_c, math: true },
        { label: "opcao_d", value: selected.opcao_d, math: true },
        { label: "opcao_correta", value: selected.opcao_correta },
        { label: "grading_rubric", value: selected.grading_rubric, preformatted: true },
        { label: "subtopic_id", value: selected.subtopic_id },
        { label: "topics_covered", value: selected.topics_covered },
        { label: "difficulty_level", value: selected.difficulty_level },
        { label: "created_at", value: selected.created_at },
        { label: "updated_at", value: selected.updated_at },
        { label: "is_optional", value: selected.is_optional },
        { label: "parent_question_number", value: selected.parent_question_number },
        { label: "subtema_nome", value: selected.edu_subtemas_exame?.nome ?? null },
      ]
    : [];

  const layoutClassName = `${styles.layout} ${focusMode ? styles.layoutFocus : ""}`;

  return (
    <div className={layoutClassName}>
      {!focusMode && (
        <aside className={`panel pad ${styles.sidebar}`}>
          <div className={styles.sidebarHeader}>
            <div>
              <div className={styles.viewerKicker}>Índice do Exame</div>
              <h2 style={{ margin: "6px 0 0", fontSize: "1.35rem", letterSpacing: "-0.03em" }}>Perguntas</h2>
            </div>

            <div className={styles.filters}>
              <select
                value={activeFilters.type}
                onChange={(event) => navigate({ type: event.target.value })}
                style={selectStyle}
              >
                <option value="">Todos os Tipos</option>
                {Object.entries(typeLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>

              <select
                value={activeFilters.difficulty}
                onChange={(event) => navigate({ difficulty: event.target.value })}
                style={selectStyle}
              >
                <option value="">Todas Dificuldades</option>
                {Object.entries(diffLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>

              <select
                value={activeFilters.optional}
                onChange={(event) => navigate({ optional: event.target.value })}
                style={selectStyle}
              >
                <option value="">Obrigatória + Opcional</option>
                <option value="false">Obrigatórias</option>
                <option value="true">Opcionais</option>
              </select>

              {Object.values(activeFilters).some(Boolean) && (
                <button className="button ghost" onClick={() => navigate({ type: "", difficulty: "", optional: "" })}>
                  Limpar filtros
                </button>
              )}
            </div>

            <div className={styles.sidebarMeta}>
              <span>{totalCount} questão(ões)</span>
              <span>{selected ? `Selecionada: Q${selected.question_number}` : "Sem seleção"}</span>
              <span>Setas esquerda/direita para navegar</span>
            </div>
          </div>

          <div className={styles.questionList} style={{ opacity: isPending ? 0.55 : 1 }}>
            {questions.map((question) => {
              const isActive = question.id === selectedId;
              return (
                <button
                  key={question.id}
                  type="button"
                  className={`${styles.questionButton} ${isActive ? styles.questionButtonActive : ""}`}
                  onClick={() => setSelectedId(question.id)}
                >
                  <div className={styles.questionButtonTop}>
                    <span className={styles.questionNumber}>Q{question.question_number}</span>
                    <span className="badge neutral">{question.cotacao} pts</span>
                  </div>

                  <div className={styles.questionBadges}>
                    <span className={`badge ${typeBadgeColors[question.question_type] || "neutral"}`}>
                      {typeLabels[question.question_type] || question.question_type}
                    </span>
                    <span className={`badge ${diffBadgeColors[question.difficulty_level || ""] || "neutral"}`}>
                      {diffLabels[question.difficulty_level || ""] || question.difficulty_level || "Sem nível"}
                    </span>
                    {question.is_optional ? <span className="badge warning">Opcional</span> : <span className="badge success">Obrigatória</span>}
                    {question.has_image ? <span className="badge info">Imagem</span> : null}
                  </div>

                  <div className={styles.questionPreview}>
                    <MathText text={question.question_text} />
                  </div>
                </button>
              );
            })}

            {questions.length === 0 ? (
              <div className={styles.emptyState}>Nenhuma questão encontrada com os filtros atuais.</div>
            ) : null}
          </div>
        </aside>
      )}

      <section className={`panel pad ${styles.viewer}`}>
        {selected ? (
          <>
            <header className={styles.viewerHeader}>
              <div className={styles.viewerHeaderText}>
                <div className={styles.viewerKicker}>
                  Exame {selected.exam_year} · {selected.exam_phase}ª Fase · Pergunta {selected.question_number}
                </div>
                <h2 className={styles.viewerTitle}>Viewer de Questão</h2>
                <p className={styles.viewerSubtitle}>
                  Visualização completa do registo, com enunciado, opções, critérios, campos da tabela e navegação contínua para revisão administrativa.
                </p>
              </div>

              <div className={styles.viewerHeaderActions}>
                <button className="button ghost" onClick={() => setFocusMode((value) => !value)}>
                  {focusMode ? "Mostrar índice" : "Modo foco"}
                </button>

                <div className={styles.navButtons}>
                  <button
                    type="button"
                    className={`button ghost ${styles.navButton}`}
                    onClick={() => goToQuestion(-1)}
                    disabled={selectedIndex <= 0}
                  >
                    <ChevronLeft size={16} /> Anterior
                  </button>
                  <button
                    type="button"
                    className={`button ghost ${styles.navButton}`}
                    onClick={() => goToQuestion(1)}
                    disabled={selectedIndex >= questions.length - 1}
                  >
                    Próxima <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </header>

            <div className={styles.viewerBody}>
              <div className={styles.mainColumn}>
                <section className={styles.card}>
                  <div className={styles.cardTitleRow}>
                    <h3 className={styles.cardTitle}>Enunciado</h3>
                    <div className={styles.questionBadges}>
                      <span className={`badge ${typeBadgeColors[selected.question_type] || "neutral"}`}>
                        {typeLabels[selected.question_type] || selected.question_type}
                      </span>
                      <span className={`badge ${diffBadgeColors[selected.difficulty_level || ""] || "neutral"}`}>
                        {diffLabels[selected.difficulty_level || ""] || selected.difficulty_level || "Sem nível"}
                      </span>
                      <span className="badge neutral">{selected.cotacao} pts</span>
                      {selected.is_optional ? <span className="badge warning">Opcional</span> : <span className="badge success">Obrigatória</span>}
                    </div>
                  </div>

                  <div className={styles.statement}>
                    <MathText text={selected.question_text} />
                  </div>
                </section>

                {isMultipleChoice(selected) ? (
                  <section className={styles.card}>
                    <div className={styles.cardTitleRow}>
                      <h3 className={styles.cardTitle}>Opções</h3>
                      {selected.opcao_correta ? <span className="badge success">Correta: {selected.opcao_correta}</span> : null}
                    </div>

                    <div className={styles.optionsList}>
                      {(["A", "B", "C", "D"] as const).map((letter) => {
                        const value = selected[`opcao_${letter.toLowerCase()}` as keyof ExamQuestion] as string | null;
                        if (!value) return null;

                        const isCorrect = selected.opcao_correta?.trim() === letter;
                        return (
                          <div key={letter} className={`${styles.optionRow} ${isCorrect ? styles.optionRowCorrect : ""}`}>
                            <span className={styles.optionLetter}>{letter}</span>
                            <div className={styles.statement}>
                              <MathText text={value} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ) : null}

                {selected.has_image && selected.image_url ? (
                  <section className={styles.card}>
                    <div className={styles.cardTitleRow}>
                      <h3 className={styles.cardTitle}>Imagem Associada</h3>
                      <a className="badge info" href={selected.image_url} target="_blank" rel="noreferrer">
                        Abrir URL
                      </a>
                    </div>
                    <div className={styles.imageFrame}>
                      <img className={styles.image} src={selected.image_url} alt={`Questão ${selected.question_number}`} />
                    </div>
                  </section>
                ) : null}

                <section className={styles.card}>
                  <div className={styles.cardTitleRow}>
                    <h3 className={styles.cardTitle}>Critérios de Correção</h3>
                    <span className="badge neutral">JSONB renderizado</span>
                  </div>
                  <RubricDisplay rubric={selected.grading_rubric} />
                </section>

                <section className={styles.card}>
                  <div className={styles.cardTitleRow}>
                    <h3 className={styles.cardTitle}>Campos da Tabela</h3>
                    <span className="badge neutral">`exame_nacional_questions`</span>
                  </div>

                  <div className={styles.rawFields}>
                    {visibleFields.map((field) => (
                      <div key={field.label} className={styles.fieldRow}>
                        <span className={styles.infoLabel}>{field.label}</span>
                        <div className={styles.fieldValue}>
                          <FieldValue value={field.value} math={field.math} preformatted={field.preformatted} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <aside className={styles.sideColumn}>
                <section className={styles.card}>
                  <div className={styles.cardTitleRow}>
                    <h3 className={styles.cardTitle}>Resumo Rápido</h3>
                    <span className="badge neutral">
                      {selectedIndex + 1}/{questions.length}
                    </span>
                  </div>

                  <div className={styles.infoGrid}>
                    <InfoTile label="Questão" value={`Q${selected.question_number}`} />
                    <InfoTile label="Subtema ID" value={selected.subtopic_id} />
                    <InfoTile label="Subtema" value={selected.edu_subtemas_exame?.nome ?? "—"} />
                    <InfoTile label="Parent" value={selected.parent_question_number ?? "—"} />
                    <InfoTile label="Imagem" value={selected.has_image ? "Sim" : "Não"} />
                    <InfoTile label="Atualizado" value={formatDateTime(selected.updated_at)} />
                  </div>
                </section>

                <section className={styles.card}>
                  <div className={styles.cardTitleRow}>
                    <h3 className={styles.cardTitle}>Tópicos Cobertos</h3>
                    <span className="badge neutral">
                      {selected.topics_covered?.length ?? 0}
                    </span>
                  </div>

                  {selected.topics_covered?.length ? (
                    <div className={styles.topics}>
                      {selected.topics_covered.map((topic) => (
                        <span key={topic} className="badge accent">
                          {topic}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.infoValue}>Sem tópicos listados neste registo.</div>
                  )}
                </section>

                <details className={styles.editorDetails}>
                  <summary className={styles.editorSummary}>
                    Edição rápida
                    <span className="badge neutral">Admin</span>
                  </summary>

                  <form key={selected.id} className={styles.editorForm} onSubmit={handleSave}>
                    <div>
                      <label className={styles.fieldLabel}>Enunciado</label>
                      <textarea name="question_text" defaultValue={selected.question_text} rows={6} style={inputStyle} />
                    </div>

                    {isMultipleChoice(selected) ? (
                      <div style={{ display: "grid", gap: 10 }}>
                        <label className={styles.fieldLabel}>Opções</label>
                        {(["A", "B", "C", "D"] as const).map((letter) => {
                          const isCorrect = selected.opcao_correta?.trim() === letter;
                          const optionValue = selected[`opcao_${letter.toLowerCase()}` as keyof ExamQuestion] as string | null;
                          return (
                            <div key={letter} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 48, display: "flex", alignItems: "center", gap: 4 }}>
                                <input
                                  id={`${selected.id}-${letter}`}
                                  type="radio"
                                  name="opcao_correta"
                                  value={letter}
                                  defaultChecked={isCorrect}
                                  style={{ accentColor: "var(--accent)" }}
                                />
                                <label htmlFor={`${selected.id}-${letter}`} style={{ fontWeight: 700 }}>
                                  {letter}
                                </label>
                              </div>
                              <input
                                type="text"
                                name={`opcao_${letter.toLowerCase()}`}
                                defaultValue={optionValue ?? ""}
                                style={{
                                  ...inputStyle,
                                  borderColor: isCorrect ? "rgba(16, 185, 129, 0.45)" : "var(--line)",
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    ) : null}

                    <div className={styles.formGrid}>
                      <div>
                        <label className={styles.fieldLabel}>Cotação</label>
                        <input type="number" min={0} name="cotacao" defaultValue={selected.cotacao} style={inputStyle} />
                      </div>
                      <div>
                        <label className={styles.fieldLabel}>Tipo</label>
                        <select name="question_type" defaultValue={selected.question_type} style={selectStyle}>
                          {Object.entries(typeLabels).map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className={styles.formGrid}>
                      <div>
                        <label className={styles.fieldLabel}>Dificuldade</label>
                        <select name="difficulty_level" defaultValue={selected.difficulty_level || ""} style={selectStyle}>
                          {Object.entries(diffLabels).map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={styles.fieldLabel}>Opcional?</label>
                        <select name="is_optional" defaultValue={String(Boolean(selected.is_optional))} style={selectStyle}>
                          <option value="false">Obrigatória</option>
                          <option value="true">Opcional</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button type="submit" className="button" style={{ background: "var(--accent)", color: "white" }} disabled={isSaving}>
                        <Save size={15} /> {isSaving ? "A guardar..." : "Guardar alterações"}
                      </button>
                    </div>
                  </form>
                </details>
              </aside>
            </div>

            <footer className={styles.footerRow}>
              <span>ID atual: {selected.id}</span>
              <span>
                Criado em {formatDateTime(selected.created_at)} · Atualizado em {formatDateTime(selected.updated_at)}
              </span>
            </footer>
          </>
        ) : (
          <div className={styles.emptyState}>Sem questões para mostrar.</div>
        )}
      </section>
    </div>
  );
}

function RubricDisplay({ rubric }: { rubric: unknown }) {
  if (rubric == null) {
    return <div className={styles.infoValue}>Sem critérios definidos.</div>;
  }

  if (Array.isArray(rubric)) {
    return (
      <div className={styles.rubricGroup}>
        <section className={styles.rubricSection}>
          <div className={styles.rubricSectionTitle}>Itens</div>
          <ol className={styles.rubricList}>
            {rubric.map((item, index) => (
              <li key={index}>
                <FieldValue value={item} math />
              </li>
            ))}
          </ol>
        </section>
      </div>
    );
  }

  if (typeof rubric === "object") {
    const entries = Object.entries(rubric as Record<string, unknown>);
    if (entries.length === 0) {
      return <div className={styles.infoValue}>Critérios vazios.</div>;
    }

    return (
      <div className={styles.rubricGroup}>
        {entries.map(([key, value]) => (
          <section key={key} className={styles.rubricSection}>
            <div className={styles.rubricSectionTitle}>{humanizeKey(key)}</div>
            {Array.isArray(value) ? (
              value.length ? (
                <ol className={styles.rubricList}>
                  {value.map((item, index) => (
                    <li key={index}>
                      <FieldValue value={item} math />
                    </li>
                  ))}
                </ol>
              ) : (
                <div className={styles.infoValue}>Sem itens.</div>
              )
            ) : (
              <div className={styles.infoValue}>
                <FieldValue value={value} math />
              </div>
            )}
          </section>
        ))}
      </div>
    );
  }

  return <div className={styles.infoValue}><FieldValue value={rubric} math /></div>;
}

function InfoTile({ label, value }: { label: string; value: unknown }) {
  return (
    <div className={styles.infoTile}>
      <span className={styles.infoLabel}>{label}</span>
      <div className={styles.infoValue}>
        <FieldValue value={value} />
      </div>
    </div>
  );
}

function FieldValue({
  value,
  math = false,
  preformatted = false,
}: {
  value: unknown;
  math?: boolean;
  preformatted?: boolean;
}) {
  if (value == null || value === "") {
    return <span className={styles.emptyValue}>—</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className={styles.emptyValue}>[]</span>;
    }

    return (
      <div className={styles.topics}>
        {value.map((item, index) => (
          <span key={`${String(item)}-${index}`} className="badge neutral">
            {String(item)}
          </span>
        ))}
      </div>
    );
  }

  if (typeof value === "boolean") {
    return <span className={`badge ${value ? "success" : "neutral"}`}>{value ? "Sim" : "Não"}</span>;
  }

  if (typeof value === "object") {
    return <pre className={styles.preBlock}>{JSON.stringify(value, null, 2)}</pre>;
  }

  const stringValue = String(value);
  if (preformatted) {
    return <pre className={styles.preBlock}>{stringValue}</pre>;
  }

  if (stringValue.startsWith("http://") || stringValue.startsWith("https://")) {
    return (
      <a href={stringValue} target="_blank" rel="noreferrer">
        {stringValue}
      </a>
    );
  }

  if (looksLikeTimestamp(stringValue)) {
    return <span>{formatDateTime(stringValue)}</span>;
  }

  if (math) {
    return <MathText text={stringValue} />;
  }

  return <span>{stringValue}</span>;
}

function isMultipleChoice(question: ExamQuestion) {
  return question.question_type === "multiple_choice";
}

function humanizeKey(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function looksLikeTimestamp(value: string) {
  return /^\d{4}-\d{2}-\d{2}[ T]/.test(value);
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

const inputStyle: CSSProperties = {
  width: "100%",
  background: "var(--bg-subtle)",
  border: "1px solid var(--line)",
  padding: "10px 12px",
  borderRadius: 10,
  color: "var(--text)",
  fontSize: "0.92rem",
  resize: "vertical",
};

const selectStyle: CSSProperties = {
  width: "100%",
  background: "var(--surface)",
  border: "1px solid var(--line)",
  padding: "10px 12px",
  borderRadius: 10,
  color: "var(--text)",
  fontSize: "0.9rem",
};
