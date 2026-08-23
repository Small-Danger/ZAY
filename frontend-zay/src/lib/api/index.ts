export { API_BASE_URL, API_ORIGIN, resolveMediaUrl } from './config';
export { apiFetch, apiFetchForm } from './client';
export { login, register, fetchMe, updateProfile, changePassword } from './auth';
export type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
} from './auth';
export {
  fetchProduct,
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from './products';
export type {
  ProductListParams,
  ProductVariantPayload,
  CreateProductPayload,
  UpdateProductPayload,
} from './products';
export {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
} from './categories';
export type { ApiCategory, ApiSubcategory } from './categories';
export { mapApiProductToUi } from './mappers';
export type {
  ApiProduct,
  ApiProductVariant,
  UiProduct,
} from './types';
export {
  createOrder,
  fetchMyOrders,
  fetchOrders,
  fetchOrder,
  updateOrderStatus,
  ORDER_STATUS_LABEL,
  formatMoney,
  formatOrderDate,
  formatOrderDateTime,
} from './orders';
export type {
  ApiOrder,
  ApiOrderStatus,
  CreateOrderPayload,
  OrderListParams,
} from './orders';
export {
  fetchPromos,
  createPromo,
  updatePromo,
  deletePromo,
  validatePromo,
} from './promos';
export type { ApiPromo, PromoType, CreatePromoPayload } from './promos';
export {
  sendContactMessage,
  fetchContactMessages,
  updateContactStatus,
  CONTACT_SUBJECT_LABEL,
} from './contact';
export type {
  ContactSubject,
  ContactStatus,
  CreateContactPayload,
  ApiContactMessage,
} from './contact';
export { fetchWishlist, toggleWishlist, removeFromWishlist } from './wishlist';
export { fetchCart, mergeCart, upsertCartItem, clearRemoteCart } from './cart';
export type { ApiCartLine, CartLinePayload } from './cart';
export {
  fetchAddresses,
  createAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
} from './addresses';
export type { ApiAddress, AddressPayload } from './addresses';
export {
  fetchAdminStats,
  fetchAdminUsers,
  fetchAdminUser,
} from './admin';
export type { AdminStats, AdminUser, AdminUserDetail } from './admin';
