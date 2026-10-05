export type UserRole = 'customer' | 'seller' | 'admin';

export type UserStatus = 'active' | 'pending' | 'approved' | 'rejected' | 'suspended' | 'blocked';

export interface UserProfile {
  uid: string;
  name: string;
  phone: string;
  securityPin?: string; // 4-digit private PIN for phone login
  email?: string;
  role: UserRole;
  photoURL?: string;
  status: UserStatus;
  createdAt: string;
  restaurantId?: string; // For sellers
}

export type RestaurantStatus = 'open' | 'closed' | 'pending' | 'disabled';

export interface Restaurant {
  restaurantId: string;
  sellerId: string;
  name: string;
  logo: string;
  coverImage: string;
  description: string;
  address: string;
  cuisine: string[];
  rating: number;
  reviewsCount: number;
  status: RestaurantStatus;
  deliveryTime: string; // e.g. "25-35 min"
  minOrder: number; // e.g. 150
  openingHours: string; // e.g. "10:00 AM - 11:00 PM"
  phone: string;
  createdAt: string;
  isPopular?: boolean;
  isTopRated?: boolean;
}

export type FoodType = 'veg' | 'non-veg';
export type FoodPublishStatus = 'draft' | 'published' | 'archived';
export type FoodAvailability = 'active' | 'inactive' | 'out_of_stock';

export interface FoodItem {
  id?: string; // Primary ID
  foodId: string; // Compatibility alias
  name: string;
  image: string;
  price: number;
  discountPrice?: number;
  description: string;
  category: string;
  cuisine?: string;
  foodType: FoodType;
  preparationTime?: string;
  available?: boolean;
  availability?: FoodAvailability;
  bestseller?: boolean;
  isBestseller?: boolean;
  featured?: boolean;
  restaurantId: string;
  restaurantName?: string;
  sellerId?: string;
  status?: FoodPublishStatus;
  tags?: string[];
  createdBy?: string;
  rating: number;
  ratingCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CartItem {
  food: FoodItem;
  quantity: number;
  restaurantId: string;
  restaurantName: string;
}

export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'Placed'
  | 'Confirmed'
  | 'Preparing'
  | 'Ready'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export type PaymentMethod = 'cod' | 'razorpay' | 'upi' | 'card' | 'netbanking';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface DeliveryAddress {
  addressId?: string;
  userId?: string;
  name: string;
  phone: string;
  tag?: 'Home' | 'Work' | 'Other' | string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface OrderItem {
  foodId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  foodType: FoodType;
}

export type RiderStatus =
  | 'assigned'
  | 'at_restaurant'
  | 'picked_up'
  | 'on_the_way'
  | 'arriving'
  | 'delivered';

export interface Order {
  orderId: string;
  id?: string; // Optional compatibility alias for document ID
  customerId: string;
  customerName: string;
  customerPhone: string;
  restaurantId: string;
  restaurantName: string;
  sellerId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  orderStatus: OrderStatus;
  deliveryAddress: DeliveryAddress;
  address?: DeliveryAddress; // Compatibility alias
  couponCode?: string;
  statusHistory?: OrderStatusHistoryItem[];
  estimatedDeliveryTime?: string;
  // Delivery Partner Details
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  riderVehicleNumber?: string;
  riderVehicleModel?: string;
  riderPhoto?: string;
  riderRating?: number;
  riderTotalDeliveries?: number;
  riderStatus?: RiderStatus;
  riderCurrentLat?: number;
  riderCurrentLng?: number;
  restaurantLat?: number;
  restaurantLng?: number;
  deliveryLat?: number;
  deliveryLng?: number;
  liveEtaMinutes?: number;
  liveDistanceKm?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryPartner {
  partnerId: string;
  id?: string;
  name: string;
  phone: string;
  vehicleType: 'bike' | 'scooter' | 'ev';
  vehicleModel?: string;
  vehicleNumber: string;
  photoURL?: string;
  rating: number;
  totalDeliveries: number;
  status: 'active' | 'busy' | 'offline';
  city: string;
  currentLat?: number;
  currentLng?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Review {
  reviewId: string;
  customerId: string;
  customerName: string;
  customerPhoto?: string;
  restaurantId: string;
  foodId?: string;
  foodName?: string;
  orderId: string;
  rating: number;
  comment: string;
  imageUrl?: string;
  photoURL?: string;
  isReported?: boolean;
  createdAt: string;
}

export interface Coupon {
  couponId: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discount: number;
  minOrder: number;
  maxDiscount?: number;
  expiryDate: string;
  usageLimit: number;
  usedCount: number;
  active: boolean;
  description: string;
}

export interface AppNotification {
  notificationId: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'promo' | 'system' | 'approval';
  read: boolean;
  createdAt: string;
  link?: string;
}

export type ComplaintStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export interface Complaint {
  complaintId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  orderId?: string;
  subject: string;
  category: string;
  description: string;
  status: ComplaintStatus;
  adminReply?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuditLog {
  logId: string;
  adminUid: string;
  action: string;
  targetId: string;
  description: string;
  timestamp: string;
}

// Normalize order status to standard uppercase
export function normalizeOrderStatus(status: string | undefined): 'PLACED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' {
  if (!status || typeof status !== 'string') return 'PLACED';
  const clean = status.toUpperCase().replace(/\s+/g, '_');
  if (clean === 'PLACED') return 'PLACED';
  if (clean === 'CONFIRMED' || clean === 'RESTAURANT_ACCEPTED') return 'CONFIRMED';
  if (clean === 'PREPARING') return 'PREPARING';
  if (clean === 'READY') return 'READY';
  if (clean === 'OUT_FOR_DELIVERY' || clean === 'OUT') return 'OUT_FOR_DELIVERY';
  if (clean === 'DELIVERED' || clean === 'COMPLETED') return 'DELIVERED';
  if (clean === 'CANCELLED' || clean === 'REJECTED') return 'CANCELLED';
  return 'PLACED';
}
