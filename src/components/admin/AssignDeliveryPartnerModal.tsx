import React, { useState, useEffect } from 'react';
import { Order, DeliveryPartner, RiderStatus } from '../../types';
import { db } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '../../context/ToastContext';
import { getRouteCoordinates } from '../../services/deliveryService';
import {
  X,
  Bike,
  Phone,
  ShieldCheck,
  Star,
  MapPin,
  CheckCircle2,
  Navigation,
  UserPlus,
  Radio,
} from 'lucide-react';

interface AssignDeliveryPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  partners: DeliveryPartner[];
  onOrderUpdated?: (orderId: string, updates: Partial<Order>) => void;
}

export const AssignDeliveryPartnerModal: React.FC<AssignDeliveryPartnerModalProps> = ({
  isOpen,
  onClose,
  order,
  partners,
  onOrderUpdated,
}) => {
  const { showToast } = useToast();
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [mode, setMode] = useState<'fleet' | 'custom'>('fleet');

  // Custom partner fields
  const [customName, setCustomName] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [customVehicleNumber, setCustomVehicleNumber] = useState('');
  const [customVehicleModel, setCustomVehicleModel] = useState('');

  // Rider status
  const [riderStatus, setRiderStatus] = useState<RiderStatus>('assigned');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (order) {
      if (order.riderId) {
        setSelectedPartnerId(order.riderId);
      } else if (partners.length > 0) {
        setSelectedPartnerId(partners[0].partnerId);
      }

      setCustomName(order.riderName || '');
      setCustomPhone(order.riderPhone || '');
      setCustomVehicleNumber(order.riderVehicleNumber || '');
      setCustomVehicleModel(order.riderVehicleModel || 'Bike');
      setRiderStatus(order.riderStatus || (order.orderStatus === 'OUT_FOR_DELIVERY' ? 'on_the_way' : 'assigned'));
    }
  }, [order, partners]);

  if (!isOpen || !order) return null;

  const orderId = order.orderId || (order as any).id;

  const handleSave = async () => {
    if (!orderId) return;
    setSaving(true);

    try {
      let finalRiderName = '';
      let finalRiderPhone = '';
      let finalVehicleNumber = '';
      let finalVehicleModel = 'Bike';
      let finalPhoto = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
      let finalRating = 4.9;
      let finalDeliveries = 1200;
      let finalRiderId = `rider-${Date.now()}`;

      if (mode === 'fleet') {
        const found = partners.find((p) => p.partnerId === selectedPartnerId);
        if (found) {
          finalRiderId = found.partnerId;
          finalRiderName = found.name;
          finalRiderPhone = found.phone;
          finalVehicleNumber = found.vehicleNumber;
          finalVehicleModel = found.vehicleModel || found.vehicleType.toUpperCase();
          finalPhoto = found.photoURL || finalPhoto;
          finalRating = found.rating;
          finalDeliveries = found.totalDeliveries;
        } else {
          finalRiderName = order.riderName || 'Vikram Singh';
          finalRiderPhone = order.riderPhone || '+91 98234 11204';
          finalVehicleNumber = order.riderVehicleNumber || 'DL 04 EF 9821';
        }
      } else {
        if (!customName.trim()) {
          showToast({ type: 'error', title: 'Name Required', message: 'Please enter delivery partner name' });
          setSaving(false);
          return;
        }
        if (!customPhone.trim()) {
          showToast({ type: 'error', title: 'Phone Required', message: 'Please enter delivery partner phone number' });
          setSaving(false);
          return;
        }
        finalRiderName = customName.trim();
        finalRiderPhone = customPhone.trim();
        finalVehicleNumber = customVehicleNumber.trim() || 'DL 08 CK 4432';
        finalVehicleModel = customVehicleModel.trim() || 'Motorcycle';
      }

      // Compute or preserve coordinates for the live map
      const coords = getRouteCoordinates(
        order.deliveryAddress?.city || order.address?.city,
        order.deliveryAddress?.address || order.address?.address
      );

      // Determine updated order status based on rider status
      let newOrderStatus = order.orderStatus;
      if (riderStatus === 'on_the_way' || riderStatus === 'arriving') {
        newOrderStatus = 'OUT_FOR_DELIVERY';
      } else if (riderStatus === 'delivered') {
        newOrderStatus = 'DELIVERED';
      }

      const updates: Partial<Order> = {
        riderId: finalRiderId,
        riderName: finalRiderName,
        riderPhone: finalRiderPhone,
        riderVehicleNumber: finalVehicleNumber,
        riderVehicleModel: finalVehicleModel,
        riderPhoto: finalPhoto,
        riderRating: finalRating,
        riderTotalDeliveries: finalDeliveries,
        riderStatus,
        orderStatus: newOrderStatus,
        restaurantLat: order.restaurantLat || coords.restaurantLat,
        restaurantLng: order.restaurantLng || coords.restaurantLng,
        deliveryLat: order.deliveryLat || coords.deliveryLat,
        deliveryLng: order.deliveryLng || coords.deliveryLng,
        riderCurrentLat: coords.riderLat,
        riderCurrentLng: coords.riderLng,
        liveEtaMinutes: riderStatus === 'on_the_way' ? 18 : 25,
        liveDistanceKm: 3.2,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, 'orders', orderId), updates);

      showToast({
        type: 'success',
        title: 'Partner Dispatched',
        message: `Delivery partner ${finalRiderName} assigned to #${String(orderId).slice(-6).toUpperCase()}!`,
      });

      if (onOrderUpdated) {
        onOrderUpdated(orderId, updates);
      }

      onClose();
    } catch (err: any) {
      console.warn('Error assigning delivery partner:', err);
      showToast({
        type: 'error',
        title: 'Assignment Failed',
        message: 'Failed to assign delivery partner. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden my-8 animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-stone-900 to-stone-900 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-lg">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 bg-white/10 px-2 py-0.5 rounded-md">
                Admin Dispatch Console
              </span>
              <h2 className="text-base sm:text-lg font-black font-heading text-white mt-1">
                Assign Delivery Partner
              </h2>
              <p className="text-xs text-stone-300">
                Order #{String(orderId).slice(-6).toUpperCase()} • {order.customerName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {/* Order Snapshot */}
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-xs flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-stone-500">Kitchen:</span>{' '}
              <span className="font-bold text-stone-900">{order.restaurantName}</span>
            </div>
            <div>
              <span className="text-stone-500">Destination:</span>{' '}
              <span className="font-medium text-stone-800">
                {order.deliveryAddress?.city || 'Delhi'} ({order.deliveryAddress?.phone || order.customerPhone})
              </span>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex rounded-2xl bg-stone-100 p-1">
            <button
              onClick={() => setMode('fleet')}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition cursor-pointer ${
                mode === 'fleet' ? 'bg-white text-purple-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Choose From Active Fleet ({partners.length})
            </button>
            <button
              onClick={() => setMode('custom')}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition cursor-pointer ${
                mode === 'custom' ? 'bg-white text-purple-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              + Custom Delivery Boy
            </button>
          </div>

          {/* Tab 1: Choose from Fleet */}
          {mode === 'fleet' ? (
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block">
                Select Delivery Partner
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {partners.map((partner) => {
                  const isSelected = selectedPartnerId === partner.partnerId;
                  return (
                    <div
                      key={partner.partnerId}
                      onClick={() => setSelectedPartnerId(partner.partnerId)}
                      className={`p-3 rounded-2xl border-2 cursor-pointer transition flex items-center gap-3 ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/50 shadow-sm'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <img
                        src={partner.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                        alt={partner.name}
                        className="w-11 h-11 rounded-xl object-cover border border-stone-200 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1 text-xs">
                        <div className="flex items-center justify-between">
                          <p className="font-black text-stone-900 truncate">{partner.name}</p>
                          <span className="flex items-center gap-0.5 text-[10px] text-amber-600 font-bold">
                            <Star className="w-2.5 h-2.5 fill-amber-500" />
                            {partner.rating}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 font-mono mt-0.5">{partner.phone}</p>
                        <p className="text-[10px] text-stone-400 truncate">
                          🏍️ {partner.vehicleNumber} ({partner.vehicleModel || partner.vehicleType})
                        </p>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-purple-600 bg-purple-600 text-white' : 'border-stone-300'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Tab 2: Custom Delivery Boy Form */
            <div className="space-y-3 p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Delivery Partner Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 outline-none focus:border-purple-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Mobile Number (With Country Code) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. +91 98765 43210"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 outline-none focus:border-purple-600 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DL 08 CK 4432"
                    value={customVehicleNumber}
                    onChange={(e) => setCustomVehicleNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 outline-none focus:border-purple-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Vehicle Model
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hero Splendor"
                    value={customVehicleModel}
                    onChange={(e) => setCustomVehicleModel(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 outline-none focus:border-purple-600 font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Rider Status Progression Stage */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                Live Delivery Stage (Reflects in Real Time to Customer)
              </label>
              <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full">
                GPS Synced
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                { id: 'assigned', label: '1. Assigned', desc: 'Dispatched to kitchen' },
                { id: 'at_restaurant', label: '2. At Kitchen', desc: 'Waiting for packing' },
                { id: 'picked_up', label: '3. Food Picked', desc: 'Sealed & bagged' },
                { id: 'on_the_way', label: '4. On the Way', desc: 'Live GPS moving 🛵' },
                { id: 'arriving', label: '5. Reaching Gate', desc: 'Arrived at building' },
                { id: 'delivered', label: '6. Delivered ✓', desc: 'Order completed' },
              ].map((st) => {
                const isActive = riderStatus === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setRiderStatus(st.id as RiderStatus)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      isActive
                        ? 'border-orange-500 bg-orange-50 text-orange-900 font-black ring-2 ring-orange-200'
                        : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <p className="text-xs font-bold">{st.label}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">{st.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving to Firestore...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Update Live Rider</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
