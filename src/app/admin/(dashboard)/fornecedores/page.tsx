import { prisma } from "@/server/db/prisma";
import { SuppliersManager } from "@/components/admin/suppliers-manager";

export const dynamic = "force-dynamic";

export default async function FornecedoresPage() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
  });
  return <SuppliersManager suppliers={suppliers} />;
}
