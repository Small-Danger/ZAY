import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

describe('MailService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('sans RESEND_API_KEY → aucun fetch, pas d’exception', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const service = new MailService({
      get: (key: string) =>
        key === 'app.resendApiKey' ? '' : key === 'app.mailFrom' ? 'ZAY <a@b.c>' : '',
    } as unknown as ConfigService);

    await expect(
      service.send({
        to: 'cliente@example.com',
        subject: 'Test',
        html: '<p>secret</p>',
        text: 'secret',
      }),
    ).resolves.toBe(false);

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
