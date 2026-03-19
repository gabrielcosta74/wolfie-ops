"use client";

export function ShareButton() {
  async function handleShare() {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return;
    }

    const url = window.location.origin + "/contribuir";
    const shareData = {
      title: "Wolfi — Contribuir",
      text: "Tens um recurso útil para estudar? Partilha com outros alunos no Wolfi!",
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // cancelled — fine
      }
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      alert("Link copiado!");
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <button type="button" onClick={handleShare} className="ct-share-btn">
      📤 Partilhar com amigos
    </button>
  );
}
