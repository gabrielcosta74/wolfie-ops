"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, Save, ChevronLeft, ChevronRight, Eye, CheckCircle2, FlaskConical, CircleDot } from "lucide-react";
import { MathText } from "@/components/math-text";
import { updateQuestion } from "./actions";

type Question = {
  id: string;
  pergunta: string;
  subtema_id: number;
  dificuldade: "facil" | "medio" | "dificil";
  num_tentativas: number;
  taxa_acerto: number;
  opcao_a: string;
  opcao_b: string;
  opcao_c: string;
  opcao_d: string;
  opcao_correta: string;
  explicacao: string;
  created_at: string;
};

type Subtema = { id: number; nome: string; codigo: string };

type Props = {
  questions: Question[];
  subtemas: Subtema[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  activeFilters: { difficulty: string; subtemaId: string; search: string };
};

export function QuestionsDataTable({ questions, subtemas, currentPage, totalPages, totalCount, activeFilters }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [selected, setSelected] = useState<Question | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchInput, setSearchInput] = useState(activeFilters.search);
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ q: searchInput, page: "" });
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selected) return;

    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      pergunta: formData.get("pergunta") as string,
      opcao_a: formData.get("opcao_a") as string,
      opcao_b: formData.get("opcao_b") as string,
      opcao_c: formData.get("opcao_c") as string,
      opcao_d: formData.get("opcao_d") as string,
      opcao_correta: formData.get("opcao_correta") as string,
      explicacao: formData.get("explicacao") as string,
      dificuldade: formData.get("dificuldade") as string,
    };

    const result = await updateQuestion(selected.id, data);
    if (result.success) {
      setSelected(null);
      startTransition(() => router.refresh());
    } else {
      alert("Erro ao guardar: " + result.error);
    }
    setIsSaving(false);
  };

  const diffLabels: Record<string, string> = { facil: "Fácil", medio: "Médio", dificil: "Difícil" };
  const subtemasMap = Object.fromEntries(subtemas.map(s => [s.id, s]));
  const PAGE_SIZE = 50;

  return (
    <div className={`qc-layout ${selected ? 'drawer-open' : ''}`}>
      
      {/* --- LEFT: MAIN GRID --- */}
      <div className="qc-grid-area" style={{ opacity: isPending ? 0.6 : 1 }}>
        
        {/* Action Bar */}
        <div className="qc-action-bar">
          <form onSubmit={handleSearch} className="qc-search-box">
            <Search size={16} className="qc-search-icon" />
            <input
              type="text"
              placeholder="Pesquisar enigma..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button type="button" onClick={() => { setSearchInput(""); navigate({ q: "", page: "" }); }}>
                <X size={14} />
              </button>
            )}
          </form>

          <div className="qc-filters">
            <select
              value={activeFilters.subtemaId}
              onChange={e => navigate({ subtema: e.target.value, page: "" })}
            >
              <option value="">Todos os Subtemas</option>
              {subtemas.map(s => (
                <option key={s.id} value={s.id}>{s.codigo} — {s.nome}</option>
              ))}
            </select>

            <select
              value={activeFilters.difficulty}
              onChange={e => navigate({ dificuldade: e.target.value, page: "" })}
            >
              <option value="">Todas Dificuldades</option>
              <option value="facil">Fácil</option>
              <option value="medio">Médio</option>
              <option value="dificil">Difícil</option>
            </select>

            {(activeFilters.difficulty || activeFilters.subtemaId || activeFilters.search) && (
              <button
                className="qc-clear-btn"
                onClick={() => navigate({ dificuldade: "", subtema: "", q: "", page: "" })}
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* The List */}
        <div className="qc-list">
           {questions.length === 0 && (
             <div className="qc-empty-state">
                <FlaskConical size={48} opacity={0.2} />
                <p>Nenhum átomo de conhecimento encontrado.</p>
             </div>
           )}

           {questions.map((q, i) => {
              const isActive = selected?.id === q.id;
              const subtema = subtemasMap[q.subtema_id];
              const acertoPct = Math.round(Number(q.taxa_acerto) * 100);
              const rowNum = (currentPage - 1) * PAGE_SIZE + i + 1;

              return (
                 <div 
                   key={q.id} 
                   className={`qc-row ${isActive ? 'active' : ''}`}
                   onClick={() => setSelected(q)}
                 >
                    <div className="qc-row-num">{rowNum}</div>
                    
                    <div className="qc-row-main">
                       <div className="qc-row-text">
                          <MathText text={q.pergunta} />
                       </div>
                       <div className="qc-row-meta">
                          <span className="qc-meta-pill code">{subtema ? subtema.codigo : `ID ${q.subtema_id}`}</span>
                          <span className="qc-meta-pill text">{subtema?.nome || ''}</span>
                       </div>
                    </div>

                    <div className="qc-row-assets">
                       <span className={`qc-diff ${q.dificuldade}`}>
                         <CircleDot size={10} /> {diffLabels[q.dificuldade]}
                       </span>
                       
                       <div className="qc-accuracy">
                          <span className="q-val" style={{ color: acertoPct >= 60 ? 'var(--ac-success)' : acertoPct >= 30 ? 'var(--ac-warn)' : 'var(--ac-danger)' }}>
                             {q.num_tentativas > 0 ? `${acertoPct}%` : '—'}
                          </span>
                          <span className="q-lbl">Acerto</span>
                       </div>
                       <div className="qc-row-action"><Eye size={18} /></div>
                    </div>
                 </div>
              );
           })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="qc-pagination">
            <span className="page-info">
              Pág <strong>{currentPage}</strong> de {totalPages}
            </span>
            <div className="page-controls">
              <button disabled={currentPage <= 1} onClick={() => navigate({ page: String(currentPage - 1) })}>
                <ChevronLeft size={16} /> Anterior
              </button>
              <button disabled={currentPage >= totalPages} onClick={() => navigate({ page: String(currentPage + 1) })}>
                Seguinte <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- RIGHT: DRAWER EDITOR --- */}
      {selected && (
         <>
         {/* Backdrop for mobile mostly, but adds depth */}
         <div className="qc-drawer-backdrop" onClick={() => setSelected(null)} />
         
         <div className="qc-drawer">
            <div className="drawer-header">
               <div>
                 <h3>Auditoria ao Item</h3>
                 <span className="drawer-id">ID: {selected.id.split('-')[0]}</span>
               </div>
               <button className="drawer-close" onClick={() => setSelected(null)}>
                  <X size={20} />
               </button>
            </div>

            <div className="drawer-tabs">
               <button className={activeTab === 'preview' ? 'active' : ''} onClick={() => setActiveTab('preview')}>Visualizador</button>
               <button className={activeTab === 'edit' ? 'active' : ''} onClick={() => setActiveTab('edit')}>Editor Escrito</button>
            </div>

            <div className="drawer-body">
               {activeTab === 'preview' && (
                  <div className="preview-pane">
                     <div className="stat-pills">
                        <div className="stp"><span className="lbl">Tentativas</span><span className="val">{selected.num_tentativas}</span></div>
                        <div className="stp"><span className="lbl">Tx. Acerto</span><span className="val">{Math.round(selected.taxa_acerto*100)}%</span></div>
                     </div>
                     <div className="p-question">
                        <MathText text={selected.pergunta} />
                     </div>
                     <div className="p-options">
                        {['A', 'B', 'C', 'D'].map(l => {
                           const isC = selected.opcao_correta?.trim() === l;
                           return (
                              <div key={l} className={`p-opt ${isC ? 'correct' : ''}`}>
                                 <div className="o-letter">{l}</div>
                                 <div className="o-text"><MathText text={selected[`opcao_${l.toLowerCase()}` as keyof Question] as string} /></div>
                                 {isC && <CheckCircle2 size={16} className="o-check" />}
                              </div>
                           )
                        })}
                     </div>
                     {selected.explicacao && (
                        <div className="p-explanation">
                           <strong>Razão Pedagógica:</strong>
                           <p><MathText text={selected.explicacao} /></p>
                        </div>
                     )}
                  </div>
               )}

               {activeTab === 'edit' && (
                  <form onSubmit={handleSave} className="edit-pane">
                     <div className="f-group">
                        <label>Enunciado Raiz</label>
                        <textarea name="pergunta" defaultValue={selected.pergunta} rows={5} />
                     </div>
                     
                     <div className="f-opts-group">
                        <label>Alternativas (marque a correta)</label>
                        {['A', 'B', 'C', 'D'].map(l => (
                           <div key={l} className="f-opt-row">
                              <label className="r-check">
                                 <input type="radio" name="opcao_correta" value={l} defaultChecked={selected.opcao_correta?.trim() === l} />
                                 <span>{l}</span>
                              </label>
                              <textarea 
                                name={`opcao_${l.toLowerCase()}`} 
                                defaultValue={selected[`opcao_${l.toLowerCase()}` as keyof Question] as string} 
                                rows={2} 
                              />
                           </div>
                        ))}
                     </div>

                     <div className="f-group">
                        <label>Explicação (Mostrada na Falha)</label>
                        <textarea name="explicacao" defaultValue={selected.explicacao} rows={3} />
                     </div>

                     <div className="f-group">
                        <label>Dificuldade</label>
                        <select name="dificuldade" defaultValue={selected.dificuldade}>
                           <option value="facil">Fácil</option>
                           <option value="medio">Médio</option>
                           <option value="dificil">Difícil</option>
                        </select>
                     </div>

                     <div className="edit-actions">
                        <button type="button" className="btn-cancel" onClick={() => setSelected(null)}>Cancelar</button>
                        <button type="submit" className="btn-save" disabled={isSaving}>
                           <Save size={16} /> {isSaving ? "A guardar..." : "Guardar Modificações"}
                        </button>
                     </div>
                  </form>
               )}
            </div>
         </div>
         </>
      )}
    </div>
  );
}
