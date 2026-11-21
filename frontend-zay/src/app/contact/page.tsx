import { getPublicSettings } from '@/lib/api/store-settings-public';
import { ContactClient } from './contact-client';

export const revalidate = 60;

export default async function ContactPage() {
  const settings = await getPublicSettings();
  return <ContactClient settings={settings} />;
}
