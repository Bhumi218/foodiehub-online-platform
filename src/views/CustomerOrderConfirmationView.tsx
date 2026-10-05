import React, { useEffect, useState } from 'react';
import { Order } from '../types';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle2,
  Clock,
  MapPin,
  ShoppingBag,
  ArrowRight,
  Copy,
  Check,
  CreditCard,
  Banknote,
  Utensils,
  Share2,
  Bike,
  Phone,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { normalizeOrderStatus, getStatusCustomerMessage } from '../utils/orderStatus';
import confetti from 'canvas-confetti';

interface CustomerOrderConfirmationViewProps {
  orderId: string;
  initialOrder?: Order;
  onTrackOrder: (orderId: string) => void;
  onViewAllOrders: () => void;
  onExploreMore: () => void;
  onOpenAuth?: () => void;
}

export const CustomerOrderConfirmationView: React.FC<CustomerOrderConfirmationViewProps> = ({
  orderId,
  initialOrder,
  onTrackOrder,
  onViewAllOrders,
  onExploreMore,
  onOpenAuth,
}) => {
  const { userProfile, isAdmin } = useAuth();
  const [order, setOrder] = useState<Order | null>(initialOrder || null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fire celebratory confetti on mount
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.5 },
      });
    } catch {}
  }, []);

  useEffect(() => {
    if (!orderId) return;

    // Listen in real-time to Firestore order document
    const unsub = onSnapshot(
      doc(db, 'orders', orderId),
      (snap) => {
        if (snap.exists()) {
          setOrder(snap.data() as Order);
        }
      },
      (err) => {
        console.warn('Real-time order confirmation fetch warning:', err);
      }
    );

    return () => unsub();
  }, [orderId]);

  const handleCopyId = () => {
    if (orderId) {
      navigator.clipboard.writeText(orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const status = normalizeOrderStatus(order?.orderStatus || 'PLACED');
  const statusMsg = getStatusCustomerMessage(status);

  // Unauthenticated user must not access order confirmation details
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
              Sign In to View Order
            </h2>
            <p className="text-xs text-stone-500 mt-2 leading-relaxed">
              Please sign in with your customer account to view your confirmed order, live tracking, and receipt.
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
              onClick={onExploreMore}
              className="py-2.5 px-5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Explore Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authorization check: only customer who placed this order or admin
  const isAuthorized =
    isAdmin ||
    userProfile?.role === 'admin' ||
    !order ||
    !order.customerId ||
    order.customerId === userProfile.uid;

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
            You do not have permission to view this order. Please log in with the account used when ordering.
          </p>
          <div className="pt-2">
            <button
              onClick={onExploreMore}
              className="py-2.5 px-5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Explore Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-24 pt-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Success Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-xl text-center relative overflow-hidden">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-inner">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider mb-2">
            ✓ Order Placed Successfully
          </span>

          <h1 className="text-2xl sm:text-3xl font-black font-heading text-stone-900 tracking-tight mt-1">
            Order #{orderId ? String(orderId).slice(-8).toUpperCase() : ''}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto mt-2">
            Your feast has been registered directly in the kitchen. Chef is preparing to pack your meal fresh!
          </p>

          {/* Quick Info Strip */}
          <div className="mt-6 p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-wrap items-center justify-between gap-4 text-left">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">
                Order Reference
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-sm font-black text-stone-900">
                  #{orderId ? String(orderId) : ''}
                </span>
                <button
                  onClick={handleCopyId}
                  title="Copy Order ID"
                  className="p-1 text-stone-400 hover:text-stone-700 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">
                Live Status
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-orange-100 text-orange-800 text-xs font-black mt-0.5">
                <span className="w-2 h-2 rounded-full bg-orange-600 animate-ping inline-block" />
                {statusMsg}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">
                Estimated Delivery
              </span>
              <span className="text-xs font-black text-stone-900 mt-0.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                {order?.estimatedDeliveryTime || '25-35 mins'}
              </span>
            </div>
          </div>

          {/* Assigned Delivery Partner Preview Card */}
          {order?.riderName && (
            <div className="mt-4 p-3.5 bg-orange-50/70 border border-orange-200/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black flex-shrink-0">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-stone-900">
                      Rider: {order.riderName}
                    </span>
                    <span className="text-[10px] bg-orange-200/70 text-orange-900 px-2 py-0.5 rounded-full font-bold">
                      Delivery Partner
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 font-mono mt-0.5">
                    {order.riderPhone ? `Call: ${order.riderPhone}` : 'Assigned to your delivery'}
                    {order.riderVehicleNumber ? ` • ${order.riderVehicleNumber}` : ''}
                  </p>
                </div>
              </div>

              {order.riderPhone && (
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${order.riderPhone.replace(/\s+/g, '')}`}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    title={`Call ${order.riderName || 'Partner'}`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                  <a
                    href={`https://wa.me/${order.riderPhone.replace(/\D/g, '').length === 10 ? '91' + order.riderPhone.replace(/\D/g, '') : order.riderPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${order.riderName || 'Partner'}! I am tracking my FoodieHub order #${String(order.orderId || (order as any).id || '').slice(-6).toUpperCase()}. Please update me on delivery status. Thank you!`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    title={`WhatsApp ${order.riderName || 'Partner'}`}
                  >
                    <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                    </svg>
                    <span>WhatsApp</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onTrackOrder(orderId)}
              className="w-full sm:w-auto px-8 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-600/20 hover:shadow-orange-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Bike className="w-4 h-4" />
              <span>Track Live on GPS Map (Zomato-Style)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onViewAllOrders}
              className="w-full sm:w-auto px-6 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-stone-600" />
              <span>View All Orders</span>
            </button>
          </div>
        </div>

        {/* Order Details Card */}
        {order && (
          <div className="mt-6 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Restaurant Partner
                </span>
                <h3 className="text-base font-black text-stone-900 mt-0.5">
                  {order.restaurantName}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Payment Status
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-black uppercase ${
                    (order.paymentStatus || '').toLowerCase() === 'paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {(order.paymentStatus || '').toLowerCase() === 'paid' ? (
                    <CreditCard className="w-3 h-3" />
                  ) : (
                    <Banknote className="w-3 h-3" />
                  )}
                  {order.paymentStatus ? String(order.paymentStatus).toUpperCase() : 'PENDING'}
                </span>
              </div>
            </div>

            {/* Items */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-stone-500 mb-3">
                Items in This Order ({order.items?.length || 0})
              </h4>
              <div className="divide-y divide-stone-100">
                {(order.items || []).map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover border border-stone-200"
                        />
                      )}
                      <div>
                        <p className="text-xs font-bold text-stone-900">{item.name}</p>
                        <p className="text-[11px] text-stone-500">
                          Qty: <span className="font-semibold text-stone-800">{item.quantity}</span> × ₹{item.price}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-stone-900">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bill Summary */}
            <div className="pt-4 border-t border-stone-100 space-y-2 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Item Subtotal</span>
                <span className="font-medium text-stone-800">₹{order.subtotal}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon Discount</span>
                  <span>-₹{order.discount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery & Logistics Fee</span>
                <span className="font-medium text-stone-800">
                  {order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Govt Taxes & Restaurant Packaging</span>
                <span className="font-medium text-stone-800">₹{order.tax}</span>
              </div>
              <div className="pt-2 border-t border-stone-100 flex justify-between text-sm font-black text-stone-900">
                <span>Grand Total</span>
                <span className="text-orange-600 text-base font-heading">₹{order.total}</span>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="pt-4 border-t border-stone-100">
              <h4 className="text-xs font-black uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-orange-600" />
                <span>Delivery Address</span>
              </h4>
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-1">
                <p className="font-bold text-stone-900">
                  {order.deliveryAddress?.name || order.customerName}
                </p>
                <p className="text-stone-600">
                  {order.deliveryAddress?.address || order.address?.address}
                </p>
                <p className="text-stone-600">
                  {order.deliveryAddress?.city || order.address?.city} -{' '}
                  {order.deliveryAddress?.pincode || order.address?.pincode}
                </p>
                <p className="text-stone-500 font-mono pt-1">
                  Contact: {order.deliveryAddress?.phone || order.customerPhone}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={onExploreMore}
            className="text-xs font-bold text-stone-500 hover:text-orange-600 transition underline"
          >
            ← Back to FoodieHub Menu to Browse More Delicious Dishes
          </button>
        </div>
      </div>
    </div>
  );
};
