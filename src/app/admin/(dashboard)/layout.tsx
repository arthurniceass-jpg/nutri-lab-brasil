import { redirect } from "next/navigation";
import { Sidebar } from "@/components/admin/sidebar";
import { getSession } from "@/server/auth/owner";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar ownerEmail={session.email} />
      <div className="flex-1 overflow-x-hidden">{children}</div>
    </div>
  );
}
