import { apiFetch, apiFetchBlob } from './client';

export type ApiOrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PREPARING'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type ApiPaymentMethod = 'CARD' | 'KLARNA';

export type ApiOrderItem = {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  image: string;
  size: string;
  color: string;
  unitPrice: string | number;
  quantity: number;
  lineTotal: string | number;
};

export type ApiOrder = {
  id: string;
  number: string;
  userId: string;
  status: ApiOrderStatus;
  paymentMethod: ApiPaymentMethod | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  addressLine: string;
  city: string;
  postalCode: string;
  country: string;
  subtotal: string | number;
  shippingCost: string | number;
  total: string | number;
  carrier: string | null;
  trackingCode: string | null;
  trackingUrl: string | null;
  itemsCount: number;
  thumbnailUrl: string | null;
  customerName: string;
  createdAt: string;
  updatedAt?: string;
  items?: ApiOrderItem[];
  checkoutUrl?: string | null;
};

export type CreateOrderPayload = {
  items: {
    productId: string;
    size: string;
    color: string;
    quantity: number;
  }[];
  shipping: {
    firstName: string;
    lastName: string;
    phone?: string;
    addressLine: string;
    city: string;
    postalCode: string;
    country?: string;
  };
  paymentMethod: ApiPaymentMethod;
  promoCode?: string;
};

export type OrderListParams = {
  status?: ApiOrderStatus;
  search?: string;
  from?: string;
  to?: string;
};

export async function createOrder(
  payload: CreateOrderPayload,
): Promise<ApiOrder> {
  return apiFetch<ApiOrder>('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function confirmStripePayment(sessionId: string): Promise<ApiOrder> {
  return apiFetch<ApiOrder>('/orders/confirm-payment', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  });
}

export async function fetchMyOrders(): Promise<ApiOrder[]> {
  return apiFetch<ApiOrder[]>('/orders/me');
}

function ordersQuery(params: OrderListParams = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  return query.toString();
}

export async function fetchOrders(
  params: OrderListParams = {},
): Promise<ApiOrder[]> {
  const qs = ordersQuery(params);
  return apiFetch<ApiOrder[]>(`/orders${qs ? `?${qs}` : ''}`);
}

export async function exportOrdersCsv(
  params: OrderListParams = {},
): Promise<void> {
  const qs = ordersQuery(params);
  const blob = await apiFetchBlob(`/orders/export${qs ? `?${qs}` : ''}`);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `commandes-zay-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function fetchOrder(idOrNumber: string): Promise<ApiOrder> {
  return apiFetch<ApiOrder>(`/orders/${encodeURIComponent(idOrNumber)}`);
}

export async function updateOrderStatus(
  id: string,
  data: {
    status: ApiOrderStatus;
    carrier?: string;
    trackingCode?: string;
    trackingUrl?: string;
  },
): Promise<ApiOrder> {
  return apiFetch<ApiOrder>(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export const ORDER_STATUS_LABEL: Record<ApiOrderStatus, string> = {
  PENDING: 'En attente',
  PAID: 'Payée',
  PREPARING: 'En préparation',
  SHIPPED: 'Expédiée',
  IN_TRANSIT: 'En transit',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
  REFUNDED: 'Remboursée',
};

export function formatOrderDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function formatOrderDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function formatMoney(value: string | number): string {
  const n = typeof value === 'number' ? value : Number(value);
  return `${(Number.isFinite(n) ? n : 0).toFixed(2)}€`;
}
