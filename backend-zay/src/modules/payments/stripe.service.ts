import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentMethod } from '@prisma/client';
import Stripe from 'stripe';

function isoCountry(raw: string | undefined): string {
  const value = (raw ?? 'FR').trim().toLowerCase();
  if (value === 'france' || value === 'fr' || value === '') return 'FR';
  if (value.length === 2) return value.toUpperCase();
  return 'FR';
}

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly client: Stripe | null;

  constructor(private readonly config: ConfigService) {
    const key = (this.config.get<string>('app.stripeSecretKey') ?? '').trim();
    this.client = key ? new Stripe(key) : null;
    if (key) {
      this.logger.log(
        `Stripe test mode prêt (${key.startsWith('sk_test_') ? 'sandbox' : 'live'})`,
      );
    }
  }

  isConfigured(): boolean {
    return this.client != null;
  }

  private stripe(): Stripe {
    if (!this.client) {
      throw new ServiceUnavailableException('Paiement Stripe non configuré');
    }
    return this.client;
  }

  async createCheckoutSession(params: {
    orderId: string;
    orderNumber: string;
    amountEur: number;
    customerEmail: string;
    paymentMethod: PaymentMethod;
    customerName: string;
    addressLine: string;
    city: string;
    postalCode: string;
    country?: string;
    phone?: string | null;
  }): Promise<{ id: string; url: string }> {
    const frontend =
      this.config.get<string>('app.frontendUrl') || 'http://localhost:9002';
    const amount = Math.round(params.amountEur * 100);
    if (amount < 50) {
      throw new BadRequestException(
        'Montant trop faible pour un paiement carte',
      );
    }

    const country = isoCountry(params.country);
    const useKlarna = params.paymentMethod === PaymentMethod.KLARNA;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      locale: 'fr',
      customer_email: params.customerEmail,
      client_reference_id: params.orderId,
      metadata: {
        orderId: params.orderId,
        orderNumber: params.orderNumber,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: amount,
            product_data: {
              name: `Commande ${params.orderNumber}`,
              description: 'ZAY Atelier',
            },
          },
        },
      ],
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: [country as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry],
      },
      phone_number_collection: { enabled: true },
      payment_intent_data: {
        shipping: {
          name: params.customerName,
          phone: params.phone || undefined,
          address: {
            line1: params.addressLine,
            city: params.city,
            postal_code: params.postalCode,
            country,
          },
        },
      },
      success_url: `${frontend}/commande/confirmation?number=${encodeURIComponent(params.orderNumber)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontend}/checkout?canceled=1`,
    };

    // Carte : on force la CB.
    // Klarna : on NE passe PAS payment_method_types — Stripe utilise
    // la config Dashboard (où Klarna est Activé). L’ancien paramètre
    // `['klarna']` est refusé en EUR sur ce compte.
    if (!useKlarna) {
      sessionParams.payment_method_types = ['card'];
    }

    try {
      const session =
        await this.stripe().checkout.sessions.create(sessionParams);

      if (!session.url) {
        throw new ServiceUnavailableException(
          'Stripe n’a pas renvoyé d’URL de paiement',
        );
      }
      return { id: session.id, url: session.url };
    } catch (err) {
      const detail =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Stripe checkout session failed';
      this.logger.error(detail);
      if (useKlarna) {
        throw new BadRequestException(
          'Klarna n’a pas pu s’ouvrir. Réessaie, ou paie par carte.',
        );
      }
      throw new ServiceUnavailableException(
        detail.startsWith('Invalid API Key')
          ? 'Clé Stripe invalide. Vérifie STRIPE_SECRET_KEY (sandbox sk_test_…).'
          : 'Impossible d’ouvrir le paiement Stripe',
      );
    }
  }

  async retrievePaidSession(sessionId: string): Promise<{
    paid: boolean;
    orderId: string | null;
  }> {
    const session = await this.stripe().checkout.sessions.retrieve(sessionId);
    const paid =
      session.payment_status === 'paid' || session.status === 'complete';
    const orderId =
      session.metadata?.orderId || session.client_reference_id || null;
    return { paid, orderId };
  }

  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    const secret = this.config.get<string>('app.stripeWebhookSecret') ?? '';
    if (!secret) {
      throw new BadRequestException('Webhook Stripe non configuré');
    }
    return this.stripe().webhooks.constructEvent(rawBody, signature, secret);
  }
}
