import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { notFound } from "next/navigation";
import { VideoForm } from "../VideoForm";

export const dynamic = "force-dynamic";

export default async function EditVideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const [resourceRes, themesRes, subtopicsRes] = await Promise.all([
    supabase
      .from("edu_content_resources")
      .select("id, subtema_id, title, video_url, video_start_at, author_credit, is_premium")
      .eq("id", id)
      .eq("type", "video")
      .single(),
    supabase.from("edu_temas_exame").select("id, codigo, nome, ordem").order("ordem"),
    supabase
      .from("edu_subtemas_exame")
      .select("id, tema_id, codigo, nome, ordem")
      .order("tema_id")
      .order("ordem"),
  ]);

  if (!resourceRes.data) {
    notFound();
  }

  const themes = themesRes.data ?? [];
  const subtopics = subtopicsRes.data ?? [];

  return <VideoForm themes={themes} subtopics={subtopics} resource={resourceRes.data} />;
}
