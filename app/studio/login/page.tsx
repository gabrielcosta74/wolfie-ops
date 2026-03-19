"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { loginStudio } from "@/lib/login-actions";

export default function StudioLoginPage() {
  const [state, formAction, isPending] = useActionState(loginStudio, { error: "" });
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";

  return (
    <div className="st-login-page">
      <div className="st-login-card">
        <h1>Entrar no Studio</h1>
        <p>Acede ao portal de professores do Wolfi.</p>

        <form action={formAction} className="st-form">
          <input type="hidden" name="next" value={next} />
          {state.error && <div className="st-feedback error">{state.error}</div>}

          <div className="st-field">
            <label className="st-label st-label-required" htmlFor="st-identifier">Username ou email</label>
            <input
              name="identifier"
              type="text"
              id="st-identifier"
              className="st-input"
              placeholder="O teu username ou email"
              required
              autoFocus
            />
          </div>

          <div className="st-field">
            <label className="st-label st-label-required" htmlFor="st-pass">Password</label>
            <input
              name="password"
              type="password"
              id="st-pass"
              className="st-input"
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="st-login-submit" disabled={isPending}>
            {isPending ? "A entrar..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
