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

export type PaidSessionInfo = {
  paid: boolean;
  orderId: string | null;
  amountTotal: number | null;
  currency: string | null;
  paymentIntentId: string | null;
  paymentMethodType: string | null;
};

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly client: Stripe | null;

  constructor(private readonly config: ConfigService) {
    const key = (this.config.get<string>('app.stripeSecretKey') ?? '').trim();
    this.client = key ? new Stripe(key) : null;
    if (key) {
      const mode = key.startsWith('sk_live_') ? 'LIVE' : 'TEST';
      this.logger.log(`Stripe mode ${mode}`);
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
    const klarnaPmc = (
      this.config.get<string>('app.stripeKlarnaPaymentMethodConfiguration') ??
      ''
    ).trim();

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      locale: 'fr',
      customer_email: params.customerEmail,
      client_reference_id: params.orderId,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
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
    // Klarna : payment_method_types forcé, sauf si une PMC Stripe est configurée.
    if (!useKlarna) {
      sessionParams.payment_method_types = ['card'];
    } else if (klarnaPmc) {
      sessionParams.payment_method_configuration = klarnaPmc;
    } else {
      sessionParams.payment_method_types = ['klarna'];
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
      if (
        err instanceof BadRequestException ||
        err instanceof ServiceUnavailableException
      ) {
        throw err;
      }
      const detail =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Stripe checkout session failed';
      this.logger.error(detail);
      if (useKlarna && detail.toLowerCase().includes('klarna')) {
        throw new ServiceUnavailableException(
          'Le paiement Klarna est momentanément indisponible. Payez par carte.',
        );
      }
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

  async expireSession(sessionId: string): Promise<void> {
    try {
      await this.stripe().checkout.sessions.expire(sessionId);
    } catch (err) {
      const detail =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'expire failed';
      this.logger.warn(
        `Impossible d’expirer la session Stripe ${sessionId}: ${detail}`,
      );
    }
  }

  async retrievePaidSession(sessionId: string): Promise<PaidSessionInfo> {
    const session = await this.stripe().checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent.payment_method'],
    });
    const paid =
      session.payment_status === 'paid' ||
      session.payment_status === 'no_payment_required';
    const orderId =
      session.metadata?.orderId || session.client_reference_id || null;

    let paymentIntentId: string | null = null;
    let paymentMethodType: string | null = null;
    const pi = session.payment_intent;
    if (typeof pi === 'string') {
      paymentIntentId = pi;
    } else if (pi && typeof pi === 'object') {
      paymentIntentId = pi.id;
      const pm = pi.payment_method;
      if (typeof pm === 'object' && pm && 'type' in pm && pm.type) {
        paymentMethodType = String(pm.type);
      }
    }

    return {
      paid,
      orderId,
      amountTotal: session.amount_total ?? null,
      currency: session.currency ?? null,
      paymentIntentId,
      paymentMethodType,
    };
  }

  async refundPayment(
    paymentIntentId: string,
    orderId: string,
  ): Promise<void> {
    try {
      await this.stripe().refunds.create(
        { payment_intent: paymentIntentId },
        { idempotencyKey: `refund-order-${orderId}` },
      );
    } catch (err) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? String((err as { code: string }).code)
          : '';
      if (code === 'charge_already_refunded') {
        this.logger.warn(
          `Remboursement déjà effectué pour order=${orderId} pi=${paymentIntentId}`,
        );
        return;
      }
      throw err;
    }
  }

  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    const secret = this.config.get<string>('app.stripeWebhookSecret') ?? '';
    if (!secret) {
      throw new BadRequestException('Webhook Stripe non configuré');
    }
    return this.stripe().webhooks.constructEvent(rawBody, signature, secret);
  }
}
