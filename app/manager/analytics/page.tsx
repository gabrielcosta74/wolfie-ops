import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { Activity, TrendingUp, Users } from "lucide-react";
import "./analytics.css";
import EngagementChart from "./components/EngagementChart";
import FeatureUsageChart from "./components/FeatureUsageChart";

export const dynamic = "force-dynamic";

type DailyMetric = {
  day: string;
  dau: number;
  screen_views: number;
  quizzes_started: number;
  quizzes_completed: number;
  exams_started: number;
  chat_messages: number;
  doubts_asked: number;
  app_opens: number;
  total_events: number;
};

type UserSummary = {
  user_id: string;
  name: string | null;
  total_sessions: number;
  avg_session_seconds: number;
  total_events: number;
  last_active: string;
};

async function getAnalyticsData() {
  const sb = getSupabaseAdmin();

  // 1. Daily metrics from raw events (last 14 days)
  let daily: DailyMetric[] = [];

  const { data: eventsData } = await sb
    .from("analytics_events")
    .select("event_name, screen_name, user_id, created_at")
    .gte("created_at", new Date(Date.now() - 14 * 86400000).toISOString())
    .order("created_at", { ascending: false })
    .limit(5000);

  if (eventsData && eventsData.length > 0) {
    const byDay = new Map<string, { users: Set<string>; metrics: Omit<DailyMetric, "day" | "dau"> }>();

    for (const evt of eventsData) {
      const day = new Date(evt.created_at).toISOString().slice(0, 10);
      if (!byDay.has(day)) {
        byDay.set(day, {
          users: new Set(),
          metrics: { screen_views: 0, quizzes_started: 0, quizzes_completed: 0, exams_started: 0, chat_messages: 0, doubts_asked: 0, app_opens: 0, total_events: 0 },
        });
      }
      const entry = byDay.get(day)!;
      entry.users.add(evt.user_id);
      entry.metrics.total_events++;

      switch (evt.event_name) {
        case "screen_view": entry.metrics.screen_views++; break;
        case "quiz_start": entry.metrics.quizzes_started++; break;
        case "quiz_complete": entry.metrics.quizzes_completed++; break;
        case "exam_start": entry.metrics.exams_started++; break;
        case "chat_message": entry.metrics.chat_messages++; break;
        case "doubt_asked": entry.metrics.doubts_asked++; break;
        case "app_open": entry.metrics.app_opens++; break;
      }
    }

    daily = Array.from(byDay.entries())
      .map(([day, { users, metrics }]) => ({ day, dau: users.size, ...metrics }))
      .sort((a, b) => b.day.localeCompare(a.day));
  }

  // 2. Session stats
  const { data: sessions } = await sb
    .from("analytics_sessions")
    .select("id, user_id, started_at, ended_at, duration_s")
    .gte("started_at", new Date(Date.now() - 14 * 86400000).toISOString())
    .order("started_at", { ascending: false })
    .limit(500);

  // 3. Active users with profile info (last 7 days)
  const { data: activeUsers } = await sb
    .from("analytics_events")
    .select("user_id")
    .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString());

  const uniqueUserIds: string[] = [...new Set((activeUsers || []).map((u: { user_id: string }) => u.user_id))];

  let userSummaries: UserSummary[] = [];
  if (uniqueUserIds.length > 0) {
    const { data: profiles } = await sb
      .from("profiles")
      .select("user_id, name, last_activity")
      .in("user_id", uniqueUserIds);

    const userEvents = new Map<string, number>();
    for (const evt of activeUsers || []) {
      userEvents.set(evt.user_id, (userEvents.get(evt.user_id) || 0) + 1);
    }

    const userSessions = new Map<string, { count: number; totalDuration: number }>();
    for (const s of sessions || []) {
      if (!uniqueUserIds.includes(s.user_id)) continue;
      const entry = userSessions.get(s.user_id) || { count: 0, totalDuration: 0 };
      entry.count++;
      entry.totalDuration += s.duration_s || 0;
      userSessions.set(s.user_id, entry);
    }

    userSummaries = uniqueUserIds.map((uid: string) => {
      const profile = (profiles || []).find((p: { user_id: string }) => p.user_id === uid);
      const sess = userSessions.get(uid) || { count: 0, totalDuration: 0 };
      return {
        user_id: uid,
        name: profile?.name || null,
        total_sessions: sess.count,
        avg_session_seconds: sess.count > 0 ? Math.round(sess.totalDuration / sess.count) : 0,
        total_events: userEvents.get(uid) || 0,
        last_active: profile?.last_activity || "",
      };
    }).sort((a, b) => b.total_events - a.total_events);
  }

  // 4. Overall stats
  const totalSessions = sessions?.length || 0;
  const completedSessions = (sessions || []).filter((s: { duration_s: number | null }) => s.duration_s != null);
  const avgSessionDuration = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((sum: number, s: { duration_s: number | null }) => sum + (s.duration_s || 0), 0) / completedSessions.length)
    : 0;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayMetrics = daily.find((d) => d.day === todayStr);
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const yesterdayMetrics = daily.find((d) => d.day === yesterdayStr);

  return {
    daily,
    todayMetrics,
    yesterdayMetrics,
    totalSessions,
    avgSessionDuration,
    userSummaries,
    wau: uniqueUserIds.length,
  };
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
}

function calcDelta(current: number | undefined, previous: number | undefined): string {
  if (current == null || previous == null) return "";
  const diff = current - previous;
  if (diff === 0) return "";
  return diff > 0 ? `+${diff}` : `${diff}`;
}

function calcDeltaClass(current: number | undefined, previous: number | undefined): string {
  if (current == null || previous == null) return "";
  return current >= previous ? "positive" : "negative";
}

export default async function AnalyticsPage() {
  const { daily, todayMetrics, yesterdayMetrics, totalSessions, avgSessionDuration, userSummaries, wau } = await getAnalyticsData();

  return (
    <div className="analytics-container">
      <header className="analytics-header">
        <h1 className="analytics-title">Analytics Hub</h1>
        <p className="analytics-subtitle">
          Monitorização de performance e engagement dos últimos 14 dias
        </p>
      </header>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KpiCard
          label="DAU (Hoje)"
          value={todayMetrics?.dau ?? 0}
          delta={calcDelta(todayMetrics?.dau, yesterdayMetrics?.dau)}
          deltaType={calcDeltaClass(todayMetrics?.dau, yesterdayMetrics?.dau)}
        />
        <KpiCard label="WAU (7 dias)" value={wau} />
        <KpiCard label="Sessões (14d)" value={totalSessions} />
        <KpiCard label="Sessão Média" value={formatDuration(avgSessionDuration)} />
        <KpiCard
          label="Quizzes Hoje"
          value={todayMetrics?.quizzes_started ?? 0}
          delta={calcDelta(todayMetrics?.quizzes_started, yesterdayMetrics?.quizzes_started)}
          deltaType={calcDeltaClass(todayMetrics?.quizzes_started, yesterdayMetrics?.quizzes_started)}
        />
        <KpiCard
          label="Chat Msgs Hoje"
          value={todayMetrics?.chat_messages ?? 0}
          delta={calcDelta(todayMetrics?.chat_messages, yesterdayMetrics?.chat_messages)}
          deltaType={calcDeltaClass(todayMetrics?.chat_messages, yesterdayMetrics?.chat_messages)}
        />
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        <div className="glass-card">
          <div className="chart-header">
            <h2 className="chart-title"><TrendingUp size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} /> Engagement Geral</h2>
          </div>
          <EngagementChart data={daily} />
        </div>
        
        <div className="glass-card">
          <div className="chart-header">
            <h2 className="chart-title"><Activity size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} /> Uso de Funcionalidades</h2>
          </div>
          <FeatureUsageChart data={daily} />
        </div>
      </div>

      {/* Daily Table */}
      <section className="glass-card" style={{ marginBottom: 48 }}>
        <div className="chart-header">
          <h2 className="chart-title">Métricas Diárias</h2>
        </div>

        {daily.length === 0 ? (
          <div className="empty-state-glass">
            <Activity size={48} style={{ color: "var(--muted-soft)", opacity: 0.5, marginBottom: 16 }} />
            <p style={{ color: "var(--muted)", fontSize: "1.1rem" }}>
              Ainda não há dados analíticos para os últimos 14 dias.
            </p>
          </div>
        ) : (
          <div className="glass-table-wrapper">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Dia</th>
                  <th>DAU</th>
                  <th>Visualizações</th>
                  <th>Quizz Iníc.</th>
                  <th>Quizz Concl.</th>
                  <th>Exames</th>
                  <th>Chat</th>
                  <th>Dúvidas</th>
                  <th>Total Eventos</th>
                </tr>
              </thead>
              <tbody>
                {daily.map((d) => (
                  <tr key={d.day}>
                    <td><span className="badge-date">{new Date(d.day).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}</span></td>
                    <td className="bold-cell">{d.dau}</td>
                    <td>{d.screen_views}</td>
                    <td>{d.quizzes_started}</td>
                    <td>{d.quizzes_completed}</td>
                    <td>{d.exams_started}</td>
                    <td>{d.chat_messages}</td>
                    <td>{d.doubts_asked}</td>
                    <td className="bold-cell" style={{ color: 'var(--accent-strong)' }}>{d.total_events}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* User Activity */}
      <section className="glass-card">
        <div className="chart-header">
          <h2 className="chart-title"><Users size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} /> Utilizadores Mais Ativos (7d)</h2>
        </div>

        {userSummaries.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>Sem dados de utilizadores recentes.</p>
        ) : (
          <div className="glass-table-wrapper">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Utilizador</th>
                  <th>Sessões</th>
                  <th>Duração Média</th>
                  <th>Eventos Gerados</th>
                  <th>Última Atividade</th>
                </tr>
              </thead>
              <tbody>
                {userSummaries.slice(0, 15).map((u) => (
                  <tr key={u.user_id}>
                    <td className="bold-cell">{u.name || (u.user_id ? u.user_id.slice(0, 8) + "…" : "Anónimo")}</td>
                    <td>{u.total_sessions}</td>
                    <td>{formatDuration(u.avg_session_seconds)}</td>
                    <td className="bold-cell" style={{ color: 'var(--accent-strong)' }}>{u.total_events}</td>
                    <td style={{ color: "var(--muted)" }}>
                      {u.last_active ? new Date(u.last_active).toLocaleDateString("pt-PT", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function KpiCard({ label, value, delta, deltaType }: { label: string; value: string | number; delta?: string; deltaType?: string }) {
  return (
    <div className="glass-card">
      <span className="kpi-label">{label}</span>
      <div className="kpi-value">{value}</div>
      {delta && (
        <div className="kpi-delta-wrapper">
          <span className={`kpi-delta ${deltaType}`}>
            {delta}
          </span>
          <span style={{ color: "var(--muted-soft)", fontSize: "0.8rem", fontWeight: 500 }}>vs ontem</span>
        </div>
      )}
    </div>
  );
}
