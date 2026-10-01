import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/server/db/prisma";
import { isValidEmail } from "@/server/auth/customer";
import { getSettings } from "@/server/services/settings";
import { sendEmail } from "@/server/services/email";

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));
  const normalized = String(email ?? "").trim().toLowerCase();

  // Resposta generica para não revelar se o email existe
  const generic = NextResponse.json({ ok: true });
  if (!isValidEmail(normalized)) return generic;

  const customer = await prisma.customer.findUnique({
    where: { email: normalized },
  });
  if (!customer) return generic;

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await prisma.customer.update({
    where: { id: customer.id },
    data: { resetToken: token, resetTokenExpiry: expiry },
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const link = `${baseUrl}/conta/redefinir?token=${token}`;
  const settings = await getSettings();

  await sendEmail({
    to: customer.email,
    subject: "Redefinição de senha - NUTRI LAB BRASIL",
    html: `
      <div style="background:#0A0A0A;color:#FAFAFA;font-family:Arial,sans-serif;padding:32px;border-radius:12px;max-width:520px;margin:auto">
        <div style="font-size:26px;font-weight:900;font-style:italic">NUTRI<span style="color:#C2EE3E">LAB</span></div>
        <h1 style="color:#C2EE3E;font-size:22px;margin:20px 0 8px">Redefinir senha</h1>
        <p style="color:#d4d4d4;line-height:1.6">Olá, ${customer.name}. Recebemos um pedido para redefinir sua senha. Clique no botão abaixo (o link vale por 1 hora):</p>
        <a href="${link}" style="display:inline-block;margin:16px 0;background:#C2EE3E;color:#0A0A0A;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:6px">Criar nova senha</a>
        <p style="color:#737373;font-size:12px">Se você não pediu isso, ignore este email.</p>
        <p style="color:#737373;font-size:12px;border-top:1px solid #262626;padding-top:14px;margin-top:20px">${settings.storeName}</p>
      </div>`,
  });

  return generic;
}
