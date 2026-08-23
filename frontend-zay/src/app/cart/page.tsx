import { redirect } from 'next/navigation';

/** Ancienne route anglaise — le panier canonique est /panier. */
export default function CartLegacyRedirect() {
  redirect('/panier');
}
