import { escapeHtml } from '../mail.escape';

export function passwordResetEmail(data: {
  firstName?: string | null;
  resetUrl: string;
}) {
  const name = escapeHtml(data.firstName?.trim() || 'Cliente');
  const url = escapeHtml(data.resetUrl);
  const subject = 'Réinitialisation de votre mot de passe — ZAY Atelier';
  const html = `<!DOCTYPE html><html lang="fr"><body style="font-family:Georgia,serif;color:#222;line-height:1.5;max-width:560px;margin:0 auto;padding:24px;">
<p style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#888;">ZAY Atelier</p>
<h1 style="font-size:22px;font-weight:normal;font-style:italic;">Mot de passe oublié</h1>
<p>Bonjour ${name},</p>
<p>Vous avez demandé à réinitialiser votre mot de passe. Ce lien est valable 30 minutes :</p>
<p><a href="${url}" style="color:#222;">Réinitialiser mon mot de passe</a></p>
<p style="font-size:13px;color:#666;">Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.</p>
</body></html>`;

  const text = `ZAY Atelier

Mot de passe oublié

Bonjour ${data.firstName?.trim() || 'Cliente'},

Vous avez demandé à réinitialiser votre mot de passe. Ce lien est valable 30 minutes :
${data.resetUrl}

Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.`;

  return { subject, html, text };
}
