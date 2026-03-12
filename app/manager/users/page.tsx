import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { Users, Crown, User, Activity, Calendar, Target } from "lucide-react";

export const dynamic = "force-dynamic";

async function getUserManagementData() {
  const supabase = getSupabaseAdmin();

  const now = new Date();
  const todayStr = now.toISOString().substring(0, 10);
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

  const [
    profilesRes,
    walletsRes,
    onboardingRes,
    recentSessionsRes,
    dauRes,
    wauRes,
    mauRes,
  ] = await Promise.all([
    supabase.from("profiles").select("user_id, name, level, xp_total, current_streak, highest_streak, last_activity, last_active_date, created_at"),
    supabase.from("user_token_wallets").select("user_id, plan_code, status, monthly_used_tokens, lifetime_used_tokens"),
    supabase.from("user_onboarding").select("user_id, school_year, goal, self_level, study_time"),
    supabase.from("quiz_sessoes").select("user_id, created_at").order("created_at", { ascending: false }).limit(500),
    // DAU: users with activity today
    supabase.from("profiles").select("user_id", { count: "exact", head: true }).eq("last_active_date", todayStr),
    // WAU: users with activity in last 7 days
    supabase.from("profiles").select("user_id", { count: "exact", head: true }).gte("last_activity", weekAgo),
    // MAU: users with activity in last 30 days
    supabase.from("profiles").select("user_id", { count: "exact", head: true }).gte("last_activity", monthAgo),
  ]);

  const profiles = profilesRes.data || [];
  const wallets = walletsRes.data || [];
  const onboarding = onboardingRes.data || [];
  const recentSessions = recentSessionsRes.data || [];

  const walletMap = new Map(wallets.map(w => [w.user_id, w]));
  const onboardingMap = new Map(onboarding.map(o => [o.user_id, o]));

  // Sessions per user (from recent)
  const sessionsByUser = new Map<string, number>();
  for (const s of recentSessions) {
    sessionsByUser.set(s.user_id, (sessionsByUser.get(s.user_id) || 0) + 1);
  }

  // Build user list
  const users = profiles.map(p => {
    const wallet = walletMap.get(p.user_id);
    const ob = onboardingMap.get(p.user_id);
    return {
      userId: p.user_id,
      name: p.name || "Sem nome",
      plan: wallet?.plan_code || "free",
      level: p.level || 1,
      xp: p.xp_total || 0,
      streak: p.current_streak || 0,
      highestStreak: p.highest_streak || 0,
      lastActive: p.last_activity,
      createdAt: p.created_at,
      sessions: sessionsByUser.get(p.user_id) || 0,
      lifetimeTokens: wallet?.lifetime_used_tokens || 0,
      schoolYear: ob?.school_year || null,
      goal: ob?.goal || null,
      selfLevel: ob?.self_level || null,
      didOnboarding: !!ob,
    };
  }).sort((a, b) => {
    // Sort by last active desc
    const aDate = a.lastActive ? new Date(a.lastActive).getTime() : 0;
    const bDate = b.lastActive ? new Date(b.lastActive).getTime() : 0;
    return bDate - aDate;
  });

  // Onboarding funnel
  const totalUsers = users.length;
  const withOnboarding = users.filter(u => u.didOnboarding).length;
  const onboardingRate = totalUsers > 0 ? Math.round((withOnboarding / totalUsers) * 100) : 0;

  // Goal distribution
  const goalCounts: Record<string, number> = {};
  for (const ob of onboarding) {
    const g = ob.goal || "unknown";
    goalCounts[g] = (goalCounts[g] || 0) + 1;
  }

  // Year distribution
  const yearCounts: Record<string, number> = {};
  for (const ob of onboarding) {
    const y = ob.school_year || "unknown";
    yearCounts[y] = (yearCounts[y] || 0) + 1;
  }

  return {
    users,
    dau: dauRes.count || 0,
    wau: wauRes.count || 0,
    mau: mauRes.count || 0,
    totalUsers,
    onboardingRate,
    withOnboarding,
    goalCounts,
    yearCounts,
  };
}

const goalLabels: Record<string, string> = {
  exam_grade: "Nota no Exame",
  pass_fast: "Passar Rápido",
  improve_average: "Melhorar Média",
  university_prep: "Prep. Universidade",
  gain_confidence: "Ganhar Confiança",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" });
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "nunca";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

export default async function UserManagementPage() {
  const d = await getUserManagementData();

  return (
    <div style={{ padding: "48px 48px", maxWidth: 1400, margin: "0 auto", width: "100%" }}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>
          👥 Utilizadores
        </h1>
        <p style={{ fontSize: "1rem", color: "var(--muted)" }}>
          Visão geral dos utilizadores, engagement e onboarding.
        </p>
      </header>

      {/* Activity KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
        <KpiCard label="Total Users" value={String(d.totalUsers)} icon={<Users size={18} />} color="var(--accent)" />
        <KpiCard label="DAU (Hoje)" value={String(d.dau)} icon={<Activity size={18} />} color="var(--success)" />
        <KpiCard label="WAU (7 dias)" value={String(d.wau)} icon={<Activity size={18} />} color="var(--info)" />
        <KpiCard label="MAU (30 dias)" value={String(d.mau)} icon={<Activity size={18} />} color="var(--warning)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        {/* Onboarding Funnel */}
        <div className="panel pad">
          <h3 style={{ margin: "0 0 16px", fontSize: "1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
            <Target size={18} style={{ color: "var(--accent)" }} />
            Onboarding
          </h3>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
              <span style={{ color: "var(--muted)" }}>Completaram onboarding</span>
              <span style={{ fontWeight: 600 }}>{d.withOnboarding} / {d.totalUsers} ({d.onboardingRate}%)</span>
            </div>
            <div style={{ height: 8, background: "var(--surface-raised)", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${d.onboardingRate}%`, background: "var(--accent)", borderRadius: 999 }} />
            </div>
          </div>

          {/* Goal distribution */}
          {Object.keys(d.goalCounts).length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h4 style={{ margin: "0 0 12px", fontSize: "0.85rem", fontWeight: 600, color: "var(--muted)" }}>Objetivos dos Alunos</h4>
              <div style={{ display: "grid", gap: 8 }}>
                {Object.entries(d.goalCounts).map(([goal, count]) => (
                  <div key={goal} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", padding: "6px 10px", background: "var(--surface-raised)", borderRadius: "var(--radius-sm)" }}>
                    <span>{goalLabels[goal] || goal}</span>
                    <span style={{ fontWeight: 600 }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Year distribution */}
        <div className="panel pad">
          <h3 style={{ margin: "0 0 16px", fontSize: "1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
            <Calendar size={18} style={{ color: "var(--info)" }} />
            Distribuição por Ano
          </h3>
          {Object.keys(d.yearCounts).length > 0 ? (
            <div style={{ display: "grid", gap: 12 }}>
              {Object.entries(d.yearCounts).map(([year, count]) => {
                const maxCount = Math.max(...Object.values(d.yearCounts), 1);
                const pct = Math.round((count / maxCount) * 100);
                return (
                  <div key={year}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: "0.85rem" }}>
                      <span style={{ fontWeight: 500 }}>{year}º Ano</span>
                      <span style={{ color: "var(--muted)" }}>{count} alunos</span>
                    </div>
                    <div style={{ height: 6, background: "var(--surface-raised)", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: "var(--info)", borderRadius: 999 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: "24px" }}>
              <p>Sem dados de onboarding.</p>
            </div>
          )}
        </div>
      </div>

      {/* User Table */}
      <div className="panel pad">
        <h3 style={{ margin: "0 0 16px", fontSize: "1rem", fontWeight: 600 }}>
          Todos os Utilizadores
        </h3>
        <div className="table-wrap">
          <table className="ops-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Plano</th>
                <th style={{ textAlign: "right" }}>Level</th>
                <th style={{ textAlign: "right" }}>XP</th>
                <th style={{ textAlign: "right" }}>Streak</th>
                <th style={{ textAlign: "right" }}>Sessions</th>
                <th>Ano</th>
                <th>Último Ativo</th>
              </tr>
            </thead>
            <tbody>
              {d.users.map(u => (
                <tr key={u.userId}>
                  <td>
                    <span style={{ fontWeight: 500 }}>{u.name}</span>
                    <br />
                    <span style={{ fontSize: "0.75rem", color: "var(--muted-soft)", fontFamily: "monospace" }}>
                      {u.userId.substring(0, 8)}…
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.plan === "premium" ? "success" : "neutral"}`}>{u.plan}</span>
                  </td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{u.level}</td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{u.xp}</td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {u.streak > 0 ? `🔥 ${u.streak}` : "0"}
                  </td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{u.sessions}</td>
                  <td>{u.schoolYear ? `${u.schoolYear}º` : "—"}</td>
                  <td style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{timeAgo(u.lastActive)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon, color }: {
  label: string; value: string; icon: React.ReactNode; color: string;
}) {
  return (
    <div className="panel pad" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
        <span style={{ color, opacity: 0.7 }}>{icon}</span>
      </div>
      <span style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.02em" }}>{value}</span>
    </div>
  );
}
