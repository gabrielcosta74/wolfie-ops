import "../auth.css";

export const metadata = {
  title: "Conta confirmada | Wolfi",
};

export default function AuthConfirmedPage() {
  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="confirmed-title">
        <div className="auth-brand">
          <div className="auth-mark">W</div>
          <div>
            <p className="auth-kicker">Wolfi</p>
            <h1 id="confirmed-title" className="auth-title">
              Conta confirmada
            </h1>
          </div>
        </div>

        <p className="auth-copy">
          O teu email foi confirmado. Agora podes voltar à app Wolfi e entrar
          com o email e senha que escolheste no registo.
        </p>

        <div className="auth-actions">
          <a className="auth-secondary-link" href="wolfi://">
            Abrir app Wolfi
          </a>
          <a className="auth-secondary-link" href="/">
            Voltar ao site
          </a>
        </div>
      </section>
    </main>
  );
}
