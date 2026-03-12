"use client";

import React, { useState, useMemo } from "react";
import { 
  Activity, Search, Target, Briefcase, FileText, PenTool, Database, ShieldCheck, AlertTriangle, Layers, ArrowRight, Clock, Network
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import "./workflow.css";

const V1_NODES = [
  {
    id: "official-monitor",
    code: "official_monitor",
    matchKeys: ["official-monitor", "official_monitor"],
    title: "Official Monitor",
    role: "Automático",
    desc: "Monitoriza fontes oficiais (IAVE, DGE) permanentemente. Emite sinal em caso de novidades nos guiões/calendários.",
    icon: <Search size={24} />,
    color: "#60a5fa", 
    schedule: "Segunda 08:00",
    produces: "agent_findings (official_change)",
    type: "autonomous"
  },
  {
    id: "coverage-profiler",
    code: "coverage-profiler",
    matchKeys: ["coverage-profiler", "coverage_profiler"],
    title: "Coverage Profiler",
    role: "Automático",
    desc: "Cruza a taxonomia do Wolfie com os currículos nacionais para detetar subcoberturas e lacunas de conteúdo.",
    icon: <Target size={24} />,
    color: "#34d399",
    schedule: "Terça 08:00",
    produces: "agent_findings (curriculum_gap)",
    type: "autonomous"
  },
  {
    id: "brief-generator",
    code: "brief-generator",
    matchKeys: ["brief-generator", "brief_generator"],
    title: "Brief Generator",
    role: "Orquestrador",
    desc: "Agrega todos os sinais (findings) fracionados durante a semana num Sumário/Brief consolidado.",
    icon: <Briefcase size={24} />,
    color: "#c084fc",
    schedule: "Sexta 10:00",
    produces: "review_briefs",
    type: "orchestrator"
  },
  {
    id: "case-builder",
    code: "case-builder",
    matchKeys: ["case-builder", "case_builder"],
    title: "Case Builder",
    role: "Orquestrador",
    desc: "Fragmenta os guiões semanais (Briefs) em casos editoriais concretos para aprovação humana.",
    icon: <FileText size={24} />,
    color: "#f472b6",
    schedule: "Sexta 09:00",
    produces: "review_cases",
    type: "orchestrator"
  },
  {
    id: "draft-generator",
    code: "draft-generator",
    matchKeys: ["draft-generator", "draft_generator"],
    title: "Draft Generator",
    role: "Worker Manual",
    desc: "Gera a proposta e pacote de conteúdo concreto após aprovação de um Caso pela equipa na Inbox.",
    icon: <PenTool size={24} />,
    color: "#fbbf24",
    schedule: "Trigger Manual (Inbox)",
    produces: "draft_package",
    type: "manual"
  }
];

const COLORS = ['#60a5fa', '#34d399', '#c084fc', '#f472b6', '#fbbf24', '#a78bfa', '#f87171'];

function KpiBox({ label, val, icon, color }: any) {
  return (
    <div className="wf-kpi-box" style={{ borderBottom: `2px solid ${color}` }}>
       <div className="kpi-icon" style={{ color: color, background: `${color}1A` }}>{icon}</div>
       <div className="kpi-info">
          <span className="kpi-val">{val}</span>
          <span className="kpi-label">{label}</span>
       </div>
    </div>
  );
}

function NodeCard({ node, active, set }: any) {
  return (
    <div 
      className={`wf-node-card ${active ? 'active' : ''}`}
      style={{ 
        borderColor: active ? node.color : undefined, 
        boxShadow: active ? `0 0 24px ${node.color}33` : undefined 
      }}
      onClick={set}
    >
       <div className="node-icon" style={{ background: `${node.color}1A`, color: node.color }}>
          {node.icon}
       </div>
       <div className="node-info">
          <div className="node-title">{node.title}</div>
          <div className="node-role" style={{ color: node.color, opacity: 0.8 }}>{node.role}</div>
       </div>
    </div>
  );
}

export default function WorkflowClient({ workflows, runs, findings, briefs, cases }: any) {
  const [activeNodeId, setActiveNodeId] = useState<string>("official-monitor");

  const activeNode = useMemo(() => V1_NODES.find(n => n.id === activeNodeId) || V1_NODES[0], [activeNodeId]);

  // Global KPIs
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const recentRuns = runs.filter((r: any) => new Date(r.started_at) > weekAgo).length;
  const recentFindings = findings.filter((f: any) => new Date(f.created_at) > weekAgo).length;
  const pendingCases = cases.filter((c: any) => c.decision_status === "pending").length;
  const successRunsCount = runs.filter((r: any) => r.status === "succeeded").length;
  const successRate = runs.length ? Math.round((successRunsCount / runs.length) * 100) : 0;
  
  const activeWfCount = workflows.filter((w: any) => w.is_active).length || V1_NODES.length;

  // Analytics Data
  const runCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    runs.forEach((run: any) => {
      const wf = workflows.find((w: any) => w.id === run.workflow_id);
      const name = wf ? (wf.name || wf.code) : "Unknown Worker";
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.keys(counts)
      .map(k => ({ name: k.substring(0, 15), runs: counts[k] }))
      .sort((a,b)=>b.runs-a.runs)
      .slice(0, 8);
  }, [runs, workflows]);

  const findingsDist = useMemo(() => {
    const counts: Record<string, number> = {};
    findings.forEach((f: any) => {
      const type = f.finding_type || "unknown";
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
  }, [findings]);

  // Legacy Check
  const legacyWorkflows = workflows.filter((w: any) => 
    !V1_NODES.some((vn) => vn.matchKeys.includes(w.code))
  );

  const renderDynamicMetrics = (node: any) => {
    let matchedWf = workflows.find((w: any) => node.matchKeys.includes(w.code));
    let nodeRuns = matchedWf ? runs.filter((r: any) => r.workflow_id === matchedWf.id) : [];
    
    if (node.id === "brief-generator") {
        return (
          <div className="dynamic-metrics" style={{ borderColor: node.color }}>
            <div className="d-item">
               <label>Total Briefs Gerados</label>
               <strong style={{ color: node.color }}>{briefs.length}</strong>
            </div>
            <div className="d-item">
               <label>Última Geração</label>
               <strong>{briefs.length > 0 ? new Date(briefs[0].created_at).toLocaleDateString('pt-PT') : 'N/A'}</strong>
            </div>
          </div>
        );
    }
    if (node.id === "case-builder") {
        return (
          <div className="dynamic-metrics" style={{ borderColor: node.color }}>
            <div className="d-item">
               <label>Total de Casos na DB</label>
               <strong style={{ color: node.color }}>{cases.length}</strong>
            </div>
            <div className="d-item">
               <label>Pendentes Inbox</label>
               <strong style={{ color: '#fbbf24' }}>{cases.filter((c:any) => c.decision_status === 'pending').length}</strong>
            </div>
          </div>
        );
    }
    if (node.id === "draft-generator") {
        const acceptedCases = cases.filter((c:any) => c.decision_status === "accepted").length;
        return (
          <div className="dynamic-metrics" style={{ borderColor: node.color }}>
            <div className="d-item">
               <label>Drafts Despoletados (Casos Aceites)</label>
               <strong style={{ color: node.color }}>{acceptedCases}</strong>
            </div>
          </div>
        );
    }

    // Default for autonomous
    const successCount = nodeRuns.filter((r: any) => r.status === "succeeded").length;
    const sRate = nodeRuns.length ? Math.round((successCount / nodeRuns.length) * 100) : 0;
    
    let generatedFindings = 0;
    if (node.id === "official-monitor") {
        generatedFindings = findings.filter((f: any) => f.finding_type === "official_change").length;
    }
    if (node.id === "coverage-profiler") {
        generatedFindings = findings.filter((f: any) => f.finding_type?.includes("gap")).length;
    }
    
    return (
      <div className="dynamic-metrics" style={{ borderColor: node.color }}>
         <div className="d-item"><label>Histórico Execuções</label><strong>{nodeRuns.length} runs</strong></div>
         <div className="d-item"><label>Taxa Sucesso T/A</label><strong style={{ color: sRate > 80 ? '#34d399' : '#fbbf24' }}>{sRate}%</strong></div>
         <div className="d-item"><label>Findings Produzidos</label><strong style={{ color: node.color }}>{generatedFindings}</strong></div>
         <div className="d-item">
            <label>Última Run</label>
            <strong>{nodeRuns.length ? new Date(nodeRuns[0].started_at).toLocaleDateString('pt-PT') : 'N/A'}</strong>
         </div>
      </div>
    );
  };

  return (
    <div className="wf-main">
      {/* 1. Hero / KPI Board */}
      <div className="wf-hero">
        <div className="wf-title-section">
          <h2><Network className="inline-icon" /> Control Room <span>V1</span></h2>
          <p>Observability & Gestão da Orquestração Curricular do Wolfie Backend.</p>
        </div>
        
        <div className="wf-kpi-grid">
          <KpiBox label="Workflows Ativos" val={activeWfCount} icon={<Activity />} color="#34d399" />
          <KpiBox label="Execuções (7d)" val={recentRuns} icon={<Layers />} color="#60a5fa" />
          <KpiBox label="Sinais Detetados (7d)" val={recentFindings} icon={<AlertTriangle />} color="#f472b6" />
          <KpiBox label="Inbox (Pendentes)" val={pendingCases} icon={<Briefcase />} color="#fbbf24" />
          <KpiBox label="Taxa Eficiência" val={`${successRate}%`} icon={<ShieldCheck />} color="#c084fc" />
        </div>
      </div>

      {/* 2. Control Room Graph Map */}
      <div className="wf-board">
        <div className="wf-map-panel">
          <h3 className="wf-panel-title">Arquitetura de Fluxo Vivo</h3>
          <div className="wf-graph">
             {/* Columns */}
             <div className="wf-col">
                <span className="wf-col-label">1. Sensoriamento Autónomo</span>
                {V1_NODES.filter(n => n.type === 'autonomous').map(n => <NodeCard key={n.id} node={n} active={activeNodeId === n.id} set={() => setActiveNodeId(n.id)} />)}
             </div>
             <div className="wf-connector"><ArrowRight /></div>
             <div className="wf-col">
                <span className="wf-col-label">2. Orquestração & Agregação</span>
                {V1_NODES.filter(n => n.type === 'orchestrator').map(n => <NodeCard key={n.id} node={n} active={activeNodeId === n.id} set={() => setActiveNodeId(n.id)} />)}
             </div>
             <div className="wf-connector"><ArrowRight /></div>
             <div className="wf-col">
                <span className="wf-col-label">3. Ação Worker Manual</span>
                {V1_NODES.filter(n => n.type === 'manual').map(n => <NodeCard key={n.id} node={n} active={activeNodeId === n.id} set={() => setActiveNodeId(n.id)} />)}
             </div>
          </div>
        </div>

        {/* 3. Node Details Interaction */}
        <div className="wf-details-panel">
           <div className="details-header" style={{ borderColor: activeNode.color }}>
              <div className="header-icon" style={{ background: `${activeNode.color}1A`, color: activeNode.color }}>
                 {activeNode.icon}
              </div>
              <div>
                 <h3 style={{ color: activeNode.color, margin: 0, fontSize: '1.2rem' }}>{activeNode.title}</h3>
                 <span className="role-badge">{activeNode.role}</span>
              </div>
           </div>
           
           <div className="details-body">
              <p className="details-desc">{activeNode.desc}</p>
              
              <div className="details-info-grid">
                 <div className="d-info-item">
                    <Clock size={16} /> <span>{activeNode.schedule}</span>
                 </div>
                 <div className="d-info-item">
                    <Database size={16} /> <span className="mono-code">{activeNode.produces}</span>
                 </div>
              </div>

              {renderDynamicMetrics(activeNode)}
           </div>
        </div>
      </div>

      {/* 4. Analytics & Ledger */}
      <div className="wf-bottom-row">
         <div className="wf-analytics-card">
            <h3 className="wf-panel-title">Status Analítico</h3>
            <div className="chart-grid">
               <div className="chart-wrapper">
                  <h4 className="chart-title">Execuções por Workflow</h4>
                  {runCounts.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                       <BarChart data={runCounts}>
                         <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                         <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                         <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                         <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: 8 }} />
                         <Bar dataKey="runs" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                       </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="empty-state">Sem dados estatísticos de runs.</p>
                  )}
               </div>
               
               <div className="chart-wrapper">
                  <h4 className="chart-title">Distribuição de Findings</h4>
                  {findingsDist.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                         <Pie
                           data={findingsDist}
                           cx="50%"
                           cy="50%"
                           innerRadius={60}
                           outerRadius={80}
                           paddingAngle={5}
                           dataKey="value"
                         >
                           {findingsDist.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                           ))}
                         </Pie>
                         <RechartsTooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: 8 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="empty-state">Sem findings registados.</p>
                  )}
               </div>
            </div>
         </div>

         <div className="wf-analytics-card">
            <h3 className="wf-panel-title">Tabelas de Artefactos (Ledger)</h3>
            <div className="ledger-grid">
               <div className="ledger-item">
                  <div className="l-val">{runs.length}</div>
                  <div className="l-label">agent_runs</div>
               </div>
               <div className="ledger-item">
                  <div className="l-val">{findings.length}</div>
                  <div className="l-label">agent_findings</div>
               </div>
               <div className="ledger-item">
                  <div className="l-val">{briefs.length}</div>
                  <div className="l-label">review_briefs</div>
               </div>
               <div className="ledger-item">
                  <div className="l-val">{cases.length}</div>
                  <div className="l-label">review_cases</div>
               </div>
            </div>
         </div>
      </div>

      {/* 5. Legacy Workflows */}
      {legacyWorkflows.length > 0 && (
         <div className="wf-legacy-section">
            <h3 className="wf-panel-title">Módulos Legado / Outside Main V1 Flow</h3>
            <div className="legacy-grid">
               {legacyWorkflows.map((lw: any) => (
                  <div key={lw.id} className="legacy-card">
                     <span className="lc-code">{lw.code}</span>
                     <span className="lc-status">{lw.is_active ? 'Ativo (Secundário)' : 'Desativado'}</span>
                  </div>
               ))}
            </div>
         </div>
      )}

    </div>
  );
}
