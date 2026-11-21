import { escapeHtml } from '../mail.escape';

export type ContactNotifyData = {
  firstName: string;
  lastName: string;
  email: string;
  subjectLabel: string;
  message: string;
};

export function contactNotifyEmail(data: ContactNotifyData) {
  const firstName = escapeHtml(data.firstName);
  const lastName = escapeHtml(data.lastName);
  const email = escapeHtml(data.email);
  const subjectLabel = escapeHtml(data.subjectLabel);
  const message = escapeHtml(data.message).replace(/\n/g, '<br/>');

  const subject = `Nouveau message contact — ${data.subjectLabel}`;
  const html = `<!DOCTYPE html><html lang="fr"><body style="font-family:Georgia,serif;color:#222;line-height:1.5;max-width:560px;margin:0 auto;padding:24px;">
<p style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#888;">ZAY Atelier</p>
<h1 style="font-size:22px;font-weight:normal;font-style:italic;">Nouveau message</h1>
<p><strong>${firstName} ${lastName}</strong> &lt;${email}&gt;</p>
<p>Sujet : ${subjectLabel}</p>
<blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #ccc;background:#fafafa;">${message}</blockquote>
</body></html>`;

  const text = `ZAY Atelier — Nouveau message

De : ${data.firstName} ${data.lastName} <${data.email}>
Sujet : ${data.subjectLabel}

${data.message}`;

  return { subject, html, text };
}
