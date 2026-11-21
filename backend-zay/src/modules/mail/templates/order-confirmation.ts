import { escapeHtml, formatEuro } from '../mail.escape';

export type MoneyLike = number | string | { toString(): string };

export type OrderEmailItem = {
  name: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: MoneyLike;
  lineTotal: MoneyLike;
};

export type OrderConfirmationData = {
  orderNumber: string;
  customerFirstName: string;
  items: OrderEmailItem[];
  subtotal: MoneyLike;
  shippingCost: MoneyLike;
  discountAmount: MoneyLike;
  total: MoneyLike;
  addressLine: string;
  city: string;
  postalCode: string;
  country: string;
  trackingUrl: string;
};

export function orderConfirmationEmail(data: OrderConfirmationData) {
  const name = escapeHtml(data.customerFirstName || 'Cliente');
  const number = escapeHtml(data.orderNumber);
  const totalFmt = formatEuro(data.total);
  const address = [
    escapeHtml(data.addressLine),
    `${escapeHtml(data.postalCode)} ${escapeHtml(data.city)}`,
    escapeHtml(data.country),
  ].join('<br/>');
  const addressText = [
    data.addressLine,
    `${data.postalCode} ${data.city}`,
    data.country,
  ].join('\n');

  const itemsHtml = data.items
    .map((item) => {
      const line = `${escapeHtml(item.name)} — ${escapeHtml(item.size)} / ${escapeHtml(item.color)} × ${item.quantity}`;
      return `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;">${line}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;font-size:14px;">${formatEuro(item.lineTotal)}</td></tr>`;
    })
    .join('');

  const itemsText = data.items
    .map(
      (item) =>
        `- ${item.name} (${item.size}/${item.color}) × ${item.quantity} : ${formatEuro(item.lineTotal)}`,
    )
    .join('\n');

  const discountRow =
    Number(data.discountAmount) > 0
      ? `<tr><td style="padding:4px 0;">Remise</td><td style="text-align:right;">−${formatEuro(data.discountAmount)}</td></tr>`
      : '';
  const discountText =
    Number(data.discountAmount) > 0
      ? `Remise : −${formatEuro(data.discountAmount)}\n`
      : '';

  const subject = `Confirmation de commande ${data.orderNumber} — ZAY Atelier`;
  const html = `<!DOCTYPE html><html lang="fr"><body style="font-family:Georgia,serif;color:#222;line-height:1.5;max-width:560px;margin:0 auto;padding:24px;">
<p style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#888;">ZAY Atelier</p>
<h1 style="font-size:24px;font-weight:normal;font-style:italic;">Merci pour votre commande</h1>
<p>Bonjour ${name},</p>
<p>Nous avons bien reçu votre paiement. Votre commande <strong>${number}</strong> est confirmée.</p>
<table style="width:100%;border-collapse:collapse;margin:24px 0;">${itemsHtml}</table>
<table style="width:100%;font-size:14px;margin-bottom:24px;">
<tr><td style="padding:4px 0;">Sous-total</td><td style="text-align:right;">${formatEuro(data.subtotal)}</td></tr>
<tr><td style="padding:4px 0;">Livraison</td><td style="text-align:right;">${formatEuro(data.shippingCost)}</td></tr>
${discountRow}
<tr><td style="padding:8px 0;font-weight:bold;">Total</td><td style="text-align:right;font-weight:bold;">${totalFmt}</td></tr>
</table>
<p style="font-size:14px;"><strong>Adresse de livraison</strong><br/>${address}</p>
<p><a href="${escapeHtml(data.trackingUrl)}" style="color:#222;">Suivre ma commande</a></p>
<p style="color:#888;font-size:12px;margin-top:32px;">ZAY Atelier — Merci de votre confiance.</p>
</body></html>`;

  const text = `ZAY Atelier

Merci pour votre commande

Bonjour ${data.customerFirstName || 'Cliente'},

Nous avons bien reçu votre paiement. Votre commande ${data.orderNumber} est confirmée.

Articles :
${itemsText}

Sous-total : ${formatEuro(data.subtotal)}
Livraison : ${formatEuro(data.shippingCost)}
${discountText}Total : ${totalFmt}

Adresse de livraison :
${addressText}

Suivre ma commande : ${data.trackingUrl}

ZAY Atelier — Merci de votre confiance.`;

  return { subject, html, text };
}

export function adminNewOrderEmail(data: OrderConfirmationData) {
  const totalFmt = formatEuro(data.total);
  const subject = `Nouvelle commande ${data.orderNumber} — ${totalFmt}`;
  const { html, text } = orderConfirmationEmail(data);
  const adminHtml = html
    .replace('Merci pour votre commande', 'Nouvelle commande')
    .replace(
      /Bonjour [^,]+,/,
      `Nouvelle commande <strong>${escapeHtml(data.orderNumber)}</strong> (${totalFmt}).`,
    );
  const adminText = text
    .replace('Merci pour votre commande', 'Nouvelle commande')
    .replace(
      /Bonjour [^\n]+\n\nNous avons bien reçu[^\n]+\n/,
      `Nouvelle commande ${data.orderNumber} — ${totalFmt}\n\n`,
    );
  return { subject, html: adminHtml, text: adminText };
}
