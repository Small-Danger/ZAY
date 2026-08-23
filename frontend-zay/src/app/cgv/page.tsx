import { LegalPageShell } from '@/components/legal/LegalPageShell';

export default function CgvPage() {
  return (
    <LegalPageShell
      eyebrow="Légal"
      title="Conditions Générales de Vente"
      updatedAt="4 août 2026"
      intro="Les présentes Conditions Générales de Vente (CGV) régissent les ventes de produits proposés par ZAY Atelier sur le site zay-atelier.com. Toute commande implique l’acceptation sans réserve des présentes CGV."
      related={[
        { label: 'Confidentialité', href: '/confidentialite' },
        { label: 'Mentions légales', href: '/mentions-legales' },
        { label: 'FAQ', href: '/faq' },
      ]}
      sections={[
        {
          title: '1. Objet',
          paragraphs: [
            'Les présentes CGV définissent les droits et obligations des parties dans le cadre de la vente en ligne de prêt-à-porter féminin et accessoires proposés par ZAY Atelier (ci-après « le Vendeur ») au Client (ci-après « le Client »).',
          ],
        },
        {
          title: '2. Produits',
          paragraphs: [
            'Les produits sont présentés avec une description précise permettant au Client d’en connaître les caractéristiques essentielles. Les photographies sont non contractuelles ; de légères différences de teinte peuvent apparaître selon l’écran utilisé.',
            'Les offres sont valables dans la limite des stocks disponibles. En cas d’indisponibilité après commande, le Client est informé dans les meilleurs délais et remboursé si le paiement a déjà été encaissé.',
          ],
        },
        {
          title: '3. Prix',
          paragraphs: [
            'Les prix sont indiqués en euros, toutes taxes comprises (TTC). Le Vendeur se réserve le droit de modifier ses prix à tout moment ; les produits sont facturés sur la base des tarifs en vigueur au moment de la validation de la commande.',
            'Les frais de livraison sont précisés avant le paiement. La livraison est offerte en France métropolitaine pour toute commande supérieure à 120 € TTC, sauf mention contraire sur le site.',
          ],
        },
        {
          title: '4. Commande',
          paragraphs: [
            'Le Client sélectionne les produits, la taille et, le cas échéant, la couleur, puis valide son panier. La commande n’est définitive qu’après acceptation des présentes CGV et confirmation du paiement.',
            'Une confirmation est adressée à l’adresse e-mail indiquée. Toute modification après validation doit être demandée au service client dans les 2 heures suivant la commande, sans garantie d’acceptation si la préparation a déjà commencé.',
          ],
        },
        {
          title: '5. Paiement',
          paragraphs: [
            'Le paiement s’effectue en ligne par les moyens proposés au moment du checkout (cartes bancaires, et le cas échéant Apple Pay, Klarna, Alma). La commande est traitée après validation du paiement.',
            'Le Vendeur n’a jamais accès aux données bancaires complètes du Client lorsque le paiement est traité par un prestataire sécurisé.',
          ],
        },
        {
          title: '6. Livraison',
          paragraphs: [
            'Les délais indicatifs sont de 48 h à 72 h ouvrés en France métropolitaine, et de 5 à 8 jours ouvrés à l’international, sous réserve des transporteurs et des stocks.',
            'Le Client est responsable de l’exactitude de l’adresse de livraison. En cas de colis retourné pour adresse erronée ou non réclamation, les frais de réexpédition peuvent être à la charge du Client.',
          ],
        },
        {
          title: '7. Droit de rétractation & retours',
          paragraphs: [
            'Conformément au Code de la consommation, le Client dispose d’un délai de 14 jours à compter de la réception pour exercer son droit de rétractation, sans avoir à justifier de motifs.',
            'Les articles doivent être retournés dans leur état d’origine, non portés, non lavés, avec l’étiquette ZAY intacte et, dans la mesure du possible, dans leur emballage d’origine. Les articles personnalisés ou hygiène (sous-vêtements, certains accessoires) peuvent être exclus du droit de rétractation lorsque la loi le permet.',
            'Les retours sont offerts pour les commandes expédiées en France métropolitaine. Hors France métropolitaine, les frais de retour peuvent rester à la charge du Client, sauf disposition contraire.',
          ],
        },
        {
          title: '8. Remboursements',
          paragraphs: [
            'Après réception et contrôle du retour conforme, le remboursement est effectué sur le moyen de paiement utilisé pour la commande, dans un délai raisonnable et au plus tard dans les délais légaux applicables.',
          ],
        },
        {
          title: '9. Garantie légale',
          paragraphs: [
            'Les produits bénéficient de la garantie légale de conformité et de la garantie des vices cachés, dans les conditions prévues par le Code de la consommation et le Code civil.',
          ],
        },
        {
          title: '10. Responsabilité',
          paragraphs: [
            'Le Vendeur ne saurait être tenu responsable des dommages résultant d’une mauvaise utilisation des produits, d’une force majeure, ou d’une interruption temporaire du site pour maintenance ou cas indépendant de sa volonté.',
          ],
        },
        {
          title: '11. Données personnelles',
          paragraphs: [
            'Les données collectées pour le traitement des commandes sont traitées conformément à la Politique de confidentialité accessible sur le site.',
          ],
        },
        {
          title: '12. Droit applicable',
          paragraphs: [
            'Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable sera recherchée en priorité. À défaut, les tribunaux français compétents seront saisis, sous réserve des dispositions protectrices applicables au consommateur.',
            'Pour toute question : conciergerie@zay-atelier.com ou via la page Contact.',
          ],
        },
      ]}
    />
  );
}
