import React, { useState } from 'react';
import { DeliveryPartner, Order } from '../../types';
import { addDeliveryPartner, updateDeliveryPartner } from '../../services/deliveryService';
import { useToast } from '../../context/ToastContext';
import {
  Bike,
  Plus,
  Phone,
  ShieldCheck,
  Star,
  Award,
  Search,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  UserPlus,
  X,
  MapPin,
} from 'lucide-react';

interface DeliveryFleetTabProps {
  partners: DeliveryPartner[];
  orders: Order[];
  onPartnerAdded: (partner: DeliveryPartner) => void;
  onPartnerUpdated: (partnerId: string, updates: Partial<DeliveryPartner>) => void;
  onOpenAssignModal: (order: Order) => void;
}

export const DeliveryFleetTab: React.FC<DeliveryFleetTabProps> = ({
  partners,
  orders,
  onPartnerAdded,
  onPartnerUpdated,
  onOpenAssignModal,
}) => {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New partner state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState<'bike' | 'scooter' | 'ev'>('bike');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [city, setCity] = useState('New Delhi');
  const [submitting, setSubmitting] = useState(false);

  // Filtered partners
  const filtered = partners.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.vehicleNumber.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q)
    );
  });

  const activeCount = partners.filter((p) => p.status === 'active').length;
  const busyCount = partners.filter((p) => p.status === 'busy').length;

  const handleToggleStatus = async (partner: DeliveryPartner) => {
    const nextStatus = partner.status === 'active' ? 'busy' : 'active';
    try {
      await updateDeliveryPartner(partner.partnerId, { status: nextStatus });
      onPartnerUpdated(partner.partnerId, { status: nextStatus });
      showToast({ type: 'info', title: 'Status Updated', message: `${partner.name} is now marked ${nextStatus}!` });
    } catch {
      showToast({ type: 'error', title: 'Update Failed', message: 'Could not update rider status' });
    }
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast({ type: 'error', title: 'Name Required', message: 'Please enter partner name' });
      return;
    }
    if (!phone.trim()) {
      showToast({ type: 'error', title: 'Phone Required', message: 'Please enter partner phone number' });
      return;
    }
    if (!vehicleNumber.trim()) {
      showToast({ type: 'error', title: 'Vehicle Plate Required', message: 'Please enter vehicle registration number' });
      return;
    }

    setSubmitting(true);
    try {
      const newPartner = await addDeliveryPartner({
        name: name.trim(),
        phone: phone.trim(),
        vehicleType,
        vehicleModel: vehicleModel.trim() || (vehicleType === 'bike' ? 'Motorcycle' : 'Scooter'),
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        city: city.trim() || 'New Delhi',
        photoURL:
          vehicleType === 'ev'
            ? 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        rating: 4.9,
        totalDeliveries: 0,
        status: 'active',
      });

      onPartnerAdded(newPartner);
      showToast({ type: 'success', title: 'Rider Added', message: `Delivery partner ${newPartner.name} registered!` });
      setIsAddModalOpen(false);
      setName('');
      setPhone('');
      setVehicleModel('');
      setVehicleNumber('');
    } catch {
      showToast({ type: 'error', title: 'Registration Failed', message: 'Failed to register delivery partner' });
    } finally {
      setSubmitting(false);
    }
  };

  // Find active orders that need a rider or are out for delivery
  const dispatchableOrders = orders.filter(
    (o) => o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED'
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-orange-100 text-orange-900 text-[10px] font-black uppercase tracking-wider">
              Real-Time Fleet Operations
            </span>
            <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-mono text-[10px]">
              Zomato-Style GPS
            </span>
          </div>
          <h1 className="text-2xl font-black font-heading text-stone-900 tracking-tight mt-1">
            Delivery Fleet Management
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage delivery boys, their mobile numbers, vehicle details, and assign them to live customer orders in real time.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add Delivery Boy</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <p className="text-[11px] font-bold text-stone-500 uppercase">Total Fleet</p>
          <p className="text-2xl font-black text-stone-900 mt-1">{partners.length}</p>
          <p className="text-[10px] text-stone-400 mt-0.5">Verified riders</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-600 uppercase">On Duty / Active</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{activeCount}</p>
          <p className="text-[10px] text-stone-400 mt-0.5">Ready for pickup</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <p className="text-[11px] font-bold text-orange-600 uppercase">Busy / En Route</p>
          <p className="text-2xl font-black text-orange-700 mt-1">{busyCount}</p>
          <p className="text-[10px] text-stone-400 mt-0.5">Delivering to customers</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <p className="text-[11px] font-bold text-purple-600 uppercase">Active Orders</p>
          <p className="text-2xl font-black text-purple-700 mt-1">{dispatchableOrders.length}</p>
          <p className="text-[10px] text-stone-400 mt-0.5">Requiring rider tracking</p>
        </div>
      </div>

      {/* Quick Dispatch Banner for Active Orders */}
      {dispatchableOrders.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-200/80">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-orange-200/60">
            <span className="text-xs font-black uppercase text-orange-900 flex items-center gap-1.5">
              <Bike className="w-4 h-4 text-orange-600" />
              Live Orders Waiting for Partner Dispatch ({dispatchableOrders.length})
            </span>
            <span className="text-[10px] text-orange-700 font-bold">
              Instant Sync to Customer Phone & Map
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {dispatchableOrders.slice(0, 5).map((ord) => (
              <div
                key={ord.orderId || (ord as any).id}
                className="bg-white px-3 py-2 rounded-xl border border-orange-200 flex items-center gap-3 text-xs shadow-xs"
              >
                <div>
                  <p className="font-black text-stone-900">
                    #{String(ord.orderId || (ord as any).id).slice(-6).toUpperCase()} • {ord.customerName}
                  </p>
                  <p className="text-[10px] text-stone-500">
                    {ord.riderName ? `Rider: ${ord.riderName}` : 'No rider assigned yet'}
                  </p>
                </div>
                <button
                  onClick={() => onOpenAssignModal(ord)}
                  className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white font-bold text-[10px] rounded-lg transition cursor-pointer"
                >
                  {ord.riderName ? 'Change Rider' : 'Assign Rider'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-stone-200 flex items-center gap-2">
        <Search className="w-4 h-4 text-stone-400" />
        <input
          type="text"
          placeholder="Search riders by name, mobile phone number, vehicle number, or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs outline-none bg-transparent font-medium"
        />
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((partner) => (
          <div
            key={partner.partnerId}
            className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={partner.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                      alt={partner.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-500 shadow-sm"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center border-2 border-white shadow">
                      <ShieldCheck className="w-3 h-3" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-black text-stone-900">{partner.name}</h3>
                      <span className="flex items-center gap-0.5 text-[10px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                        {partner.rating}
                      </span>
                    </div>

                    <a
                      href={`tel:${partner.phone}`}
                      className="text-xs font-mono font-bold text-emerald-700 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{partner.phone}</span>
                    </a>

                    <p className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-stone-400" />
                      <span>{partner.city}</span>
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    partner.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : partner.status === 'busy'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {partner.status}
                </span>
              </div>

              {/* Vehicle info */}
              <div className="mt-4 p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Vehicle:</span>
                  <span className="font-bold text-stone-800">
                    {partner.vehicleModel || partner.vehicleType.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Plate No:</span>
                  <span className="font-mono font-black text-stone-900">
                    {partner.vehicleNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Deliveries:</span>
                  <span className="font-medium text-stone-700">
                    {partner.totalDeliveries}+ orders completed
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
              <button
                onClick={() => handleToggleStatus(partner)}
                className="text-xs font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
              >
                {partner.status === 'active' ? (
                  <ToggleRight className="w-5 h-5 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-5 h-5 text-stone-400" />
                )}
                <span>{partner.status === 'active' ? 'Duty On' : 'Duty Off'}</span>
              </button>

              <a
                href={`tel:${partner.phone}`}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Rider</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Add Delivery Partner Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900">Add New Delivery Partner</h3>
                  <p className="text-[11px] text-stone-500">Register delivery boy for live customer dispatch</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePartner} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-300 outline-none focus:border-purple-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Mobile Number (With Country Code) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-300 outline-none focus:border-purple-600 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-300 outline-none focus:border-purple-600 font-medium"
                  >
                    <option value="bike">Motorbike</option>
                    <option value="scooter">Scooter</option>
                    <option value="ev">Electric Bike / EV</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Vehicle Model
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Honda Activa 6G"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-300 outline-none focus:border-purple-600 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Vehicle Plate Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DL 08 CK 4432"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-300 outline-none focus:border-purple-600 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Operating City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. New Delhi"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-300 outline-none focus:border-purple-600 font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:text-stone-900 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? 'Registering...' : 'Save Delivery Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
