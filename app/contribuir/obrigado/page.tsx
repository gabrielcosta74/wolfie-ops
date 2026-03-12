import type { Metadata } from "next";
import Link from "next/link";
import { ShareButton } from "./ShareButton";

export const metadata: Metadata = {
  title: "Obrigado! | Wolfie Contribuir",
  description: "A tua sugestão foi recebida. Obrigado por contribuir!",
};

export default function ObrigadoPage() {
  return (
    <main className="ct-main">
      <div className="ct-thankyou">
        <div className="ct-thankyou-icon">🎉</div>
        <h1>Obrigado pela tua contribuição!</h1>
        <p>
          A tua sugestão foi recebida e será analisada pela equipa Wolfie.
          Juntos tornamos a preparação para o exame mais acessível.
        </p>
        <div className="ct-thankyou-actions">
          <ShareButton />
          <Link href="/contribuir" className="ct-btn ct-btn--secondary">
            Enviar outra sugestão
          </Link>
        </div>
      </div>
    </main>
  );
}
