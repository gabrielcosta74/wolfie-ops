"use client";

export function ShareButton() {
  async function handleShare() {
    const shareData = {
      title: "Wolfie — Contribuir",
      text: "Ajuda outros alunos a prepararem-se para o exame de Matemática A! Envia a tua sugestão de conteúdo no Wolfie.",
      url: window.location.origin + "/contribuir",
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or share failed — that's fine
      }
    } else {
      await navigator.clipboard.writeText(shareData.url);
      alert("Link copiado para a área de transferência!");
    }
  }

  return (
    <button type="button" onClick={handleShare} className="ct-btn ct-btn--primary">
      📤 Partilhar com amigos
    </button>
  );
}
