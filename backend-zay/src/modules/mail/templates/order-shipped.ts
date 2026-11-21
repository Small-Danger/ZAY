import { escapeHtml } from '../mail.escape';

export type OrderShippedData = {
  orderNumber: string;
  customerFirstName: string;
  carrier?: string | null;
  trackingCode?: string | null;
  trackingUrl?: string | null;
};

export function orderShippedEmail(data: OrderShippedData) {
  const name = escapeHtml(data.customerFirstName || 'Cliente');
  const number = escapeHtml(data.orderNumber);
  const carrier = data.carrier?.trim()
    ? escapeHtml(data.carrier.trim())
    : null;
  const code = data.trackingCode?.trim()
    ? escapeHtml(data.trackingCode.trim())
    : null;
  const url = data.trackingUrl?.trim() || null;

  const detailsHtml = [
    carrier ? `<p>Transporteur : <strong>${carrier}</strong></p>` : '',
    code ? `<p>Numéro de suivi : <strong>${code}</strong></p>` : '',
    url
      ? `<p><a href="${escapeHtml(url)}" style="color:#222;">Suivre mon colis</a></p>`
      : '',
  ]
    .filter(Boolean)
    .join('');

  const detailsText = [
    carrier ? `Transporteur : ${data.carrier!.trim()}` : '',
    code ? `Numéro de suivi : ${data.trackingCode!.trim()}` : '',
    url ? `Suivre mon colis : ${url}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const subject = `Votre commande ${data.orderNumber} est expédiée — ZAY Atelier`;
  const html = `<!DOCTYPE html><html lang="fr"><body style="font-family:Georgia,serif;color:#222;line-height:1.5;max-width:560px;margin:0 auto;padding:24px;">
<p style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#888;">ZAY Atelier</p>
<h1 style="font-size:24px;font-weight:normal;font-style:italic;">Votre commande est expédiée</h1>
<p>Bonjour ${name},</p>
<p>Bonne nouvelle : votre commande <strong>${number}</strong> vient de partir.</p>
${detailsHtml}
<p style="color:#888;font-size:12px;margin-top:32px;">ZAY Atelier</p>
</body></html>`;

  const text = `ZAY Atelier

Votre commande est expédiée

Bonjour ${data.customerFirstName || 'Cliente'},

Bonne nouvelle : votre commande ${data.orderNumber} vient de partir.
${detailsText ? `\n${detailsText}\n` : ''}
ZAY Atelier`;

  return { subject, html, text };
}
