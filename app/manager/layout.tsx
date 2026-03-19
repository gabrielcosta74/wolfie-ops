import { requireManagerUser } from "@/lib/ops-auth";

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireManagerUser();
  return <>{children}</>;
}
