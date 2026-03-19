import Link from "next/link";

export default function OpsUnauthorizedPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(180deg, #020817 0%, #111827 100%)",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(15, 23, 42, 0.88)",
          padding: 32,
          color: "#e2e8f0",
        }}
      >
        <div style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8" }}>
          Wolfi Ops
        </div>
        <h1 style={{ marginTop: 10, fontSize: 32, color: "#f8fafc" }}>
          Sem permissões para esta área
        </h1>
        <p style={{ marginTop: 12, color: "#94a3b8", lineHeight: 1.6 }}>
          A tua conta está autenticada, mas não tem um role administrativo válido
          para aceder ao Manager.
        </p>
        <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link
            href="/ops/login"
            style={{
              borderRadius: 14,
              background: "#2563eb",
              color: "#fff",
              padding: "12px 16px",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Tentar outra conta
          </Link>
          <Link
            href="/"
            style={{
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#e2e8f0",
              padding: "12px 16px",
              textDecoration: "none",
            }}
          >
            Voltar ao site
          </Link>
        </div>
      </div>
    </div>
  );
}
