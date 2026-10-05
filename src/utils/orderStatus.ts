export type CanonicalOrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export function normalizeOrderStatus(status?: string): CanonicalOrderStatus {
  if (!status || typeof status !== 'string') return 'PLACED';
  const clean = status.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (clean === 'PLACED') return 'PLACED';
  if (clean === 'CONFIRMED') return 'CONFIRMED';
  if (clean === 'PREPARING') return 'PREPARING';
  if (clean === 'READY') return 'READY';
  if (clean === 'OUT_FOR_DELIVERY' || clean === 'OUTFORDELIVERY') return 'OUT_FOR_DELIVERY';
  if (clean === 'DELIVERED') return 'DELIVERED';
  if (clean === 'CANCELLED' || clean === 'CANCELED') return 'CANCELLED';
  return 'PLACED';
}

export function getStatusCustomerMessage(status?: string): string {
  const norm = normalizeOrderStatus(status);
  switch (norm) {
    case 'PLACED':
      return 'Order Placed';
    case 'CONFIRMED':
      return 'Order Confirmed';
    case 'PREPARING':
      return 'Restaurant is preparing your order';
    case 'READY':
      return 'Order is ready';
    case 'OUT_FOR_DELIVERY':
      return 'Out for delivery';
    case 'DELIVERED':
      return 'Delivered';
    case 'CANCELLED':
      return 'Order Cancelled';
  }
}

export function getStatusStepDescription(status?: string): string {
  const norm = normalizeOrderStatus(status);
  switch (norm) {
    case 'PLACED':
      return 'Order document created in Firestore and received by kitchen.';
    case 'CONFIRMED':
      return 'Chef verified and confirmed your meal items.';
    case 'PREPARING':
      return 'Fresh ingredients being seasoned and cooked on high dum.';
    case 'READY':
      return 'Dishes sealed in thermal delivery packaging, waiting for rider pickup.';
    case 'OUT_FOR_DELIVERY':
      return 'Delivery partner is riding swiftly towards your address.';
    case 'DELIVERED':
      return 'Delivered! Order handed over. Enjoy your meal!';
    case 'CANCELLED':
      return 'This order was cancelled.';
  }
}

export const ORDER_TRACKING_STEPS: {
  status: CanonicalOrderStatus;
  label: string;
  desc: string;
}[] = [
  {
    status: 'PLACED',
    label: 'Order Placed',
    desc: 'Order document created in Firestore',
  },
  {
    status: 'CONFIRMED',
    label: 'Order Confirmed',
    desc: 'Chef accepted and confirmed your order',
  },
  {
    status: 'PREPARING',
    label: 'Restaurant is preparing your order',
    desc: 'Simmering fresh on kitchen burners',
  },
  {
    status: 'READY',
    label: 'Order is ready',
    desc: 'Packed in thermal insulation for pickup',
  },
  {
    status: 'OUT_FOR_DELIVERY',
    label: 'Out for delivery',
    desc: 'Rider is on the way to your doorstep',
  },
  {
    status: 'DELIVERED',
    label: 'Delivered',
    desc: 'Delivered safely. Enjoy your feast!',
  },
];
