import { apiFetch } from './client';
import type { ApiOrderStatus } from './orders';

export type AdminStats = {
  ordersToday: number;
  ordersTodayDeltaPct: number;
  revenueToday: number;
  revenueTodayDeltaPct: number;
  newUsersToday: number;
  newUsersTodayDeltaPct: number;
  lowStockCount: number;
  lowStockItems: {
    id: string;
    name: string;
    stock: number;
    image: string;
  }[];
  toPrepareCount: number;
  awaitingPaymentCount: number;
  unreadMessages: number;
  revenueSeries: { day: string; ca: number }[];
  recentOrders: {
    id: string;
    number: string;
    customerName: string;
    total: string | number;
    status: ApiOrderStatus;
    createdAt: string;
  }[];
};

export type AdminUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: string;
  createdAt: string;
  ordersCount: number;
  lastOrder: {
    id: string;
    number: string;
    total: string | number;
    status: ApiOrderStatus;
    createdAt: string;
  } | null;
};

export type AdminUserAddress = {
  id: string;
  name: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  isDefault: boolean;
};

export type AdminUserDetail = Omit<AdminUser, 'lastOrder'> & {
  addressesCount: number;
  addresses: AdminUserAddress[];
  orders: {
    id: string;
    number: string;
    total: string | number;
    status: ApiOrderStatus;
    itemsCount: number;
    createdAt: string;
  }[];
};

export async function fetchAdminStats(): Promise<AdminStats> {
  return apiFetch<AdminStats>('/admin/stats');
}

export async function fetchAdminUsers(search?: string): Promise<AdminUser[]> {
  const qs = search?.trim()
    ? `?search=${encodeURIComponent(search.trim())}`
    : '';
  return apiFetch<AdminUser[]>(`/admin/users${qs}`);
}

export async function fetchAdminUser(id: string): Promise<AdminUserDetail> {
  return apiFetch<AdminUserDetail>(`/admin/users/${id}`);
}
