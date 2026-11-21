import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { MailPayload } from './mail.types';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  async send(payload: MailPayload): Promise<boolean> {
    const apiKey = this.config.get<string>('app.resendApiKey')?.trim() ?? '';
    const from =
      this.config.get<string>('app.mailFrom')?.trim() ||
      'ZAY Atelier <commandes@zaydress.com>';
    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    const toLabel = recipients.join(', ');

    if (!apiKey) {
      this.logger.warn(
        `E-mail non envoyé (RESEND_API_KEY absente) — to=${toLabel} subject=${payload.subject}`,
      );
      return false;
    }

    try {
      const body: Record<string, unknown> = {
        from,
        to: recipients,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      };
      if (payload.replyTo) {
        body.reply_to = payload.replyTo;
      }

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        this.logger.error(
          `Resend HTTP ${res.status} — to=${toLabel} subject=${payload.subject} ${detail.slice(0, 200)}`,
        );
        return false;
      }
      return true;
    } catch (err) {
      this.logger.error(
        `Échec envoi e-mail — to=${toLabel} subject=${payload.subject}: ${
          err instanceof Error ? err.message : 'erreur'
        }`,
      );
      return false;
    }
  }
}
