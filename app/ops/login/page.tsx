"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { loginManager } from "@/lib/login-actions";

function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginManager, { error: "" });
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(180deg, #020817 0%, #0f172a 100%)",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(15, 23, 42, 0.88)",
          padding: 28,
          color: "#e2e8f0",
          boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8" }}>
            Wolfi Ops
          </div>
          <h1 style={{ marginTop: 8, fontSize: 32, lineHeight: 1.05, color: "#f8fafc" }}>
            Entrar no Manager
          </h1>
          <p style={{ marginTop: 10, color: "#94a3b8" }}>
            Acesso restrito a perfis com permissões administrativas.
          </p>
        </div>

        <form action={formAction} style={{ display: "grid", gap: 16 }}>
          <input type="hidden" name="next" value={next} />
          {state.error ? (
            <div
              style={{
                borderRadius: 14,
                border: "1px solid rgba(248,113,113,0.28)",
                background: "rgba(127,29,29,0.35)",
                color: "#fecaca",
                padding: "12px 14px",
                fontSize: 14,
              }}
            >
              {state.error}
            </div>
          ) : null}

          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Username ou email</span>
            <input
              name="identifier"
              type="text"
              placeholder="O teu username ou email"
              autoFocus
              required
              style={{
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.03)",
                padding: "14px 16px",
                color: "#f8fafc",
              }}
            />
          </label>

          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Password</span>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              required
              style={{
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.03)",
                padding: "14px 16px",
                color: "#f8fafc",
              }}
            />
          </label>

          <button
            type="submit"
            disabled={isPending}
            style={{
              borderRadius: 16,
              border: 0,
              background: "#2563eb",
              color: "#fff",
              padding: "14px 16px",
              fontWeight: 700,
              cursor: isPending ? "default" : "pointer",
              opacity: isPending ? 0.7 : 1,
            }}
          >
            {isPending ? "A entrar..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function OpsLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
