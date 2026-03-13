"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import {
  CONTRIBUTION_ALLOWED_EXTENSIONS,
  CONTRIBUTION_MAX_FILE_SIZE_BYTES,
  CONTRIBUTION_MAX_FILES,
  CONTRIBUTION_MAX_TOTAL_SIZE_BYTES,
  formatContributionBytes,
} from "@/lib/public-submissions";
import { submitContribution } from "./actions";

type SubtemaOption = { id: number; label: string };
type ContributionType = "video" | "resumo" | "exercicio" | "teste" | "outro";

type TypeOption = {
  description: string;
  helper: string;
  label: string;
  suggestions: string[];
  value: ContributionType;
};

const TYPE_OPTIONS: TypeOption[] = [
  {
    value: "video",
    label: "Video",
    description: "Aulas, explicacoes ou revisoes curtas.",
    helper: "Ideal para links de aulas gravadas, revisoes ou resolucoes comentadas.",
    suggestions: ["Video de revisao", "Explicacao passo a passo", "Aula com exercicios resolvidos"],
  },
  {
    value: "resumo",
    label: "Resumo",
    description: "Apontamentos, esquemas e formularios.",
    helper: "Bom para PDFs, docs ou imagens com materia organizada.",
    suggestions: ["Resumo com formulas", "Esquema de estudo", "Apontamentos organizados"],
  },
  {
    value: "exercicio",
    label: "Exercicios",
    description: "Fichas, colecoes de treino e resolucoes.",
    helper: "Usa este tipo quando o foco principal e praticar.",
    suggestions: ["Ficha resolvida", "Treino por tema", "Exercicios com resolucao"],
  },
  {
    value: "teste",
    label: "Teste",
    description: "Modelos de exame e provas de treino.",
    helper: "Ideal para testes, simulacoes e provas de anos anteriores.",
    suggestions: ["Teste de treino", "Modelo de exame", "Prova com criterios"],
  },
  {
    value: "outro",
    label: "Outro",
    description: "Qualquer material util que nao encaixe acima.",
    helper: "Por exemplo guioes, listas de recursos ou materiais mistos.",
    suggestions: ["Guia rapido", "Colecao de recursos", "Outro material util"],
  },
];

export function ContribuirForm({ subtemas, schools }: { schools: string[]; subtemas: SubtemaOption[] }) {
  const [selectedType, setSelectedType] = useState<ContributionType>("resumo");
  const [selectedSuggestion, setSelectedSuggestion] = useState("");
  const [title, setTitle] = useState("");
  const [subtemaId, setSubtemaId] = useState("");
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("");
  const [customSchool, setCustomSchool] = useState("");
  const [schoolMode, setSchoolMode] = useState<"list" | "custom">("list");
  const [files, setFiles] = useState<File[]>([]);
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => submitContribution(formData),
    null
  );
  const activeType = TYPE_OPTIONS.find((option) => option.value === selectedType) ?? TYPE_OPTIONS[0];

  function handleSuggestionClick(suggestion: string) {
    setSelectedSuggestion(suggestion);
    setTitle((currentTitle) => currentTitle || suggestion);
  }

  function handleFilesChange(event: ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(event.target.files ?? []));
  }

  function handleTypeChange(value: ContributionType) {
    setSelectedType(value);
    setSelectedSuggestion("");
  }

  function handleSchoolChange(value: string) {
    setSelectedSchool(value);
    setSchoolMode(value === "__other__" ? "custom" : "list");
  }

  return (
    <form action={formAction} className="ct-form" encType="multipart/form-data">
      {state?.error && <div className="ct-error">{state.error}</div>}

      <input type="hidden" name="type" value={selectedType} />
      <input type="hidden" name="suggestion" value={selectedSuggestion} />

      <section className="ct-section">
        <div className="ct-section-head">
          <p className="ct-step">Passo 1</p>
          <h2>Escolhe o formato</h2>
          <p>O objetivo aqui e ser rapido: escolhe o tipo e o resto adapta-se.</p>
        </div>

        <div className="ct-type-grid">
          {TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`ct-type-card${selectedType === option.value ? " is-selected" : ""}`}
              onClick={() => handleTypeChange(option.value)}
              aria-pressed={selectedType === option.value}
            >
              <span className="ct-type-title">{option.label}</span>
              <span className="ct-type-description">{option.description}</span>
            </button>
          ))}
        </div>

        <div className="ct-suggestion-panel">
          <div>
            <p className="ct-mini-label">Sugestoes rapidas</p>
            <p className="ct-panel-copy">{activeType.helper}</p>
          </div>
          <div className="ct-chip-row">
            {activeType.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className={`ct-chip${selectedSuggestion === suggestion ? " is-selected" : ""}`}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="ct-section">
        <div className="ct-section-head">
          <p className="ct-step">Passo 2</p>
          <h2>Diz-nos o essencial</h2>
          <p>Basta um bom titulo e o tema certo para a sugestao ficar clara.</p>
        </div>

        <div className="ct-field">
          <label className="ct-label ct-label-required" htmlFor="ct-title">Titulo</label>
          <input
            type="text"
            name="title"
            id="ct-title"
            className="ct-input"
            placeholder="Ex: Resumo de derivadas com exercicios resolvidos"
            required
            maxLength={200}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        <div className="ct-field">
          <label className="ct-label" htmlFor="ct-subtema">Tema ou subtema</label>
          <select
            name="subtema_id"
            id="ct-subtema"
            className="ct-select"
            value={subtemaId}
            onChange={(event) => setSubtemaId(event.target.value)}
          >
            <option value="">Nao sei / geral</option>
            {subtemas.map((subtema) => (
              <option key={subtema.id} value={subtema.id}>
                {subtema.label}
              </option>
            ))}
          </select>
          <span className="ct-hint">Se nao souberes o subtema exato, deixa geral.</span>
        </div>
      </section>

      <section className="ct-section">
        <div className="ct-section-head">
          <p className="ct-step">Passo 3</p>
          <h2>Adiciona o recurso</h2>
          <p>Podes submeter um link, ficheiros ou ambos.</p>
        </div>

        <div className="ct-field">
          <label className="ct-label" htmlFor="ct-url">Link do recurso</label>
          <input
            type="url"
            name="url"
            id="ct-url"
            className="ct-input"
            placeholder="https://..."
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
        </div>

        <div className="ct-field">
          <label className="ct-label" htmlFor="ct-files">Ficheiros</label>
          <label className="ct-upload" htmlFor="ct-files">
            <input
              id="ct-files"
              className="ct-upload-input"
              type="file"
              name="attachments"
              multiple
              accept={CONTRIBUTION_ALLOWED_EXTENSIONS.join(",")}
              onChange={handleFilesChange}
            />
            <span className="ct-upload-title">Adicionar ficheiros</span>
            <span className="ct-upload-copy">
              Ate {CONTRIBUTION_MAX_FILES} ficheiros, {formatContributionBytes(CONTRIBUTION_MAX_FILE_SIZE_BYTES)} por ficheiro
              e {formatContributionBytes(CONTRIBUTION_MAX_TOTAL_SIZE_BYTES)} no total.
            </span>
            <span className="ct-upload-types">PDF, DOC, DOCX, PNG, JPG, JPEG e ZIP.</span>
          </label>

          {files.length > 0 && (
            <div className="ct-file-list">
              {files.map((file) => (
                <div key={`${file.name}-${file.lastModified}`} className="ct-file-pill">
                  <span>{file.name}</span>
                  <span>{formatContributionBytes(file.size)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="ct-field">
          <label className="ct-label" htmlFor="ct-content">Descricao curta</label>
          <textarea
            name="content"
            id="ct-content"
            className="ct-textarea"
            placeholder="Explica em duas linhas o que o recurso cobre e porque vale a pena."
            rows={4}
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
          <span className="ct-hint">Se o link ja for claro, esta descricao pode ser curta.</span>
        </div>
      </section>

      <section className="ct-section">
        <div className="ct-section-head">
          <p className="ct-step">Passo 4</p>
          <h2>Detalhes opcionais</h2>
          <p>So o necessario para dar contexto extra ao material.</p>
        </div>

        <div className="ct-field">
          <label className="ct-label" htmlFor="ct-source-name">Autor ou origem</label>
          <input
            type="text"
            name="source_name"
            id="ct-source-name"
            className="ct-input"
            placeholder="Ex: canal, escola ou professor"
            maxLength={120}
            value={sourceName}
            onChange={(event) => setSourceName(event.target.value)}
          />
        </div>

        <div className="ct-field-row">
          <div className="ct-field">
            <label className="ct-label" htmlFor="ct-email">Email</label>
            <input
              type="email"
              name="email"
              id="ct-email"
              className="ct-input"
              placeholder="teu@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="ct-field">
            <label className="ct-label" htmlFor="ct-escola">Escola</label>
            <select
              name="escola"
              id="ct-escola"
              className="ct-select"
              value={selectedSchool}
              onChange={(event) => handleSchoolChange(event.target.value)}
            >
              <option value="">Seleciona a tua escola...</option>
              {schools.map((school) => (
                <option key={school} value={school}>
                  {school}
                </option>
              ))}
              <option value="__other__">Outra / nao encontro a minha</option>
            </select>

            {schoolMode === "custom" ? (
              <input
                type="text"
                name="escola_custom"
                className="ct-input"
                placeholder="Escreve o nome da escola"
                maxLength={140}
                value={customSchool}
                onChange={(event) => setCustomSchool(event.target.value)}
              />
            ) : null}
          </div>
        </div>
      </section>

      <div className="ct-submit-bar">
        <div className="ct-submit-copy">
          <strong>Pronto a enviar</strong>
          <span>Se ja tens o link ou o ficheiro, isto deve demorar menos de um minuto.</span>
        </div>

        <button type="submit" className="ct-submit" disabled={isPending}>
          {isPending ? "A enviar..." : "Enviar sugestao"}
        </button>
      </div>
    </form>
  );
}
