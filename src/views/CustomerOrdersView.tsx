import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { OrderReviewModal } from '../components/customer/OrderReviewModal';
import { ComplaintModal } from '../components/customer/ComplaintModal';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { normalizeOrderStatus, getStatusCustomerMessage } from '../utils/orderStatus';
import {
  Clock,
  MapPin,
  ChevronRight,
  Star,
  HelpCircle,
  XCircle,
  CheckCircle,
  ShoppingBag,
  Bike,
  Phone,
  Lock,
} from 'lucide-react';

interface CustomerOrdersViewProps {
  orders: Order[];
  onTrackOrder: (orderId: string) => void;
  onExploreFood: () => void;
  onOpenAuth?: () => void;
}

export const CustomerOrdersView: React.FC<CustomerOrdersViewProps> = ({
  orders,
  onTrackOrder,
  onExploreFood,
  onOpenAuth,
}) => {
  const { userProfile } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');
  const [selectedReviewOrder, setSelectedReviewOrder] = useState<Order | null>(null);
  const [selectedComplaintOrder, setSelectedComplaintOrder] = useState<Order | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);

  // Unauthenticated visitors must not see any orders
  if (!userProfile?.uid) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4 bg-stone-50">
        <div className="bg-white rounded-3xl p-8 sm:p-12 max-w-md w-full text-center border border-stone-200 shadow-xl space-y-5">
          <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-10 h-10" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">
              Account Required
            </span>
            <h2 className="text-2xl font-black font-heading text-stone-900 mt-1">
              Sign In to View Orders
            </h2>
            <p className="text-xs text-stone-500 mt-2 leading-relaxed">
              Please log in to your customer account to view your past food orders, live GPS delivery tracking, and receipts.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            {onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shadow-md shadow-orange-600/20 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Customer Login</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onExploreFood}
              className="px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Explore Menus
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Strictly filter orders for current logged-in customer only
  const myOrders = orders.filter((o) => o.customerId === userProfile.uid);

  const activeOrders = myOrders.filter((o) => {
    const s = normalizeOrderStatus(o.orderStatus);
    return s !== 'DELIVERED' && s !== 'CANCELLED';
  });

  const completedOrders = myOrders.filter((o) => {
    const s = normalizeOrderStatus(o.orderStatus);
    return s === 'DELIVERED' || s === 'CANCELLED';
  });

  const displayedOrders =
    activeTab === 'active'
      ? activeOrders
      : activeTab === 'completed'
      ? completedOrders
      : myOrders;

  const handleConfirmCancel = async () => {
    if (!cancellingOrder) return;
    const orderId = cancellingOrder.orderId || (cancellingOrder as any).id;
    if (!orderId || typeof orderId !== 'string') {
      setCancellingOrder(null);
      return;
    }
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        orderStatus: 'CANCELLED',
        updatedAt: new Date().toISOString(),
      });
      showToast({
        type: 'info',
        title: 'Order Cancelled',
        message: `Order #${String(orderId).slice(-6).toUpperCase()} has been cancelled.`,
      });
    } catch (err) {
      console.warn('Cancel order error:', err);
    }
    setCancellingOrder(null);
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24 pt-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">
              Customer Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-black font-heading text-stone-900 tracking-tight mt-0.5">
              My Food Orders
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Track live kitchen status, view receipts, and review delivered meals
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-stone-200/70 p-1 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition ${
                activeTab === 'all'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All ({myOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition ${
                activeTab === 'active'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Active ({activeOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition ${
                activeTab === 'completed'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Completed ({completedOrders.length})
            </button>
          </div>
        </div>

        {displayedOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-stone-900">No orders in this view</h3>
            <p className="text-xs text-stone-500 mt-1">
              Craving something delicious? Order from top artisan kitchens now.
            </p>
            <button
              onClick={onExploreFood}
              className="mt-4 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition"
            >
              Explore Menus
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedOrders.map((order) => {
              const normStatus = normalizeOrderStatus(order.orderStatus);
              const canCancel = normStatus === 'PLACED' || normStatus === 'CONFIRMED';
              const isDelivered = normStatus === 'DELIVERED';
              const isCancelled = normStatus === 'CANCELLED';
              const statusDisplay = getStatusCustomerMessage(normStatus);

              let statusBadgeClass = 'bg-stone-100 text-stone-700 border-stone-200';
              if (isDelivered) {
                statusBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
              } else if (isCancelled) {
                statusBadgeClass = 'bg-rose-100 text-rose-800 border-rose-200';
              } else if (normStatus === 'PLACED') {
                statusBadgeClass = 'bg-blue-100 text-blue-900 border-blue-200 animate-pulse';
              } else {
                statusBadgeClass = 'bg-amber-100 text-amber-900 border-amber-200 animate-pulse';
              }

              const orderKey = order.orderId || (order as any).id || `order-${order.createdAt || ''}`;
              const orderDisplayId = order.orderId || (order as any).id || '';

              return (
                <div
                  key={orderKey}
                  className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  {/* Order Card Top Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black font-heading text-stone-900">
                          {order.restaurantName}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusBadgeClass}`}
                        >
                          {statusDisplay}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Order #{orderDisplayId ? String(orderDisplayId).slice(-6).toUpperCase() : ''} •{' '}
                        {new Date(order.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}{' '}
                        at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-base font-black text-stone-900">₹{order.total}</span>
                      <span className="block text-[10px] text-stone-400 uppercase font-semibold">
                        {order.paymentMethod ? String(order.paymentMethod).toUpperCase() : 'COD'} ({order.paymentStatus || 'pending'})
                      </span>
                    </div>
                  </div>

                  {/* Items preview */}
                  <div className="py-3 text-xs text-stone-700">
                    <p className="font-semibold text-stone-900 mb-1">
                      {(order.items || []).length} item(s):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(order.items || []).map((item, idx) => (
                        <span
                          key={item.foodId ? `${item.foodId}-${idx}` : `item-${idx}`}
                          className="px-2.5 py-1 bg-stone-50 rounded-lg border border-stone-200 text-stone-700 font-medium"
                        >
                          {item.quantity}x {item.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Partner Assigned info */}
                  {order.riderName && (
                    <div className="mt-3 p-2.5 bg-orange-50/60 rounded-xl border border-orange-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold">
                          <Bike className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-stone-900">
                          Rider: {order.riderName}
                          {order.riderVehicleNumber ? ` (${order.riderVehicleNumber})` : ''}
                        </span>
                      </div>
                      {order.riderPhone && (
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${order.riderPhone.replace(/\s+/g, '')}`}
                            onClick={(e) => e.stopPropagation()}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold flex items-center gap-1 font-mono text-[11px] transition border border-emerald-200"
                            title={`Call ${order.riderName || 'Partner'}`}
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>Call</span>
                          </a>
                          <a
                            href={`https://wa.me/${order.riderPhone.replace(/\D/g, '').length === 10 ? '91' + order.riderPhone.replace(/\D/g, '') : order.riderPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${order.riderName || 'Partner'}! I am tracking my FoodieHub order #${String(order.orderId || (order as any).id || '').slice(-6).toUpperCase()}. Please update me on delivery status. Thank you!`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-2.5 py-1 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] rounded-lg font-bold flex items-center gap-1 text-[11px] transition border border-[#25D366]/30"
                            title={`WhatsApp ${order.riderName || 'Partner'}`}
                          >
                            <svg className="w-3 h-3 fill-[#128C7E]" viewBox="0 0 24 24">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                            </svg>
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                      <span className="truncate max-w-[200px] sm:max-w-xs">
                        {order.address?.address || 'Delivery Address'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Cancel order if status allows */}
                      {canCancel && (
                        <button
                          onClick={() => setCancellingOrder(order)}
                          className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition"
                        >
                          Cancel Order
                        </button>
                      )}

                      {/* Review order if delivered */}
                      {isDelivered && (
                        <button
                          onClick={() => setSelectedReviewOrder(order)}
                          className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-xl border border-amber-200 transition flex items-center gap-1"
                        >
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>Review Meal</span>
                        </button>
                      )}

                      {/* Complaint ticket button */}
                      <button
                        onClick={() => setSelectedComplaintOrder(order)}
                        className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition"
                        title="Help / Raise Complaint"
                      >
                        <HelpCircle className="w-4 h-4" />
                      </button>

                      {/* Track live */}
                      <button
                        onClick={() => onTrackOrder(order.orderId)}
                        className="px-4 py-2 bg-stone-900 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                      >
                        <Bike className="w-3.5 h-3.5" />
                        <span>Track Live</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedReviewOrder && (
        <OrderReviewModal
          order={selectedReviewOrder}
          isOpen={true}
          onClose={() => setSelectedReviewOrder(null)}
          onReviewSubmitted={() => setSelectedReviewOrder(null)}
        />
      )}

      {/* Complaint Modal */}
      {selectedComplaintOrder && (
        <ComplaintModal
          isOpen={true}
          onClose={() => setSelectedComplaintOrder(null)}
          orderId={selectedComplaintOrder.orderId}
        />
      )}

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!cancellingOrder}
        title="Cancel This Order?"
        message={`Are you sure you want to cancel order #${cancellingOrder?.orderId ? cancellingOrder.orderId.slice(-6) : ''}? This will abort kitchen preparation.`}
        confirmLabel="Yes, Cancel Order"
        cancelLabel="Keep Order"
        isDestructive={true}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancellingOrder(null)}
      />
    </div>
  );
};
