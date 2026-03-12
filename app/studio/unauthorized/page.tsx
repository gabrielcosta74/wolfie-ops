import Link from "next/link";

export default function StudioUnauthorizedPage() {
  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: "32px",
      }}
    >
      <div className="st-login-card" style={{ maxWidth: 560 }}>
        <h1>Acesso restrito</h1>
        <p>
          O Wolfie Studio está disponível apenas para contas com role
          <code style={{ marginLeft: 6 }}>teacher</code>.
        </p>
        <p style={{ color: "var(--st-muted)" }}>
          Se precisas de acesso, cria ou promove a conta em
          <code style={{ marginLeft: 6 }}>/manager/teachers</code>.
        </p>
        <div className="st-form-actions">
          <Link href="/studio/login" className="st-btn st-btn--secondary">
            Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
}
