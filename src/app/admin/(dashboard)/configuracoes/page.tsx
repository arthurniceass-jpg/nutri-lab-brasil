import { getSettings } from "@/server/services/settings";
import { prisma } from "@/server/db/prisma";
import { SettingsManager } from "@/components/admin/settings-manager";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const [settings, coupons] = await Promise.all([
    getSettings(),
    prisma.coupon.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return <SettingsManager settings={settings} coupons={coupons} />;
}
