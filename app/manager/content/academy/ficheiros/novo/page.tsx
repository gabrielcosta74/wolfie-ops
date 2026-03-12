import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { FicheiroForm } from "../FicheiroForm";

export const dynamic = "force-dynamic";

export default async function NovoFicheiroPage() {
  const supabase = getSupabaseAdmin();

  const [themesRes, subtopicsRes] = await Promise.all([
    supabase.from("edu_temas_exame").select("id, codigo, nome, ordem").order("ordem"),
    supabase
      .from("edu_subtemas_exame")
      .select("id, tema_id, codigo, nome, ordem")
      .order("tema_id")
      .order("ordem"),
  ]);

  const themes = themesRes.data ?? [];
  const subtopics = subtopicsRes.data ?? [];

  return <FicheiroForm themes={themes} subtopics={subtopics} />;
}
