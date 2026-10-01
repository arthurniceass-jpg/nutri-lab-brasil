import "server-only";

type SendArgs = {
  to: string;
  subject: string;
  html: string;
};

// Envia email via Resend se RESEND_API_KEY estiver configurado.
// Sem a chave (dev), registra o email no log em vez de enviar.
export async function sendEmail({ to, subject, html }: SendArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "NUTRI LAB BRASIL <no-reply@nutrilab.com.br>";

  if (!apiKey) {
    console.log(
      `\n[EMAIL - modo dev, não enviado]\nPara: ${to}\nAssunto: ${subject}\n(configure RESEND_API_KEY para enviar de verdade)\n`,
    );
    return { ok: true, simulated: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      console.error("Falha ao enviar email:", res.status, await res.text());
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error("Erro ao enviar email:", err);
    return { ok: false };
  }
}

// Template do email de "pedido confirmado" (pagamento aprovado).
export function buildOrderConfirmedEmail(args: {
  storeName: string;
  customerName: string;
  reference: string;
  totalCents: number;
}): string {
  const { storeName, customerName, reference, totalCents } = args;
  const total = (totalCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  return `
  <div style="background:#0A0A0A;color:#FAFAFA;font-family:Arial,sans-serif;padding:32px;border-radius:12px;max-width:520px;margin:auto">
    <div style="font-size:26px;font-weight:900;font-style:italic">NUTRI<span style="color:#C2EE3E">LAB</span></div>
    <h1 style="color:#C2EE3E;font-size:22px;margin:20px 0 8px">Pagamento confirmado!</h1>
    <p style="color:#d4d4d4;line-height:1.6">
      Obrigado, ${customerName}. Recebemos o pagamento do pedido
      <strong style="color:#fff">${reference}</strong> e já estamos preparando o envio.
    </p>
    <p style="color:#fff;font-size:18px;margin:16px 0">Total: <strong style="color:#C2EE3E">${total}</strong></p>
    <p style="color:#737373;font-size:12px;border-top:1px solid #262626;padding-top:14px;margin-top:20px">${storeName} . Energia. Foco. Disciplina. Evolução.</p>
  </div>`;
}

// Template do email de "pedido enviado".
export function buildShippedEmail(args: {
  storeName: string;
  customerName: string;
  reference: string;
  trackingCode: string | null;
  shippingNote: string | null;
}): string {
  const { storeName, customerName, reference, trackingCode, shippingNote } = args;
  const trackUrl = trackingCode
    ? `https://www.linkcorreios.com.br/${encodeURIComponent(trackingCode)}`
    : null;

  return `
  <div style="background:#0A0A0A;color:#FAFAFA;font-family:Arial,sans-serif;padding:32px;border-radius:12px;max-width:560px;margin:auto">
    <div style="font-size:28px;font-weight:900;font-style:italic;letter-spacing:-1px">
      NUTRI<span style="color:#C2EE3E">LAB</span>
    </div>
    <h1 style="color:#C2EE3E;font-size:24px;margin:24px 0 8px">Seu pedido foi enviado!</h1>
    <p style="color:#d4d4d4;line-height:1.6">
      Olá, ${customerName}. Boas noticias: o pedido
      <strong style="color:#fff">${reference}</strong> saiu para entrega.
    </p>
    ${
      trackingCode
        ? `<div style="background:#1a1a1a;border:1px solid #262626;border-radius:8px;padding:16px;margin:20px 0">
             <p style="margin:0 0 6px;color:#a1a1a1;font-size:12px;text-transform:uppercase;letter-spacing:1px">Código de rastreio</p>
             <p style="margin:0;font-family:monospace;font-size:18px;color:#C2EE3E;font-weight:bold">${trackingCode}</p>
             ${trackUrl ? `<a href="${trackUrl}" style="display:inline-block;margin-top:14px;background:#C2EE3E;color:#0A0A0A;text-decoration:none;font-weight:bold;padding:10px 20px;border-radius:6px">Rastrear pedido</a>` : ""}
           </div>`
        : ""
    }
    ${shippingNote ? `<p style="color:#a1a1a1;font-size:14px">${shippingNote}</p>` : ""}
    <p style="color:#737373;font-size:12px;margin-top:28px;border-top:1px solid #262626;padding-top:16px">
      ${storeName} . Energia. Foco. Disciplina. Evolução.
    </p>
  </div>`;
}
