export type MailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};
