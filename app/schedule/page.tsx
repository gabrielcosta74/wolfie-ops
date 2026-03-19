import { CheckCircle2, Clock, Sparkles, Layers, BarChart3 } from "lucide-react";
import { requireManagerUser } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

type ScheduleEntry = {
  id: string;
  name: string;
  description: string;
  frequency: string;
  nextRun: string;
  lastRun: string | null;
  status: "active" | "planned" | "manual";
  icon: "sparkles" | "layers" | "chart";
};

const AGENT_SCHEDULE: ScheduleEntry[] = [
  {
    id: "official-monitor",
    name: "Monitorizar Fontes Oficiais",
    description: "Verifica o IAVE, exames nacionais e fontes oficiais de Matemática A por novas tipologias ou atualizações curriculares.",
    frequency: "Todas as semanas (Segunda-feira)",
    nextRun: "Próxima segunda-feira",
    lastRun: null,
    status: "active",
    icon: "sparkles",
  },
  {
    id: "coverage-profiler",
    name: "Coverage Profiler",
    description: "Analisa a taxonomia oficial contra o conteúdo do Wolfi para detetar subcobertura, sobrecobertura e baixa variedade.",
    frequency: "Todas as semanas (Terça-feira)",
    nextRun: "Próxima terça-feira",
    lastRun: null,
    status: "active",
    icon: "layers",
  },
  {
    id: "case-builder",
    name: "Case Builder",
    description: "Agrupa sinais oficiais e de cobertura em poucos casos claros para decisão humana.",
    frequency: "Todas as semanas (Quinta/Sexta-feira)",
    nextRun: "Após os agentes base correrem",
    lastRun: null,
    status: "active",
    icon: "chart",
  },
  {
    id: "brief-generator",
    name: "Brief Generator",
    description: "Cria a revisão semanal e alimenta Hoje/Revisões com os casos mais importantes.",
    frequency: "Todas as semanas (Sexta-feira)",
    nextRun: "Próxima sexta-feira",
    lastRun: null,
    status: "active",
    icon: "chart",
  },
  {
    id: "draft-generator",
    name: "Draft Generator",
    description: "Prepara a proposta concreta só depois de um caso ser aceite pelo admin.",
    frequency: "Manual / on-demand",
    nextRun: "Quando um caso for aceite",
    lastRun: null,
    status: "manual",
    icon: "chart",
  },
];

function IconForAgent({ icon }: { icon: ScheduleEntry["icon"] }) {
  if (icon === "sparkles") return <Sparkles size={20} style={{ color: "var(--success)" }} />;
  if (icon === "layers") return <Layers size={20} style={{ color: "var(--accent)" }} />;
  return <BarChart3 size={20} style={{ color: "var(--warning)" }} />;
}

function StatusDot({ status }: { status: ScheduleEntry["status"] }) {
  return (
    <div style={{
      width: 8,
      height: 8,
      borderRadius: "50%",
      background:
        status === "active"
          ? "var(--success)"
          : status === "planned"
            ? "var(--warning)"
            : "var(--muted)",
      boxShadow: status === "active" ? "0 0 8px rgba(52, 211, 153, 0.4)" : "none",
    }} />
  );
}

export default async function SchedulePage() {
  await requireManagerUser();
  return (
    <div style={{ padding: 48, maxWidth: 900, margin: "0 auto" }}>
      <header style={{ marginBottom: 48 }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>
          Calendário
        </h1>
        <p style={{ fontSize: "1.1rem", color: "var(--muted)", maxWidth: 600 }}>
          O ciclo semanal da V1. O calendário mostra os agentes e workers que alimentam a Inbox e as Revisões.
        </p>
      </header>

      {/* Visual Timeline */}
      <div style={{ position: "relative" }}>
        {/* Vertical line connector */}
        <div style={{
          position: "absolute",
          left: 27,
          top: 0,
          bottom: 0,
          width: 2,
          background: "var(--border)",
          zIndex: 0,
        }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {AGENT_SCHEDULE.map((entry, index) => (
            <div
              key={entry.id}
              style={{
                display: "grid",
                gridTemplateColumns: "56px 1fr",
                gap: 0,
                position: "relative",
                zIndex: 1,
              }}
            >
              {/* Timeline Node */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                paddingTop: 24,
              }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: "var(--surface)",
                  border: "2px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  zIndex: 2,
                }}>
                  <IconForAgent icon={entry.icon} />
                </div>
              </div>

              {/* Content Card */}
              <div style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: "24px 28px",
                marginBottom: index < AGENT_SCHEDULE.length - 1 ? 0 : 0,
                marginTop: index === 0 ? 0 : -1,
              }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>{entry.name}</h2>
                    <p style={{ fontSize: "0.95rem", color: "var(--muted)", margin: "6px 0 0", lineHeight: 1.5 }}>
                      {entry.description}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 20 }}>
                    <StatusDot status={entry.status} />
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: entry.status === "active" ? "var(--success)" : entry.status === "planned" ? "var(--warning)" : "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {entry.status === "active" ? "Ativo" : entry.status === "planned" ? "Planeado" : "Manual"}
                    </span>
                  </div>
                </div>

                {/* Schedule Details */}
                <div style={{
                  display: "flex",
                  gap: 32,
                  paddingTop: 16,
                  borderTop: "1px solid var(--border)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Clock size={14} style={{ color: "var(--muted)" }} />
                    <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{entry.frequency}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <CheckCircle2 size={14} style={{ color: "var(--accent)" }} />
                    <span style={{ fontSize: "0.85rem", color: "var(--accent)", fontWeight: 600 }}>{entry.nextRun}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Flow Explanation */}
      <div style={{
        marginTop: 48,
        padding: "24px 28px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 16,
      }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 12 }}>Como funciona o ciclo?</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--success)", minWidth: 24 }}>1</span>
            <p style={{ fontSize: "0.95rem", color: "var(--muted)", margin: 0 }}>
              <strong style={{ color: "var(--text)" }}>Segunda:</strong> O `official-monitor` verifica IAVE, DGE e DGES por mudanças relevantes.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--accent)", minWidth: 24 }}>2</span>
            <p style={{ fontSize: "0.95rem", color: "var(--muted)", margin: 0 }}>
              <strong style={{ color: "var(--text)" }}>Terça:</strong> O `coverage-profiler` mede lacunas e desequilíbrios de cobertura.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--warning)", minWidth: 24 }}>3</span>
            <p style={{ fontSize: "0.95rem", color: "var(--muted)", margin: 0 }}>
              <strong style={{ color: "var(--text)" }}>Quinta/Sexta:</strong> O `case-builder` reduz o ruído e prepara poucos casos claros.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--warning)", minWidth: 24 }}>4</span>
            <p style={{ fontSize: "0.95rem", color: "var(--muted)", margin: 0 }}>
              <strong style={{ color: "var(--text)" }}>Sexta:</strong> O `brief-generator` publica a revisão semanal. O `draft-generator` só entra depois de aceitação humana.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
