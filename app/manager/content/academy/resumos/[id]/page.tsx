import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { notFound } from "next/navigation";
import { ResumoEditor } from "../ResumoEditor";

export const dynamic = "force-dynamic";

export default async function EditResumoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const [resourceRes, themesRes, subtopicsRes] = await Promise.all([
    supabase
      .from("edu_content_resources")
      .select("id, subtema_id, title, markdown_content, author_credit, is_premium")
      .eq("id", id)
      .eq("type", "summary")
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

  const resource = resourceRes.data;
  const themes = themesRes.data ?? [];
  const subtopics = subtopicsRes.data ?? [];

  return (
    <div className="ac-main" data-editor="">
      <ResumoEditor themes={themes} subtopics={subtopics} resource={resource} />
    </div>
  );
}
