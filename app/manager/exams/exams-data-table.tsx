"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { X, Save, Eye, Image as ImageIcon, CheckCircle, AlertCircle } from "lucide-react";
import { MathText } from "@/components/math-text";
import { updateExamQuestion } from "./actions";

type ExamQuestion = {
  id: string;
  exam_year: number;
  exam_phase: number;
  question_number: string;
  cotacao: number;
  question_text: string;
  question_type: string;
  has_image: boolean;
  image_url: string | null;
  opcao_a: string | null;
  opcao_b: string | null;
  opcao_c: string | null;
  opcao_d: string | null;
  opcao_correta: string | null;
  grading_rubric: any;
  subtopic_id: number | null;
  difficulty_level: string | null;
  is_optional: boolean;
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

  const [selected, setSelected] = useState<ExamQuestion | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selected) return;

    setIsSaving(true);
    const fd = new FormData(e.currentTarget);
    const data = {
      question_text: fd.get("question_text") as string,
      opcao_a: fd.get("opcao_a") as string,
      opcao_b: fd.get("opcao_b") as string,
      opcao_c: fd.get("opcao_c") as string,
      opcao_d: fd.get("opcao_d") as string,
      opcao_correta: fd.get("opcao_correta") as string,
      cotacao: Number(fd.get("cotacao")),
      difficulty_level: fd.get("difficulty_level") as string,
      is_optional: fd.get("is_optional") === "true",
      question_type: fd.get("question_type") as string,
    };

    const result = await updateExamQuestion(selected.id, data);
    if (result.success) {
      setSelected(null);
      startTransition(() => router.refresh());
    } else {
      alert("Erro ao guardar: " + result.error);
    }
    setIsSaving(false);
  };

  const isMultipleChoice = (q: ExamQuestion) => q.question_type === "multiple_choice";

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
      {/* Main Area */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          <select
            value={activeFilters.type}
            onChange={e => navigate({ type: e.target.value })}
            style={selectStyle}
          >
            <option value="">Todos os Tipos</option>
            {Object.entries(typeLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <select
            value={activeFilters.difficulty}
            onChange={e => navigate({ difficulty: e.target.value })}
            style={selectStyle}
          >
            <option value="">Todas Dificuldades</option>
            {Object.entries(diffLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <select
            value={activeFilters.optional}
            onChange={e => navigate({ optional: e.target.value })}
            style={selectStyle}
          >
            <option value="">Obrigatória + Opcional</option>
            <option value="false">Obrigatórias</option>
            <option value="true">Opcionais</option>
          </select>

          {Object.values(activeFilters).some(Boolean) && (
            <button
              className="button ghost"
              style={{ fontSize: "0.8rem", padding: "6px 10px" }}
              onClick={() => navigate({ type: "", difficulty: "", optional: "" })}
            >
              Limpar
            </button>
          )}
        </div>

        {/* Table */}
        <div className="table-wrap" style={{ opacity: isPending ? 0.5 : 1, transition: "opacity 0.2s" }}>
          <table className="ops-table">
            <thead>
              <tr>
                <th style={{ width: 70 }}>#</th>
                <th>Enunciado</th>
                <th style={{ width: 130 }}>Tipo</th>
                <th style={{ width: 80, textAlign: "center" }}>Cotação</th>
                <th style={{ width: 100 }}>Dificuldade</th>
                <th style={{ width: 60, textAlign: "center" }}>Img</th>
                <th style={{ width: 60, textAlign: "center" }}>Opc.</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => {
                const isActive = selected?.id === q.id;
                return (
                  <tr
                    key={q.id}
                    className="inbox-row-hover"
                    style={{ cursor: "pointer", background: isActive ? "var(--surface-strong)" : undefined }}
                    onClick={() => setSelected(q)}
                  >
                    <td>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Q{q.question_number}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", fontSize: "0.9rem", fontWeight: 500, lineHeight: 1.5 }}>
                        <MathText text={q.question_text} />
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${typeBadgeColors[q.question_type] || "neutral"}`}>
                        {typeLabels[q.question_type] || q.question_type}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{q.cotacao}</span>
                      <span style={{ color: "var(--muted-soft)", fontSize: "0.75rem" }}> pts</span>
                    </td>
                    <td>
                      <span className={`badge ${diffBadgeColors[q.difficulty_level || ""] || "neutral"}`}>
                        {diffLabels[q.difficulty_level || ""] || q.difficulty_level || "—"}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {q.has_image ? (
                        <ImageIcon size={16} style={{ color: "var(--info)" }} />
                      ) : (
                        <span style={{ color: "var(--muted-soft)", fontSize: "0.8rem" }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {q.is_optional ? (
                        <span style={{ color: "var(--warning)", fontSize: "0.75rem", fontWeight: 600 }}>Opc</span>
                      ) : (
                        <CheckCircle size={14} style={{ color: "var(--success)" }} />
                      )}
                    </td>
                    <td>
                      <Eye size={14} style={{ color: "var(--muted-soft)" }} />
                    </td>
                  </tr>
                );
              })}
              {questions.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 48, color: "var(--muted)" }}>
                    Nenhuma questão encontrada com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ padding: "12px 0", fontSize: "0.85rem", color: "var(--muted)" }}>
          {totalCount} questão(ões) no total
        </div>
      </div>

      {/* Slide-over Editor */}
      {selected && (
        <div
          className="panel pad"
          style={{
            width: 440,
            position: "sticky",
            top: 24,
            maxHeight: "calc(100vh - 48px - 64px - 48px)",
            overflowY: "auto",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>
              Q{selected.question_number} — {selected.exam_year} {selected.exam_phase}ª Fase
            </h3>
            <button className="icon-btn" onClick={() => setSelected(null)}>
              <X size={18} />
            </button>
          </div>

          {/* Math Preview */}
          <div style={{ padding: 16, background: "var(--bg-subtle)", borderRadius: 10, border: "1px solid var(--line)", marginBottom: 16 }}>
            <span style={labelStyle}>Preview</span>
            <div style={{ fontSize: "0.95rem", lineHeight: 1.7, marginBottom: isMultipleChoice(selected) ? 12 : 0 }}>
              <MathText text={selected.question_text} />
            </div>

            {/* Options preview for multiple choice */}
            {isMultipleChoice(selected) && (
              <div style={{ display: "grid", gap: 6 }}>
                {["A", "B", "C", "D"].map(letter => {
                  const val = selected[`opcao_${letter.toLowerCase()}` as keyof ExamQuestion] as string;
                  if (!val) return null;
                  const isCorrect = selected.opcao_correta?.trim() === letter;
                  return (
                    <div key={letter} style={{
                      display: "flex", gap: 8, alignItems: "center", padding: "6px 10px", borderRadius: 6,
                      background: isCorrect ? "var(--success-transparent)" : "transparent",
                      border: isCorrect ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid transparent",
                    }}>
                      <span style={{ fontWeight: 700, fontSize: "0.8rem", color: isCorrect ? "var(--success)" : "var(--muted-soft)", width: 16 }}>{letter}</span>
                      <MathText text={val} style={{ fontSize: "0.85rem" }} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Image preview */}
          {selected.has_image && selected.image_url && (
            <div style={{ marginBottom: 16 }}>
              <span style={labelStyle}>Imagem da Questão</span>
              <img
                src={selected.image_url}
                alt={`Q${selected.question_number}`}
                style={{ width: "100%", borderRadius: 8, border: "1px solid var(--line)" }}
              />
            </div>
          )}

          {/* Meta info */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <span className={`badge ${typeBadgeColors[selected.question_type] || "neutral"}`}>
              {typeLabels[selected.question_type] || selected.question_type}
            </span>
            <span className={`badge ${diffBadgeColors[selected.difficulty_level || ""] || "neutral"}`}>
              {diffLabels[selected.difficulty_level || ""] || "?"}
            </span>
            <span className="badge neutral">{selected.cotacao} pts</span>
            {selected.is_optional && <span className="badge warning">Opcional</span>}
            {selected.edu_subtemas_exame && (
              <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{selected.edu_subtemas_exame.nome}</span>
            )}
          </div>

          {/* Rubric preview */}
          {selected.grading_rubric && (
            <div style={{ marginBottom: 16 }}>
              <span style={labelStyle}>Critérios de Correção</span>
              <div style={{ padding: 12, background: "var(--surface-raised)", borderRadius: 8, fontSize: "0.8rem", maxHeight: 140, overflowY: "auto" }}>
                <RubricDisplay rubric={selected.grading_rubric} />
              </div>
            </div>
          )}

          {/* Edit Form */}
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>Enunciado</label>
              <textarea
                name="question_text"
                key={selected.id + "_qt"}
                defaultValue={selected.question_text}
                rows={4}
                style={inputStyle}
              />
            </div>

            {isMultipleChoice(selected) && (
              <div style={{ display: "grid", gap: 10 }}>
                <label style={labelStyle}>Opções</label>
                {["A", "B", "C", "D"].map(letter => {
                  const isCorrect = selected.opcao_correta?.trim() === letter;
                  return (
                    <div key={letter} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, width: 40 }}>
                        <input type="radio" name="opcao_correta" value={letter} defaultChecked={isCorrect} id={`ex_opt_${letter}`} style={{ accentColor: "var(--accent)" }} />
                        <label htmlFor={`ex_opt_${letter}`} style={{ fontWeight: 600, fontSize: "0.85rem" }}>{letter}</label>
                      </div>
                      <input
                        type="text"
                        name={`opcao_${letter.toLowerCase()}`}
                        key={selected.id + `_${letter}`}
                        defaultValue={(selected[`opcao_${letter.toLowerCase()}` as keyof ExamQuestion] as string) || ""}
                        style={{ ...inputStyle, padding: "8px 10px", flex: 1, borderColor: isCorrect ? "var(--success)" : "var(--line)" }}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Cotação</label>
                <input type="number" name="cotacao" key={selected.id + "_c"} defaultValue={selected.cotacao} min={0} style={{ ...inputStyle, padding: "8px 10px" }} />
              </div>
              <div>
                <label style={labelStyle}>Tipo</label>
                <select name="question_type" key={selected.id + "_t"} defaultValue={selected.question_type} style={{ ...inputStyle, padding: "8px 10px" }}>
                  {Object.entries(typeLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Dificuldade</label>
                <select name="difficulty_level" key={selected.id + "_d"} defaultValue={selected.difficulty_level || ""} style={{ ...inputStyle, padding: "8px 10px" }}>
                  {Object.entries(diffLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Opcional?</label>
                <select name="is_optional" key={selected.id + "_o"} defaultValue={String(selected.is_optional)} style={{ ...inputStyle, padding: "8px 10px" }}>
                  <option value="false">Obrigatória</option>
                  <option value="true">Opcional</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <button type="button" className="button ghost" onClick={() => setSelected(null)}>Cancelar</button>
              <button type="submit" className="button" style={{ background: "var(--accent)", color: "white" }} disabled={isSaving}>
                <Save size={15} /> {isSaving ? "A guardar..." : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

/** Renders a JSONB grading rubric in a readable way */
function RubricDisplay({ rubric }: { rubric: any }) {
  if (!rubric) return <span style={{ color: "var(--muted)" }}>Sem critérios</span>;

  // Handle array rubric (step-by-step)
  if (Array.isArray(rubric)) {
    return (
      <div style={{ display: "grid", gap: 6 }}>
        {rubric.map((step: any, i: number) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <span style={{ color: "var(--text)" }}>{step.description || step.step || `Passo ${i + 1}`}</span>
            {step.points != null && (
              <span style={{ fontWeight: 700, color: "var(--accent)", flexShrink: 0 }}>{step.points}pt</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Handle object rubric
  if (typeof rubric === "object") {
    const entries = Object.entries(rubric);
    if (entries.length === 0) return <span style={{ color: "var(--muted)" }}>Vazio</span>;
    return (
      <div style={{ display: "grid", gap: 6 }}>
        {entries.map(([key, val]) => (
          <div key={key} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <span style={{ color: "var(--text)" }}>{key}</span>
            <span style={{ color: "var(--muted)", flexShrink: 0 }}>{typeof val === "object" ? JSON.stringify(val) : String(val)}</span>
          </div>
        ))}
      </div>
    );
  }

  return <span>{String(rubric)}</span>;
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "var(--muted-soft)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-subtle)",
  border: "1px solid var(--line)",
  padding: 10,
  borderRadius: 8,
  color: "var(--text)",
  fontSize: "0.85rem",
  resize: "vertical",
};

const selectStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--line)",
  padding: "8px 12px",
  borderRadius: 8,
  color: "var(--text)",
  fontSize: "0.85rem",
};
