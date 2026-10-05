import React, { useEffect, useState } from 'react';
import { Order } from '../types';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { ComplaintModal } from '../components/customer/ComplaintModal';
import { LiveDeliveryMap } from '../components/customer/LiveDeliveryMap';
import { DeliveryPartnerCard } from '../components/customer/DeliveryPartnerCard';
import {
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  ChefHat,
  Bike,
  PackageCheck,
  AlertCircle,
  HelpCircle,
  ChevronLeft,
  Flame,
  ShieldCheck,
  RefreshCw,
  ShoppingBag,
  Info,
  Lock,
} from 'lucide-react';
import {
  CanonicalOrderStatus,
  normalizeOrderStatus,
  getStatusCustomerMessage,
  getStatusStepDescription,
  ORDER_TRACKING_STEPS,
} from '../utils/orderStatus';

interface LiveOrderTrackingViewProps {
  orderId: string;
  initialOrder?: Order;
  fallbackOrders?: Order[];
  onBack: () => void;
  onOpenReviewModal?: (order: Order) => void;
  onOpenAuth?: () => void;
}

export const LiveOrderTrackingView: React.FC<LiveOrderTrackingViewProps> = ({
  orderId,
  initialOrder,
  fallbackOrders = [],
  onBack,
  onOpenReviewModal,
  onOpenAuth,
}) => {
  const { userProfile, isAdmin } = useAuth();
  const [order, setOrder] = useState<Order | null>(() => {
    if (initialOrder) return initialOrder;
    if (orderId && fallbackOrders.length > 0) {
      return (
        fallbackOrders.find((o) => o.orderId === orderId || (o as any).id === orderId) || null
      );
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(() => !initialOrder);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const [telemetryNoteVisible, setTelemetryNoteVisible] = useState(true);

  // Firestore Real-Time Order Stream
  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    // Fast fallback check from cache/props
    if (!order && fallbackOrders.length > 0) {
      const cached = fallbackOrders.find(
        (o) => o.orderId === orderId || (o as any).id === orderId
      );
      if (cached) {
        setOrder(cached);
        setLoading(false);
      }
    }

    // Primary real-time system: Firebase Firestore onSnapshot()
    // Listens continuously for status changes (PLACED -> CONFIRMED -> PREPARING -> READY -> OUT_FOR_DELIVERY -> DELIVERED)
    const orderDocRef = doc(db, 'orders', orderId);
    const unsubscribe = onSnapshot(
      orderDocRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Order;
          setOrder({
            ...data,
            orderId: data.orderId || (data as any).id || snap.id,
            id: (data as any).id || data.orderId || snap.id,
          });
          setNotFound(false);
          setLoading(false);
        } else {
          // Document does not exist in Firestore!
          console.warn(`Order document orders/${orderId} not found in Firestore.`);
          // If no fallback was already present, mark as not found
          setOrder((prev) => {
            if (!prev) setNotFound(true);
            return prev;
          });
          setLoading(false);
        }
      },
      (err) => {
        console.warn('Firestore real-time order listener notice:', err.code, err.message);
        setOrder((prev) => {
          if (!prev) setNotFound(true);
          return prev;
        });
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [orderId, fallbackOrders]);

  // Unauthenticated user must not access live order tracking
  if (!userProfile?.uid) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 bg-stone-50">
        <div className="bg-white rounded-3xl p-8 sm:p-10 max-w-md w-full text-center border border-stone-200 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">
              Account Required
            </span>
            <h2 className="text-xl sm:text-2xl font-black font-heading text-stone-900 mt-1">
              Sign In to Track Order
            </h2>
            <p className="text-xs text-stone-500 mt-2 leading-relaxed">
              Please sign in with your customer account to view live GPS tracking, delivery partner status, and route updates.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
            {onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="py-2.5 px-5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
              >
                Customer Sign In
              </button>
            )}
            <button
              onClick={onBack}
              className="py-2.5 px-5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If order is still loading
  if (loading && !order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-10 h-10 border-3 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-stone-700">Connecting to Firebase Real-Time Order Feed...</p>
          <p className="text-[11px] text-stone-400 mt-1">Retrieving order details from Cloud Firestore</p>
        </div>
      </div>
    );
  }

  // Verify ownership / authorization for this order
  const isAuthorized =
    isAdmin ||
    userProfile?.role === 'admin' ||
    (order && (order.customerId === userProfile?.uid || (order as any).sellerId === userProfile?.uid));

  if (order && !isAuthorized) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 bg-stone-50">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-stone-200 shadow-xl space-y-4">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black font-heading text-stone-900">
            Access Restricted
          </h2>
          <p className="text-xs text-stone-500 leading-relaxed">
            You do not have permission to view or track this order. Please log in with the account that placed the order.
          </p>
          <div className="pt-2">
            <button
              onClick={onBack}
              className="py-2.5 px-5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Back to My Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If order could not be located in Firestore
  if (notFound || !order) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-stone-200 shadow-xl space-y-4">
          <div className="w-14 h-14 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black font-heading text-stone-900">
            Order not found
          </h2>
          <p className="text-xs text-stone-600 leading-relaxed">
            {orderId
              ? `We could not locate order #${String(orderId)}. The order document does not exist in Firestore or may have been deleted.`
              : 'No order identifier was specified.'}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              onClick={onBack}
              className="flex-1 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>View My Orders</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentStatus = normalizeOrderStatus(order.orderStatus);
  const currentStatusMsg = getStatusCustomerMessage(currentStatus);

  // Status index for milestone progress
  const stepStatusKeys: CanonicalOrderStatus[] = [
    'PLACED',
    'CONFIRMED',
    'PREPARING',
    'READY',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
  ];
  const currentStepIndex = stepStatusKeys.indexOf(currentStatus);

  return (
    <div className="min-h-screen bg-stone-50 pb-24 pt-4">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-orange-600 transition bg-white px-3.5 py-1.5 rounded-xl border border-stone-200 shadow-2xs"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Orders</span>
          </button>

          <button
            onClick={() => setIsComplaintOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-rose-600 transition bg-white px-3.5 py-1.5 rounded-xl border border-stone-200 shadow-2xs"
          >
            <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
            <span>Need Help?</span>
          </button>
        </div>

        {/* Live Tracking Header Card */}
        <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-orange-600 text-white font-mono font-black text-[10px] uppercase tracking-wider">
                  LIVE STATUS
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-stone-300 font-mono text-[10px]">
                  ID: #{order?.orderId ? String(order.orderId).slice(-8).toUpperCase() : ''}
                </span>
              </div>

              {/* Exact real-time message requested by user */}
              <h1 className="text-2xl sm:text-3xl font-black font-heading text-white mt-2 tracking-tight">
                {currentStatusMsg}
              </h1>

              <p className="text-xs text-stone-300 mt-1">
                From <span className="text-white font-bold">{order.restaurantName}</span> • Placed at{' '}
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-center sm:text-right">
              <span className="text-[10px] text-stone-300 uppercase font-bold tracking-wider block">
                Estimated Delivery
              </span>
              <span className="text-xl font-black font-heading text-amber-400">
                {currentStatus === 'DELIVERED' ? 'Delivered ✓' : order.estimatedDeliveryTime || '25-35 mins'}
              </span>
            </div>
          </div>

          {/* Quick Delivery Rider Pill in Header (When assigned) */}
          {order.riderName && (
            <div className="mt-6 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-white">
                      {order.riderName}
                    </p>
                    <span className="text-[10px] bg-orange-500/40 text-orange-200 px-2 py-0.5 rounded-full font-bold">
                      Delivery Partner
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-300">
                    {order.riderVehicleNumber ? `Vehicle: ${order.riderVehicleNumber} • ` : ''}FoodieHub Super Fleet
                  </p>
                </div>
              </div>
              {order.riderPhone ? (
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${order.riderPhone.replace(/\s+/g, '')}`}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                    title={`Call ${order.riderName || 'Partner'}`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                  <a
                    href={`https://wa.me/${order.riderPhone.replace(/\D/g, '').length === 10 ? '91' + order.riderPhone.replace(/\D/g, '') : order.riderPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${order.riderName || 'Partner'}! I am tracking my FoodieHub order #${String(order.orderId || (order as any).id || '').slice(-6).toUpperCase()}. Please share delivery status/ETA. Thank you!`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                    title={`WhatsApp ${order.riderName || 'Partner'}`}
                  >
                    <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                    </svg>
                    <span>WhatsApp</span>
                  </a>
                </div>
              ) : (
                <span className="px-3 py-1 rounded-xl bg-stone-800 text-stone-400 text-[11px] font-medium">
                  Assigned at Dispatch
                </span>
              )}
            </div>
          )}
        </div>

        {/* ZOMATO-STYLE REAL-TIME GPS ROUTE MAP */}
        <div className="mt-6">
          <LiveDeliveryMap order={order} />
        </div>

        {/* ZOMATO-STYLE DELIVERY PARTNER CARD */}
        <div className="mt-6">
          <DeliveryPartnerCard order={order} />
        </div>

        {/* Milestone Timeline Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs mt-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div>
              <h2 className="text-base font-black font-heading text-stone-900">
                Kitchen & Delivery Milestones
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Real-time tracking through Firebase Firestore
              </p>
            </div>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-xl">
              {currentStatusMsg}
            </span>
          </div>

          <div className="mt-6 space-y-7 relative before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-stone-200">
            {ORDER_TRACKING_STEPS.map((step, idx) => {
              const isPast = currentStepIndex > idx;
              const isCurrent = currentStepIndex === idx;

              let iconBg = 'bg-stone-100 text-stone-400 border-stone-200';
              if (isPast) {
                iconBg = 'bg-emerald-600 text-white border-emerald-600';
              } else if (isCurrent) {
                iconBg = 'bg-orange-600 text-white border-orange-600 ring-4 ring-orange-100 animate-pulse';
              }

              let IconComponent = CheckCircle2;
              if (step.status === 'PREPARING') IconComponent = ChefHat;
              if (step.status === 'READY') IconComponent = PackageCheck;
              if (step.status === 'OUT_FOR_DELIVERY') IconComponent = Bike;

              return (
                <div key={step.status} className="relative flex items-start gap-4 z-10">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all flex-shrink-0 ${iconBg}`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between">
                      <h3
                        className={`text-sm font-bold ${
                          isCurrent
                            ? 'text-orange-600'
                            : isPast
                            ? 'text-stone-900'
                            : 'text-stone-400'
                        }`}
                      >
                        {step.label}
                      </h3>
                      {isCurrent && (
                        <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                          Current Stage
                        </span>
                      )}
                      {isPast && (
                        <span className="text-[10px] font-bold text-emerald-600">Completed ✓</span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* If delivered, prompt review */}
          {currentStatus === 'DELIVERED' && onOpenReviewModal && (
            <div className="mt-8 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-amber-900">How was your feast?</h4>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Share your verified feedback to help other foodies in your city.
                </p>
              </div>
              <button
                onClick={() => onOpenReviewModal(order)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Write Review
              </button>
            </div>
          )}
        </div>

        {/* Order Details & Delivery Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Items Summary */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
            <h3 className="text-sm font-black font-heading text-stone-900 pb-3 border-b border-stone-100">
              Items Ordered ({order.items?.length || 0})
            </h3>
            <div className="divide-y divide-stone-100 mt-2">
              {(order.items || []).map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-800">{item.quantity}x</span>
                    <span className="text-stone-700">{item.name}</span>
                  </div>
                  <span className="font-bold text-stone-900">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-stone-100 mt-3 flex justify-between text-xs font-bold text-stone-900">
              <span>Total ({order.paymentMethod ? String(order.paymentMethod).toUpperCase() : 'COD'})</span>
              <span className="text-orange-600 text-sm font-heading">₹{order.total}</span>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
            <h3 className="text-sm font-black font-heading text-stone-900 pb-3 border-b border-stone-100 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-orange-600" />
              <span>Delivery Destination</span>
            </h3>

            <div className="mt-3 text-xs space-y-1">
              <p className="font-bold text-stone-900">
                {order.deliveryAddress?.name || order.address?.name || order.customerName}
              </p>
              <p className="text-stone-600 leading-relaxed">
                {order.deliveryAddress?.address || order.address?.address},{' '}
                {order.deliveryAddress?.city || order.address?.city} -{' '}
                {order.deliveryAddress?.pincode || order.address?.pincode}
              </p>
              <p className="text-stone-500 font-mono pt-1">
                Phone: {order.deliveryAddress?.phone || order.address?.phone || order.customerPhone}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Support / Grievance Modal */}
      <ComplaintModal
        isOpen={isComplaintOpen}
        onClose={() => setIsComplaintOpen(false)}
        orderId={order.orderId}
      />
    </div>
  );
};
