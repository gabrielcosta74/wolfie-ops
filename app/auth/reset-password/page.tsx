"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import "../auth.css";

type RecoveryStatus = "checking" | "ready" | "invalid" | "saving" | "success";

function cleanRecoveryUrl() {
  window.history.replaceState(null, "", window.location.pathname);
}

function getHashParams() {
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  return new URLSearchParams(hash);
}

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<RecoveryStatus>("checking");
  const [message, setMessage] = useState("A validar o link de recuperação...");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function establishRecoverySession() {
      const supabase = getSupabaseBrowser();
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = getHashParams();
      const errorDescription =
        searchParams.get("error_description") || hashParams.get("error_description");

      if (errorDescription) {
        if (!cancelled) {
          setStatus("invalid");
          setMessage(errorDescription);
        }
        return;
      }

      try {
        const code = searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          cleanRecoveryUrl();
        } else {
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) throw error;
            cleanRecoveryUrl();
          }
        }

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;
        if (!session) {
          throw new Error("Este link de recuperação já expirou ou não é válido.");
        }

        if (!cancelled) {
          setStatus("ready");
          setMessage("Define uma nova senha para a tua conta Wolfi.");
        }
      } catch (error) {
        if (!cancelled) {
          setStatus("invalid");
          setMessage(
            error instanceof Error
              ? error.message
              : "Não foi possível validar este link de recuperação."
          );
        }
      }
    }

    establishRecoverySession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 8) {
      setMessage("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("As senhas não coincidem.");
      return;
    }

    setStatus("saving");
    setMessage("A guardar a nova senha...");

    const supabase = getSupabaseBrowser();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("ready");
      setMessage(error.message);
      return;
    }

    await supabase.auth.signOut();
    setPassword("");
    setConfirmPassword("");
    setStatus("success");
    setMessage("Senha atualizada. Já podes entrar na app Wolfi com a nova senha.");
  }

  const isBusy = status === "checking" || status === "saving";
  const canEdit = status === "ready" || status === "saving";

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="reset-password-title">
        <div className="auth-brand">
          <div className="auth-mark">W</div>
          <div>
            <p className="auth-kicker">Wolfi</p>
            <h1 id="reset-password-title" className="auth-title">
              Recuperar senha
            </h1>
          </div>
        </div>

        <p className="auth-copy">
          Cria uma nova senha para a mesma conta que usas na app. Depois volta ao
          Wolfi e entra com o teu email.
        </p>

        {status === "success" ? (
          <div className="auth-actions">
            <p className="auth-message" data-tone="success">
              {message}
            </p>
            <a className="auth-secondary-link" href="wolfi://">
              Abrir app Wolfi
            </a>
            <a className="auth-secondary-link" href="/">
              Voltar ao site
            </a>
          </div>
        ) : (
          <>
            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="auth-field">
                <span className="auth-label">Nova senha</span>
                <input
                  className="auth-input"
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={!canEdit}
                  required
                />
              </label>

              <label className="auth-field">
                <span className="auth-label">Confirmar nova senha</span>
                <input
                  className="auth-input"
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={!canEdit}
                  required
                />
              </label>

              <button className="auth-button" type="submit" disabled={!canEdit || isBusy}>
                {status === "saving" ? "A guardar..." : "Guardar nova senha"}
              </button>
            </form>

            <p
              className="auth-message"
              data-tone={status === "invalid" ? "error" : undefined}
            >
              {message}
            </p>

            {status === "invalid" ? (
              <p className="auth-footnote">
                Pede um novo link na app Wolfi através de “Esqueci a minha senha”.
              </p>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
