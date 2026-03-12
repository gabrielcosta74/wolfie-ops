import { requireTeacherUser } from "@/lib/studio-auth";

export default async function TeacherStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireTeacherUser();
  return <>{children}</>;
}
