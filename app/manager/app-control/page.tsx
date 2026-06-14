import { Shield, Smartphone, ToggleLeft, Users, Activity, Lock } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  blockUserByEmail,
  saveAppControlSettings,
  saveBuildRule,
  saveFeatureFlag,
  unblockUser,
} from "./actions";

export const dynamic = "force-dynamic";

type AuthUserLite = {
  id: string;
  email?: string;
  created_at?: string;
  last_sign_in_at?: string | null;
};

async function getAuthUsers(): Promise<AuthUserLite[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) {
    console.error("Failed to load auth users", error);
    return [];
  }
  return data.users.map((user) => ({
    id: user.id,
    email: user.email,
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at,
  }));
}

async function getAppControlData() {
  const supabase = getSupabaseAdmin();
  const [settingsRes, flagsRes, buildsRes, accessRes, walletsRes, authUsers] = await Promise.all([
    supabase.from("app_control_settings").select("*").eq("id", true).maybeSingle(),
    supabase.from("app_feature_flags").select("*").order("key"),
    supabase.from("app_build_rules").select("*").order("platform").order("build_number"),
    supabase.from("app_user_access").select("*").order("updated_at", { ascending: false }),
    supabase.from("user_token_wallets").select("user_id, plan_code, daily_limit_tokens, daily_used_tokens, lifetime_used_tokens"),
    getAuthUsers(),
  ]);

  const walletMap = new Map((walletsRes.data ?? []).map((wallet) => [wallet.user_id, wallet]));
  const accessMap = new Map((accessRes.data ?? []).map((access) => [access.user_id, access]));
  const users = authUsers
    .map((user) => ({
      ...user,
      wallet: walletMap.get(user.id) ?? null,
      access: accessMap.get(user.id) ?? null,
    }))
    .sort((a, b) => String(a.email ?? "").localeCompare(String(b.email ?? "")));

  return {
    settings: settingsRes.data,
    flags: flagsRes.data ?? [],
    builds: buildsRes.data ?? [],
    accessRows: accessRes.data ?? [],
    users,
  };
}

function Badge({ tone, children }: { tone: "success" | "danger" | "warning" | "neutral"; children: ReactNode }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function fmtDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" });
}

export default async function AppControlPage() {
  const { settings, flags, builds, accessRows, users } = await getAppControlData();
  const blockedCount = accessRows.filter((row) => row.status === "blocked").length;
  const betaEnabled = Boolean(settings?.beta_all_access_enabled);
  const allowlistText = Array.isArray(settings?.maintenance_allowlist_emails)
    ? settings.maintenance_allowlist_emails.join("\n")
    : "";

  return (
    <div style={{ padding: "48px", maxWidth: 1440, margin: "0 auto", width: "100%" }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 24, alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 10 }}>
            <Shield size={28} /> App Control
          </h1>
          <p style={{ color: "var(--muted)", margin: 0 }}>
            Kill switch, beta premium, builds, features e bloqueios de utilizadores.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Badge tone={settings?.app_status === "normal" ? "success" : settings?.app_status === "maintenance" ? "warning" : "danger"}>
            app {settings?.app_status ?? "normal"}
          </Badge>
          <Badge tone={betaEnabled ? "success" : "neutral"}>{betaEnabled ? "beta premium ativo" : "beta desligado"}</Badge>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 18, marginBottom: 24 }}>
        <SummaryCard icon={<Activity size={18} />} label="Estado" value={settings?.app_status ?? "normal"} />
        <SummaryCard icon={<Users size={18} />} label="Users bloqueados" value={String(blockedCount)} />
        <SummaryCard icon={<Smartphone size={18} />} label="Builds com regra" value={String(builds.length)} />
        <SummaryCard icon={<ToggleLeft size={18} />} label="Flags ativas" value={`${flags.filter((flag) => flag.enabled).length}/${flags.length}`} />
      </div>

      <section className="panel pad" style={{ marginBottom: 24 }}>
        <h2 style={sectionTitleStyle}>Global</h2>
        <form action={saveAppControlSettings} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <label style={fieldStyle}>
            <span style={labelStyle}>Estado da app</span>
            <select name="app_status" defaultValue={settings?.app_status ?? "normal"} style={inputStyle}>
              <option value="normal">normal</option>
              <option value="maintenance">maintenance</option>
              <option value="disabled">disabled</option>
            </select>
          </label>
          <label style={fieldStyle}>
            <span style={labelStyle}>Braincells beta/dia</span>
            <input name="beta_daily_braincells" type="number" min={0} defaultValue={settings?.beta_daily_braincells ?? 2000} style={inputStyle} />
          </label>
          <label style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
            <span style={labelStyle}>Emails permitidos em manutenção</span>
            <textarea name="maintenance_allowlist_emails" defaultValue={allowlistText} rows={4} style={{ ...inputStyle, resize: "vertical" }} />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text)" }}>
            <input name="beta_all_access_enabled" type="checkbox" defaultChecked={betaEnabled} />
            Beta premium global ativo
          </label>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="button" type="submit">Guardar global</button>
          </div>
        </form>
        <div style={{ marginTop: 18, color: "var(--muted)", fontSize: "0.85rem" }}>
          Mensagens fixas na app: "Versão descontinuada, atualiza", "Wolfie está temporariamente em manutenção."
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        <section className="panel pad">
          <h2 style={sectionTitleStyle}>Features</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {flags.map((flag) => (
              <form key={flag.key} action={saveFeatureFlag} style={rowStyle}>
                <input type="hidden" name="key" value={flag.key} />
                <div>
                  <div style={{ fontWeight: 700 }}>{flag.label}</div>
                  <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{flag.key}</div>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input name="enabled" type="checkbox" defaultChecked={flag.enabled} />
                  <span>{flag.enabled ? "ativa" : "desligada"}</span>
                </label>
                <button className="button ghost" type="submit">Guardar</button>
              </form>
            ))}
          </div>
        </section>

        <section className="panel pad">
          <h2 style={sectionTitleStyle}>Builds</h2>
          <form action={saveBuildRule} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            <select name="platform" defaultValue="android" style={inputStyle}>
              <option value="android">Android</option>
              <option value="ios">iOS</option>
            </select>
            <input name="build_number" type="number" min={1} placeholder="versionCode/buildNumber" style={inputStyle} />
            <select name="status" defaultValue="blocked" style={inputStyle}>
              <option value="blocked">blocked</option>
              <option value="force_update">force_update</option>
              <option value="allowed">allowed</option>
            </select>
            <input name="notes" placeholder="Notas internas" style={inputStyle} />
            <button className="button" type="submit" style={{ gridColumn: "1 / -1" }}>Guardar regra de build</button>
          </form>
          <div className="table-wrap">
            <table className="ops-table">
              <thead>
                <tr><th>Plataforma</th><th>Build</th><th>Status</th><th>Notas</th></tr>
              </thead>
              <tbody>
                {builds.map((build) => (
                  <tr key={build.id}>
                    <td>{build.platform}</td>
                    <td>{build.build_number}</td>
                    <td><Badge tone={build.status === "allowed" ? "success" : "danger"}>{build.status}</Badge></td>
                    <td>{build.notes ?? "-"}</td>
                  </tr>
                ))}
                {builds.length === 0 ? <tr><td colSpan={4} style={{ color: "var(--muted)" }}>Sem builds bloqueadas.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="panel pad" style={{ marginBottom: 24 }}>
        <h2 style={sectionTitleStyle}>Bloquear User</h2>
        <form action={blockUserByEmail} style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 12 }}>
          <input name="email" type="email" placeholder="email do aluno" style={inputStyle} />
          <input name="reason" placeholder="motivo interno" style={inputStyle} />
          <button className="button danger" type="submit"><Lock size={14} /> Bloquear</button>
        </form>
      </section>

      <section className="panel pad">
        <h2 style={sectionTitleStyle}>Users</h2>
        <div className="table-wrap">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Acesso</th>
                <th>Plano</th>
                <th>Braincells hoje</th>
                <th>Último login</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const blocked = user.access?.status === "blocked";
                const dailyLimit = Number(user.wallet?.daily_limit_tokens ?? 0);
                const dailyUsed = Number(user.wallet?.daily_used_tokens ?? 0);
                return (
                  <tr key={user.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{user.email ?? "sem email"}</div>
                      <div style={{ color: "var(--muted-soft)", fontSize: "0.75rem", fontFamily: "monospace" }}>{user.id.slice(0, 8)}...</div>
                    </td>
                    <td><Badge tone={blocked ? "danger" : "success"}>{blocked ? "blocked" : "active"}</Badge></td>
                    <td>{user.wallet?.plan_code ?? "-"}</td>
                    <td>{dailyUsed}/{dailyLimit}</td>
                    <td>{fmtDate(user.last_sign_in_at)}</td>
                    <td style={{ textAlign: "right" }}>
                      {blocked ? (
                        <form action={unblockUser}>
                          <input type="hidden" name="user_id" value={user.id} />
                          <button className="button ghost" type="submit">Desbloquear</button>
                        </form>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="panel pad" style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--muted)" }}>{icon}{label}</div>
      <div style={{ fontSize: "1.45rem", fontWeight: 800 }}>{value}</div>
    </div>
  );
}

const sectionTitleStyle: CSSProperties = {
  margin: "0 0 16px",
  fontSize: "1.1rem",
  fontWeight: 800,
};

const fieldStyle: CSSProperties = {
  display: "grid",
  gap: 8,
};

const labelStyle: CSSProperties = {
  color: "var(--muted)",
  fontSize: "0.85rem",
  fontWeight: 600,
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: 42,
  borderRadius: 8,
  border: "1px solid var(--line)",
  background: "var(--bg-subtle)",
  color: "var(--text)",
  padding: "0 12px",
};

const rowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto auto",
  gap: 12,
  alignItems: "center",
  padding: 12,
  borderRadius: 8,
  background: "var(--bg-subtle)",
  border: "1px solid var(--line)",
};
