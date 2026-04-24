"use client";

import { useMemo, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import "../auth.css";

type RequestStatus = "idle" | "sending" | "sent";

function getSiteBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_WOLFI_AUTH_BASE_URL;
  if (configuredUrl) return configuredUrl.replace(/\/+$/, "");
  return window.location.origin;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!normalizedEmail) {
      setError("Insere o email da tua conta Wolfi.");
      return;
    }

    setStatus("sending");
    setError("");
    setMessage("");

    const supabase = getSupabaseBrowser();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${getSiteBaseUrl()}/auth/reset-password`,
    });

    if (resetError) {
      setStatus("idle");
      setError(resetError.message);
      return;
    }

    setStatus("sent");
    setMessage(
      `Enviámos um link de recuperação para ${normalizedEmail}. Abre o email e define uma nova senha em wolfi.pt.`
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="forgot-password-title">
        <div className="auth-brand">
          <div className="auth-mark">W</div>
          <div>
            <p className="auth-kicker">Wolfi</p>
            <h1 id="forgot-password-title" className="auth-title">
              Recuperar acesso
            </h1>
          </div>
        </div>

        <p className="auth-copy">
          Insere o email que usas na app Wolfi. Vamos enviar-te um link seguro
          para criares uma nova senha neste site.
        </p>

        {status === "sent" ? (
          <div className="auth-actions">
            <p className="auth-message" data-tone="success">
              {message}
            </p>
            <button
              className="auth-button"
              type="button"
              onClick={() => {
                setStatus("idle");
                setMessage("");
              }}
            >
              Enviar para outro email
            </button>
            <a className="auth-secondary-link" href="wolfi://">
              Abrir app Wolfi
            </a>
          </div>
        ) : (
          <>
            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="auth-field">
                <span className="auth-label">Email</span>
                <input
                  className="auth-input"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={status === "sending"}
                  required
                />
              </label>

              <button className="auth-button" type="submit" disabled={status === "sending"}>
                {status === "sending" ? "A enviar..." : "Enviar link de recuperação"}
              </button>
            </form>

            {error ? (
              <p className="auth-message" data-tone="error">
                {error}
              </p>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
