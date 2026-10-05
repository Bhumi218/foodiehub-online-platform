import { db } from '../lib/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { DeliveryPartner, RiderStatus } from '../types';

export const INITIAL_DELIVERY_PARTNERS: DeliveryPartner[] = [
  {
    partnerId: 'rider-1',
    name: 'Vikram Singh',
    phone: '+91 98234 11204',
    vehicleType: 'bike',
    vehicleModel: 'TVS Apache 160',
    vehicleNumber: 'DL 04 EF 9821',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    rating: 4.9,
    totalDeliveries: 1420,
    status: 'active',
    city: 'New Delhi',
    currentLat: 28.6139,
    currentLng: 77.209,
    createdAt: new Date().toISOString(),
  },
  {
    partnerId: 'rider-2',
    name: 'Rahul Sharma',
    phone: '+91 97112 55890',
    vehicleType: 'scooter',
    vehicleModel: 'Honda Activa 6G',
    vehicleNumber: 'DL 08 CK 4432',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    rating: 4.8,
    totalDeliveries: 890,
    status: 'active',
    city: 'New Delhi',
    currentLat: 28.6289,
    currentLng: 77.218,
    createdAt: new Date().toISOString(),
  },
  {
    partnerId: 'rider-3',
    name: 'Amit Kumar Patel',
    phone: '+91 98103 44211',
    vehicleType: 'bike',
    vehicleModel: 'Hero Splendor Plus',
    vehicleNumber: 'UP 14 BD 7619',
    photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    rating: 4.9,
    totalDeliveries: 2150,
    status: 'active',
    city: 'Noida',
    currentLat: 28.5355,
    currentLng: 77.391,
    createdAt: new Date().toISOString(),
  },
  {
    partnerId: 'rider-4',
    name: 'Sumit Verma',
    phone: '+91 99580 33120',
    vehicleType: 'bike',
    vehicleModel: 'Bajaj Pulsar 150',
    vehicleNumber: 'DL 03 AS 2288',
    photoURL: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
    rating: 4.7,
    totalDeliveries: 640,
    status: 'active',
    city: 'New Delhi',
    currentLat: 28.6315,
    currentLng: 77.2167,
    createdAt: new Date().toISOString(),
  },
  {
    partnerId: 'rider-5',
    name: 'Deepak Yadav',
    phone: '+91 98711 99042',
    vehicleType: 'ev',
    vehicleModel: 'Ather 450X EV',
    vehicleNumber: 'DL 01 EV 1029',
    photoURL: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
    rating: 4.95,
    totalDeliveries: 1150,
    status: 'active',
    city: 'Gurugram',
    currentLat: 28.4595,
    currentLng: 77.0266,
    createdAt: new Date().toISOString(),
  },
  {
    partnerId: 'rider-6',
    name: 'Mohammad Faizan',
    phone: '+91 96541 22876',
    vehicleType: 'scooter',
    vehicleModel: 'Suzuki Access 125',
    vehicleNumber: 'HR 26 DQ 5510',
    photoURL: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
    rating: 4.85,
    totalDeliveries: 1780,
    status: 'active',
    city: 'New Delhi',
    currentLat: 28.6189,
    currentLng: 77.225,
    createdAt: new Date().toISOString(),
  },
];

/**
 * Fetch all delivery partners from Firestore or seed initial fleet if collection is empty
 */
export async function getDeliveryPartners(): Promise<DeliveryPartner[]> {
  try {
    const colRef = collection(db, 'delivery_partners');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      return snapshot.docs.map((docSnap) => ({
        partnerId: docSnap.id,
        id: docSnap.id,
        ...(docSnap.data() as any),
      })) as DeliveryPartner[];
    }

    // Seed defaults in background
    for (const p of INITIAL_DELIVERY_PARTNERS) {
      await setDoc(doc(db, 'delivery_partners', p.partnerId), p);
    }
    return INITIAL_DELIVERY_PARTNERS;
  } catch (err) {
    console.warn('Could not fetch delivery_partners from Firestore, using initial fleet:', err);
    return INITIAL_DELIVERY_PARTNERS;
  }
}

/**
 * Create a new delivery partner
 */
export async function addDeliveryPartner(
  partner: Omit<DeliveryPartner, 'partnerId' | 'createdAt'>
): Promise<DeliveryPartner> {
  const partnerId = `rider-${Date.now().toString().slice(-6)}`;
  const newPartner: DeliveryPartner = {
    ...partner,
    partnerId,
    id: partnerId,
    createdAt: new Date().toISOString(),
    status: partner.status || 'active',
    rating: partner.rating || 4.9,
    totalDeliveries: partner.totalDeliveries || 0,
  };

  try {
    await setDoc(doc(db, 'delivery_partners', partnerId), newPartner);
  } catch (err) {
    console.warn('Error saving partner to Firestore:', err);
  }
  return newPartner;
}

/**
 * Update delivery partner details
 */
export async function updateDeliveryPartner(
  partnerId: string,
  updates: Partial<DeliveryPartner>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'delivery_partners', partnerId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Error updating partner in Firestore:', err);
  }
}

/**
 * City base coordinates map (lat, lng)
 */
export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  delhi: { lat: 28.6139, lng: 77.209 },
  'new delhi': { lat: 28.6139, lng: 77.209 },
  noida: { lat: 28.5355, lng: 77.391 },
  gurugram: { lat: 28.4595, lng: 77.0266 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  pune: { lat: 18.5204, lng: 73.8567 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  lucknow: { lat: 26.8467, lng: 80.9462 },
  chandigarh: { lat: 30.7333, lng: 76.7794 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  patna: { lat: 25.5941, lng: 85.1376 },
};

/**
 * Generate plausible coordinates for restaurant & customer delivery address
 */
export function getRouteCoordinates(cityInput?: string, addressInput?: string) {
  const query = (cityInput || addressInput || 'Delhi').toLowerCase();
  let base = CITY_COORDINATES['delhi'];
  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    if (query.includes(key)) {
      base = coords;
      break;
    }
  }

  // Restaurant is offset slightly from center
  const restaurantLat = base.lat + 0.008 + (Math.random() * 0.004 - 0.002);
  const restaurantLng = base.lng - 0.012 + (Math.random() * 0.004 - 0.002);

  // Customer home is ~2.5 - 4 km away
  const deliveryLat = base.lat - 0.011 + (Math.random() * 0.004 - 0.002);
  const deliveryLng = base.lng + 0.015 + (Math.random() * 0.004 - 0.002);

  // Initial rider position near restaurant
  const riderLat = restaurantLat + 0.001;
  const riderLng = restaurantLng + 0.001;

  return {
    restaurantLat,
    restaurantLng,
    deliveryLat,
    deliveryLng,
    riderLat,
    riderLng,
  };
}

/**
 * Assign rider to an order in Firestore
 */
export async function assignRiderToOrder(
  orderId: string,
  rider: {
    partnerId?: string;
    name: string;
    phone: string;
    vehicleNumber?: string;
    vehicleModel?: string;
    photoURL?: string;
    rating?: number;
    totalDeliveries?: number;
  },
  status: RiderStatus = 'assigned',
  cityHint?: string
) {
  const coords = getRouteCoordinates(cityHint);

  const updates: Record<string, any> = {
    riderId: rider.partnerId || `rider-${Date.now()}`,
    riderName: rider.name,
    riderPhone: rider.phone,
    riderVehicleNumber: rider.vehicleNumber || 'DL 08 CK 4432',
    riderVehicleModel: rider.vehicleModel || 'Motorbike',
    riderPhoto:
      rider.photoURL ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    riderRating: rider.rating || 4.9,
    riderTotalDeliveries: rider.totalDeliveries || 1200,
    riderStatus: status,
    restaurantLat: coords.restaurantLat,
    restaurantLng: coords.restaurantLng,
    deliveryLat: coords.deliveryLat,
    deliveryLng: coords.deliveryLng,
    riderCurrentLat: coords.riderLat,
    riderCurrentLng: coords.riderLng,
    liveEtaMinutes: status === 'on_the_way' ? 18 : 25,
    liveDistanceKm: 3.4,
    updatedAt: new Date().toISOString(),
  };

  await updateDoc(doc(db, 'orders', orderId), updates);
  return updates;
}
