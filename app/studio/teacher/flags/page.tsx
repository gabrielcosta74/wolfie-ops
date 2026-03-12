import { requireTeacherUser } from "@/lib/studio-auth";
import { FlagForm } from "./FlagForm";

export default async function TeacherFlagsPage({ searchParams }: { searchParams: Promise<{ success?: string }> }) {
  const user = await requireTeacherUser();

  const params = await searchParams;

  return (
    <>
      <div className="st-page-header">
        <div>
          <h1 className="st-page-title">Sinalizar erro</h1>
          <p className="st-page-subtitle">Encontraste um problema? Diz-nos para podermos corrigir.</p>
        </div>
      </div>

      {params.success === "1" && (
        <div className="st-feedback success" style={{ marginBottom: 20 }}>
          ✓ Flag enviada com sucesso! A equipa vai analisar. Obrigado!
        </div>
      )}

      <div className="st-form-card">
        <FlagForm email={user.email ?? ""} />
      </div>
    </>
  );
}
