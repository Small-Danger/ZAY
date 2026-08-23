import { LegalPageShell } from '@/components/legal/LegalPageShell';

export default function ConfidentialitePage() {
  return (
    <LegalPageShell
      eyebrow="Légal"
      title="Politique de confidentialité"
      updatedAt="4 août 2026"
      intro="ZAY Atelier accorde une importance particulière à la protection de vos données personnelles. La présente politique décrit les informations collectées, leurs finalités et vos droits."
      related={[
        { label: 'CGV', href: '/cgv' },
        { label: 'Mentions légales', href: '/mentions-legales' },
        { label: 'Contact', href: '/contact' },
      ]}
      sections={[
        {
          title: '1. Responsable du traitement',
          paragraphs: [
            'Le responsable du traitement des données est ZAY Atelier. Pour toute question relative à vos données : conciergerie@zay-atelier.com.',
          ],
        },
        {
          title: '2. Données collectées',
          paragraphs: [
            'Selon votre utilisation du site, nous pouvons collecter :',
          ],
          bullets: [
            'Identité et coordonnées : nom, prénom, e-mail, téléphone, adresses de livraison et de facturation',
            'Données de compte : identifiants, historique de commandes, favoris',
            'Données de paiement : traitées par notre prestataire de paiement ; nous ne stockons pas le numéro de carte complet',
            'Données de navigation : pages consultées, type d’appareil, adresse IP approximative, cookies techniques',
            'Messages envoyés via le formulaire de contact',
          ],
        },
        {
          title: '3. Finalités',
          paragraphs: [
            'Vos données sont utilisées pour :',
          ],
          bullets: [
            'Traiter et livrer vos commandes, et assurer le service après-vente',
            'Gérer votre compte client et votre liste de favoris',
            'Répondre à vos demandes via le formulaire de contact',
            'Améliorer le fonctionnement et la sécurité du site',
            'Vous adresser des informations commerciales uniquement si vous y avez consenti (désinscription possible à tout moment)',
            'Respecter nos obligations légales et comptables',
          ],
        },
        {
          title: '4. Bases légales',
          paragraphs: [
            'Selon les cas : exécution du contrat (commande, compte), intérêt légitime (sécurité, amélioration du service), obligation légale, ou consentement (newsletters, cookies non essentiels).',
          ],
        },
        {
          title: '5. Destinataires',
          paragraphs: [
            'Les données peuvent être transmises uniquement aux prestataires nécessaires : hébergeur, transporteurs, prestataire de paiement, outils d’e-mail transactionnel, et autorités lorsque la loi l’exige. Aucune vente de données personnelles à des tiers à des fins commerciales.',
          ],
        },
        {
          title: '6. Durée de conservation',
          paragraphs: [
            'Les données de compte et de commande sont conservées pendant la durée de la relation commerciale, puis archivées le temps requis par les obligations légales (notamment comptables). Les messages de contact sont conservés le temps nécessaire au traitement de la demande. Les cookies ont des durées limitées selon leur type.',
          ],
        },
        {
          title: '7. Cookies',
          paragraphs: [
            'Le site utilise des cookies techniques indispensables au fonctionnement (session, panier, préférences). Des cookies de mesure d’audience ou marketing ne sont déposés qu’avec votre consentement lorsque applicable.',
            'Vous pouvez configurer votre navigateur pour refuser tout ou partie des cookies ; certaines fonctionnalités du site peuvent alors être limitées.',
          ],
        },
        {
          title: '8. Vos droits',
          paragraphs: [
            'Conformément au RGPD et à la loi Informatique et Libertés, vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation, d’opposition, et de portabilité lorsque applicable. Vous pouvez également définir des directives relatives au sort de vos données après votre décès.',
            'Pour exercer vos droits : conciergerie@zay-atelier.com. Vous pouvez introduire une réclamation auprès de la CNIL (www.cnil.fr).',
          ],
        },
        {
          title: '9. Sécurité',
          paragraphs: [
            'Nous mettons en œuvre des mesures techniques et organisationnelles raisonnables pour protéger vos données contre l’accès non autorisé, la perte ou l’altération. Aucun système n’étant totalement infaillible, nous vous invitons à utiliser un mot de passe robuste et unique.',
          ],
        },
        {
          title: '10. Modifications',
          paragraphs: [
            'La présente politique peut être mise à jour. La date de dernière mise à jour figure en tête de page. En cas de changement substantiel, une information pourra être publiée sur le site.',
          ],
        },
      ]}
    />
  );
}
