import type { Metadata } from "next";
import Link from "next/link";
import { ShareButton } from "./ShareButton";

export const metadata: Metadata = {
  title: "Obrigado! | Wolfi",
  description: "A tua sugestão foi recebida. Obrigado por contribuir para o Wolfi!",
};

export default function ObrigadoPage() {
  return (
    <>
      <nav className="ct-nav">
        <a href="/" className="ct-logo">
          <div className="ct-logo-w">W</div>
          Wolfi
        </a>
      </nav>

      <section className="ct-zone" style={{ paddingTop: "80px" }}>
        <div className="ct-wizard">
          <div className="ct-pane ct-thanks">
            <div className="ct-thanks-ring">✦</div>
            <h2>Obrigado pela<br />tua contribuição!</h2>
            <p>
              O teu recurso vai ser revisto e pode aparecer na app Wolfi
              para ajudar outros alunos a estudar melhor.
            </p>
            <div className="ct-thanks-actions">
              <ShareButton />
              <Link href="/contribuir" className="ct-again-link">
                Contribuir mais →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="ct-footer">
        © {new Date().getFullYear()} Wolfi AI ·{" "}
        <a href="/">Voltar ao início</a>
      </footer>
    </>
  );
}
