export type ConsentValue = 'accepted' | 'refused';

export const CONSENT_KEY = 'zay_consent';

export type ConsentRecord = {
  value: ConsentValue;
  at: string;
};

export function readConsent(): ConsentRecord | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentRecord;
    if (parsed?.value === 'accepted' || parsed?.value === 'refused') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function writeConsent(value: ConsentValue): void {
  try {
    const record: ConsentRecord = {
      value,
      at: new Date().toISOString(),
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
    window.dispatchEvent(new CustomEvent('zay-consent', { detail: record }));
  } catch {
    /* ignore quota / private mode */
  }
}

export function openConsentBanner(): void {
  window.dispatchEvent(new CustomEvent('zay-consent-open'));
}
