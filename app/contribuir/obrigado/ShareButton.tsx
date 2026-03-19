"use client";

export function ShareButton() {
  async function handleShare() {
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
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copiado!");
    }
  }

  return (
    <button type="button" onClick={handleShare} className="ct-share-btn">
      📤 Partilhar com amigos
    </button>
  );
}
