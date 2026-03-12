"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function StudioLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = getSupabaseBrowser();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError("Email ou password incorretos.");
      setLoading(false);
      return;
    }

    router.push("/studio/teacher");
    router.refresh();
  }

  return (
    <div className="st-login-page">
      <div className="st-login-card">
        <h1>Entrar no Studio</h1>
        <p>Acede ao portal de professores do Wolfie.</p>

        <form onSubmit={handleSubmit} className="st-form">
          {error && <div className="st-feedback error">{error}</div>}

          <div className="st-field">
            <label className="st-label st-label-required" htmlFor="st-email">Email</label>
            <input
              type="email"
              id="st-email"
              className="st-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="professor@email.com"
              required
              autoFocus
            />
          </div>

          <div className="st-field">
            <label className="st-label st-label-required" htmlFor="st-pass">Password</label>
            <input
              type="password"
              id="st-pass"
              className="st-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="st-login-submit" disabled={loading}>
            {loading ? "A entrar..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
