import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { VideoForm } from "../VideoForm";

export const dynamic = "force-dynamic";

export default async function NovoVideoPage() {
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

  return <VideoForm themes={themes} subtopics={subtopics} />;
}
