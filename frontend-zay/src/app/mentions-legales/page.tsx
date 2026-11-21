import { LegalPageShell } from '@/components/legal/LegalPageShell';
import {
  displayOrPending,
  getPublicSettings,
} from '@/lib/api/store-settings-public';

export const revalidate = 60;

export default async function MentionsLegalesPage() {
  const s = await getPublicSettings();
  const email = s.contactEmail?.trim() || null;
  const hostLine = [
    displayOrPending(s.hostName),
    s.hostAddress?.trim() || null,
    s.hostContact?.trim() || null,
  ]
    .filter(Boolean)
    .join(' — ');

  return (
    <LegalPageShell
      eyebrow="Légal"
      title="Mentions légales"
      updatedAt="21 novembre 2026"
      intro="Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique, les présentes mentions légales précisent l’identité des différents intervenants dans le cadre de la réalisation et du suivi du site ZAY Atelier."
      related={[
        { label: 'CGV', href: '/cgv' },
        { label: 'Confidentialité', href: '/confidentialite' },
        { label: 'Contact', href: '/contact' },
      ]}
      sections={[
        {
          title: '1. Éditeur du site',
          paragraphs: [
            'Le site est édité par ZAY Atelier, marque de prêt-à-porter féminin.',
          ],
          bullets: [
            `Raison sociale : ${displayOrPending(s.legalName)}`,
            `Forme juridique : ${displayOrPending(s.legalForm)}`,
            `Capital social : ${displayOrPending(s.shareCapital)}`,
            `Siège social : ${displayOrPending(s.legalAddress)}`,
            `SIRET : ${displayOrPending(s.siret)}`,
            `RCS : ${displayOrPending(s.rcsCity)}`,
            `N° TVA intracommunautaire : ${displayOrPending(s.vatNumber)}`,
            `E-mail : ${email ?? 'Information en cours de mise à jour'}`,
            `Directeur de la publication : ${displayOrPending(s.publicationDirector)}`,
          ],
        },
        {
          title: '2. Hébergement',
          paragraphs: [
            `Le site est hébergé par : ${hostLine}.`,
          ],
        },
        {
          title: '3. Propriété intellectuelle',
          paragraphs: [
            'L’ensemble des contenus du site (textes, images, logos, graphismes, photographies, vidéos, structure) est protégé par le droit de la propriété intellectuelle. Toute reproduction, représentation, modification ou exploitation, totale ou partielle, sans autorisation préalable écrite de ZAY Atelier est interdite.',
            'Les marques et logos présents sur le site sont la propriété de leurs titulaires respectifs.',
          ],
        },
        {
          title: '4. Données personnelles',
          paragraphs: [
            'Pour plus d’informations sur le traitement de vos données personnelles, consultez notre Politique de confidentialité.',
          ],
        },
        {
          title: '5. Liens hypertextes',
          paragraphs: [
            'Le site peut contenir des liens vers des sites tiers. ZAY Atelier n’exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu ou leurs pratiques.',
          ],
        },
        {
          title: '6. Limitation de responsabilité',
          paragraphs: [
            'ZAY Atelier s’efforce d’assurer l’exactitude des informations diffusées sur le site et de maintenir un accès stable. Toutefois, le site peut être temporairement indisponible pour maintenance ou raisons techniques. ZAY Atelier ne saurait être tenu responsable des dommages directs ou indirects liés à l’utilisation du site.',
          ],
        },
        {
          title: '7. Droit applicable',
          paragraphs: [
            `Les présentes mentions légales sont régies par le droit français. Pour toute réclamation : ${
              email ?? 'via la page Contact'
            }${email ? ' ou via la page Contact' : ''}.`,
          ],
        },
      ]}
    />
  );
}
