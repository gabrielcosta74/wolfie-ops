"use client";

import { useActionState, useState, useRef, type ChangeEvent } from "react";
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

const TYPE_OPTIONS = [
  {
    value: "video" as ContributionType,
    label: "Vídeo",
    desc: "Aulas, revisões ou resoluções comentadas.",
    icon: "▶",
    color: "video",
    suggestions: ["Vídeo de revisão", "Explicação passo a passo", "Aula com exercícios"],
    helper: "Ideal para links de aulas gravadas ou revisões comentadas.",
  },
  {
    value: "resumo" as ContributionType,
    label: "Resumo",
    desc: "Apontamentos, esquemas ou formulários.",
    icon: "📝",
    color: "resumo",
    suggestions: ["Resumo com fórmulas", "Esquema de estudo", "Apontamentos organizados"],
    helper: "Bom para PDFs, docs ou imagens com matéria organizada.",
  },
  {
    value: "exercicio" as ContributionType,
    label: "Exercícios",
    desc: "Fichas, coleções de treino e resoluções.",
    icon: "✏️",
    color: "exercicio",
    suggestions: ["Ficha resolvida", "Treino por tema", "Exercícios com resolução"],
    helper: "Usa este tipo quando o foco é praticar.",
  },
  {
    value: "teste" as ContributionType,
    label: "Teste",
    desc: "Modelos de exame e provas de treino.",
    icon: "📋",
    color: "teste",
    suggestions: ["Teste de treino", "Modelo de exame", "Prova com critérios"],
    helper: "Ideal para testes, simulações e provas de anos anteriores.",
  },
  {
    value: "outro" as ContributionType,
    label: "Outro",
    desc: "Qualquer recurso útil que não encaixe acima.",
    icon: "✦",
    color: "outro",
    suggestions: ["Guia rápido", "Coleção de recursos", "Material extra"],
    helper: "Por exemplo guiões, listas de recursos ou materiais mistos.",
  },
];

type Step = 1 | 2 | 3;

export function ContribuirForm({
  subtemas,
  schools,
}: {
  subtemas: SubtemaOption[];
  schools: string[];
}) {
  const [step, setStep] = useState<Step>(1);
  const [selectedType, setSelectedType] = useState<ContributionType>("resumo");
  const [selectedSuggestion, setSelectedSuggestion] = useState("");
  const [title, setTitle] = useState("");
  const [subtemaId, setSubtemaId] = useState("");
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [email, setEmail] = useState("");
  const [escola, setEscola] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const startedAtRef = useRef(Date.now());

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error: string } | null, fd: FormData) =>
      submitContribution(fd),
    null
  );

  const activeType = TYPE_OPTIONS.find((t) => t.value === selectedType)!;

  function handleSuggestion(s: string) {
    setSelectedSuggestion(s);
    if (!title) setTitle(s);
  }

  function handleTypeChange(v: ContributionType) {
    setSelectedType(v);
    setSelectedSuggestion("");
  }

  function handleFilesChange(e: ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(e.target.files ?? []));
  }

  const canGoToStep2 = !!selectedType;
  const canGoToStep3 = title.trim().length > 0 && (url.trim() || content.trim() || files.length > 0);

  const stepLabel = (n: number): "active" | "done" | "" => {
    if (step === n) return "active";
    if (step > n) return "done";
    return "";
  };

  return (
    <form action={formAction} encType="multipart/form-data" noValidate className="w-full relative">
      {/* hidden fields synced with state */}
      <input type="hidden" name="type" value={selectedType} />
      <input type="hidden" name="suggestion" value={selectedSuggestion} />
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="url" value={url} />
      <input type="hidden" name="content" value={content} />
      <input type="hidden" name="subtema_id" value={subtemaId} />
      <input type="hidden" name="source_name" value={sourceName} />
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="escola" value={escola} />
      <input type="hidden" name="website" value="" />
      <input type="hidden" name="started_at" value={String(startedAtRef.current)} />

      {/* ── step indicator ── */}
      <div className="flex items-center justify-center max-w-2xl mx-auto mb-10 text-sm font-semibold">
        <div className={`flex flex-col items-center gap-2 ${step >= 1 ? "text-blue-400" : "text-slate-500"}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${step > 1 ? "bg-blue-500 border-blue-500 text-white" : step === 1 ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-slate-700 bg-slate-800 text-slate-500"}`}>
            {step > 1 ? "✓" : "1"}
          </div>
          <span className="tracking-wide">Formato</span>
        </div>
        <div className={`w-16 sm:w-24 h-0.5 mx-2 sm:mx-4 transition-colors ${step >= 2 ? "bg-blue-500" : "bg-slate-800"}`} />
        <div className={`flex flex-col items-center gap-2 ${step >= 2 ? "text-blue-400" : "text-slate-500"}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${step > 2 ? "bg-blue-500 border-blue-500 text-white" : step === 2 ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-slate-700 bg-slate-800 text-slate-500"}`}>
            {step > 2 ? "✓" : "2"}
          </div>
          <span className="tracking-wide">Recurso</span>
        </div>
        <div className={`w-16 sm:w-24 h-0.5 mx-2 sm:mx-4 transition-colors ${step >= 3 ? "bg-blue-500" : "bg-slate-800"}`} />
        <div className={`flex flex-col items-center gap-2 ${step >= 3 ? "text-blue-400" : "text-slate-500"}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${step === 3 ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-slate-700 bg-slate-800 text-slate-500"}`}>
            3
          </div>
          <span className="tracking-wide">Autor</span>
        </div>
      </div>

      <div className="w-full bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Decorative inner glow */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

        {/* ── STEP 1 — Formato ── */}
        <div style={{ display: step === 1 ? "block" : "none" }} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">O que queres partilhar?</h2>
          <p className="text-slate-400 mb-8">Escolhe o tipo de recurso que tens para contribuir com a comunidade.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {TYPE_OPTIONS.map((t) => {
              const isActive = selectedType === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => handleTypeChange(t.value)}
                  className={`relative flex flex-col items-start p-5 rounded-2xl border transition-all duration-200 text-left ${
                    isActive 
                      ? "bg-blue-500/10 border-blue-500/50 ring-1 ring-blue-500/20" 
                      : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20"
                  }`}
                  aria-pressed={isActive}
                >
                  <div className="flex items-center gap-3 mb-2 w-full">
                    <span className="text-2xl">{t.icon}</span>
                    <span className={`font-bold text-lg ${isActive ? "text-blue-300" : "text-slate-200"}`}>{t.label}</span>
                    {isActive && <div className="ml-auto w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shadow-lg">✓</div>}
                  </div>
                  <span className="text-sm text-slate-400 leading-snug">{t.desc}</span>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!canGoToStep2}
              onClick={() => setStep(2)}
              className="bg-white text-black font-bold px-8 py-3.5 rounded-full hover:bg-slate-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none shadow-xl"
            >
              Continuar <span className="ml-2">→</span>
            </button>
          </div>
        </div>

        {/* ── STEP 2 — Recurso ── */}
        <div style={{ display: step === 2 ? "block" : "none" }} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button type="button" onClick={() => setStep(1)} className="text-slate-400 hover:text-white font-medium text-sm mb-6 flex items-center gap-2 transition-colors">
            <span>←</span> Voltar
          </button>
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Adiciona o recurso</h2>
          <p className="text-slate-400 mb-8">Título é obrigatório. Precisas também de colocar o Link, Ficheiros, ou uma Descrição.</p>

          {state?.error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">{state.error}</div>}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2" htmlFor="ct-title">Título <span className="text-red-400">*</span></label>
              <input
                id="ct-title"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                placeholder={
                  selectedType === "video"     ? "ex: Funções quadráticas — revisão completa" :
                  selectedType === "resumo"    ? "ex: Resumo de derivadas com fórmulas" :
                  selectedType === "exercicio" ? "ex: Ficha de treino — probabilidades" :
                  selectedType === "teste"     ? "ex: Modelo de exame 2023 com critérios" :
                  "ex: Guia rápido de estudo"
                }
                required
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2" htmlFor="ct-url">Link do recurso <span className="text-slate-500 font-normal ml-1">(link, ficheiros ou descrição necessários)</span></label>
              <input
                id="ct-url"
                type="url"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-blue-300 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Ficheiros <span className="text-slate-500 font-normal ml-1">(link, ficheiros ou descrição necessários)</span></label>
              <label htmlFor="ct-files" className="relative flex flex-col items-center justify-center w-full min-h-[120px] bg-white/5 border-2 border-dashed border-white/20 rounded-xl hover:bg-white/10 hover:border-blue-400/50 transition-colors cursor-pointer p-6 text-center group">
                <input
                  id="ct-files"
                  type="file"
                  name="attachments"
                  multiple
                  accept={CONTRIBUTION_ALLOWED_EXTENSIONS.join(",")}
                  onChange={handleFilesChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <span className="text-blue-400 font-bold mb-1 flex items-center gap-2 group-hover:scale-105 transition-transform"><span className="text-xl">+</span> Adicionar ficheiros</span>
                <span className="text-xs text-slate-500">
                  Até {CONTRIBUTION_MAX_FILES} ficheiros · {formatContributionBytes(CONTRIBUTION_MAX_FILE_SIZE_BYTES)}/ficheiro
                </span>
                <span className="text-[10px] text-slate-600 mt-1 font-mono uppercase tracking-widest">PDF, DOCX, PNG, JPG, ZIP</span>
              </label>

              {files.length > 0 && (
                <div className="mt-4 flex flex-col gap-2">
                  {files.map((f) => (
                    <div key={`${f.name}-${f.lastModified}`} className="flex items-center justify-between bg-black/40 border border-white/5 px-4 py-2.5 rounded-lg text-sm text-slate-300">
                      <span className="truncate pr-4 font-medium">{f.name}</span>
                      <span className="text-slate-500 shrink-0 tabular-nums text-xs font-mono">{formatContributionBytes(f.size)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2" htmlFor="ct-content">Descrição curta <span className="text-slate-500 font-normal ml-1">(link, ficheiros ou descrição necessários)</span></label>
              <textarea
                id="ct-content"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium resize-y min-h-[100px]"
                placeholder="Explica em duas linhas o que o recurso cobre e porque vale a pena."
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2" htmlFor="ct-subtema">Tema / Subtema <span className="text-slate-600 font-normal ml-1">(opcional)</span></label>
              <select
                id="ct-subtema"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium appearance-none"
                value={subtemaId}
                onChange={(e) => setSubtemaId(e.target.value)}
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto' }}
              >
                <option value="" className="bg-slate-900">Não sei / geral</option>
                {subtemas.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-10">
            <button
              type="button"
              disabled={!canGoToStep3}
              onClick={() => setStep(3)}
              className="bg-white text-black font-bold px-8 py-3.5 rounded-full hover:bg-slate-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none shadow-xl"
            >
              Continuar <span className="ml-2">→</span>
            </button>
          </div>
        </div>

        {/* ── STEP 3 — Sobre ti ── */}
        <div style={{ display: step === 3 ? "block" : "none" }} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button type="button" onClick={() => setStep(2)} className="text-slate-400 hover:text-white font-medium text-sm mb-6 flex items-center gap-2 transition-colors">
            <span>←</span> Voltar
          </button>
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Quase pronto!</h2>
          <p className="text-slate-400 mb-8">Tudo opcional — podes enviar os documentos anonimamente se preferires.</p>

          {state?.error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">{state.error}</div>}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2" htmlFor="ct-source">O teu Instagram do Torneio <span className="text-red-400">*</span></label>
              <input
                id="ct-source"
                className="w-full bg-black/50 border border-amber-500/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-medium"
                placeholder="@username (obrigatório para vencer)"
                maxLength={120}
                required
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-2">Para venceres dinheiro ou prémios tens de <strong>seguir a @wolfi.pt no Instagram</strong>.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2" htmlFor="ct-email">O teu Email <span className="text-slate-600 font-normal ml-1">(opcional)</span></label>
                <input
                  id="ct-email"
                  type="email"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-blue-300 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                  placeholder="Se quiseres ser notificado"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2" htmlFor="ct-escola">A tua Escola <span className="text-slate-600 font-normal ml-1">(opcional)</span></label>
                <SchoolCombobox
                  id="ct-escola"
                  schools={schools}
                  value={escola}
                  onChange={setEscola}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-10">
            <button 
              type="submit" 
              disabled={isPending || !canGoToStep3}
              className="w-full text-center bg-blue-600 text-white font-bold px-8 py-4 rounded-full hover:bg-blue-500 scale-100 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none shadow-xl disabled:animate-pulse flex items-center justify-center gap-2"
            >
              {isPending ? "A analisar e enviar..." : "✓ Enviar Contribuição"}
            </button>
            <button
              type="submit"
              disabled={isPending || !canGoToStep3}
              className="w-full text-center text-slate-400 font-medium px-8 py-3 rounded-full hover:text-white hover:bg-white/5 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              Saltar e enviar anonimamente
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function normalize(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function SchoolCombobox({
  id,
  schools,
  value,
  onChange,
}: {
  id: string;
  schools: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const normalizedQuery = normalize(value);
  const filtered = normalizedQuery.length === 0
    ? []
    : schools.filter((s) => normalize(s).includes(normalizedQuery)).slice(0, 15);

  function handleBlur() {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }

  function handleSelect(school: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    onChange(school);
    setOpen(false);
  }

  return (
    <div className="relative">
      <input
        id={id}
        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
        placeholder="Escreve o nome da escola..."
        maxLength={140}
        autoComplete="off"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
          {filtered.map((s) => (
            <li
              key={s}
              className="px-4 py-3 text-sm text-slate-300 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors border-b border-white/5 last:border-0"
              onMouseDown={() => handleSelect(s)}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
