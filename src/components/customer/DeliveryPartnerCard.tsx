import React, { useState } from 'react';
import { Order } from '../../types';
import {
  Phone,
  MessageCircle,
  Copy,
  Check,
  ShieldCheck,
  Bike,
  Star,
  Award,
  Navigation,
  Thermometer,
} from 'lucide-react';

interface DeliveryPartnerCardProps {
  order: Order;
  className?: string;
}

export const DeliveryPartnerCard: React.FC<DeliveryPartnerCardProps> = ({
  order,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  // Fallback defaults if not explicitly set
  const riderName = order.riderName || 'Vikram Singh';
  const riderPhone = order.riderPhone || '+91 98234 11204';
  const vehicleNumber = order.riderVehicleNumber || 'DL 04 EF 9821';
  const vehicleModel = order.riderVehicleModel || 'TVS Apache 160';
  const riderRating = order.riderRating || 4.9;
  const totalDeliveries = order.riderTotalDeliveries || 1420;
  const riderPhoto =
    order.riderPhoto ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

  const handleCopyPhone = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(riderPhone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const cleanPhoneDigits = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return `91${digits}`;
    if (digits.startsWith('0') && digits.length === 11) return `91${digits.slice(1)}`;
    return digits;
  };

  const shortOrderId = String(order.orderId || (order as any).id || '').slice(-6).toUpperCase();
  const waDigits = cleanPhoneDigits(riderPhone);
  const waText = encodeURIComponent(
    `Hello ${riderName}! I am tracking my FoodieHub order #${shortOrderId}. Could you please let me know your delivery status/ETA? Thank you!`
  );
  const whatsappUrl = `https://wa.me/${waDigits}?text=${waText}`;
  const callUrl = `tel:${riderPhone.replace(/\s+/g, '')}`;

  const getStatusBadge = () => {
    switch (order.riderStatus) {
      case 'at_restaurant':
        return {
          label: 'At Restaurant (Waiting for Food)',
          color: 'bg-amber-100 text-amber-900 border-amber-200',
        };
      case 'picked_up':
        return {
          label: 'Food Picked Up • Starting Journey',
          color: 'bg-blue-100 text-blue-900 border-blue-200',
        };
      case 'on_the_way':
        return {
          label: 'On the Way to Your Location 🛵',
          color: 'bg-orange-100 text-orange-900 border-orange-200 animate-pulse',
        };
      case 'arriving':
        return {
          label: 'Reaching Gate / Building',
          color: 'bg-purple-100 text-purple-900 border-purple-200',
        };
      case 'delivered':
        return {
          label: 'Delivered at Doorstep ✓',
          color: 'bg-emerald-100 text-emerald-900 border-emerald-200',
        };
      default:
        return {
          label: 'Assigned Delivery Partner',
          color: 'bg-stone-100 text-stone-800 border-stone-200',
        };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div
      className={`bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-sm transition hover:shadow-md ${className}`}
    >
      {/* Top Banner: Partner Badge & Live State */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-xs font-black uppercase tracking-wider text-stone-900">
            Delivery Partner
          </span>
          <span className="px-2 py-0.5 rounded-md bg-stone-100 text-[10px] font-mono text-stone-600">
            Zomato-Style Live Fleet
          </span>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-[11px] font-black border flex items-center gap-1.5 ${statusBadge.color}`}
        >
          <Bike className="w-3.5 h-3.5" />
          <span>{statusBadge.label}</span>
        </span>
      </div>

      {/* Main Partner Info */}
      <div className="pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={riderPhoto}
              alt={riderName}
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border-2 border-orange-500 shadow-md"
            />
            <div
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center border-2 border-white shadow"
              title="Verified Partner"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black font-heading text-stone-900">
                {riderName}
              </h3>
              <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-black">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>{riderRating}</span>
              </span>
            </div>

            <p className="text-xs text-stone-500 mt-0.5">
              Super Partner • <span className="font-bold text-stone-700">{totalDeliveries}+ deliveries</span>
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="px-2.5 py-1 bg-stone-100 rounded-lg text-stone-800 font-mono text-[11px] font-bold border border-stone-200">
                🏍️ {vehicleNumber}
              </span>
              <span className="text-[11px] text-stone-500 font-medium">
                ({vehicleModel})
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Call, WhatsApp & Copy */}
        <div className="flex flex-col sm:items-end gap-2.5 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Call Partner Button */}
            <a
              href={callUrl}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              title={`Direct Call ${riderName}`}
            >
              <Phone className="w-4 h-4" />
              <span>Call Partner</span>
            </a>

            {/* WhatsApp Partner Button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-4 py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              title={`Chat with ${riderName} on WhatsApp`}
            >
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              <span>WhatsApp</span>
            </a>
          </div>

          {/* Clickable Phone Number and Quick Copy */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
            <a
              href={callUrl}
              className="px-3 py-1.5 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-700 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1.5 border border-stone-200 cursor-pointer"
              title="Click to dial directly"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>{riderPhone}</span>
            </a>

            <button
              onClick={handleCopyPhone}
              className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-xs transition cursor-pointer border border-stone-200"
              title="Copy mobile number"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Safety & Hygiene Assurances */}
      <div className="mt-5 pt-4 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="flex items-center gap-2 p-2.5 bg-stone-50 rounded-xl text-stone-700 text-xs">
          <Thermometer className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="text-[11px] font-medium">Body Temp: 98.4°F (Normal)</span>
        </div>
        <div className="flex items-center gap-2 p-2.5 bg-stone-50 rounded-xl text-stone-700 text-xs">
          <ShieldCheck className="w-4 h-4 text-orange-600 flex-shrink-0" />
          <span className="text-[11px] font-medium">Thermal Insulated Hot Bag</span>
        </div>
        <div className="flex items-center gap-2 p-2.5 bg-stone-50 rounded-xl text-stone-700 text-xs">
          <Award className="w-4 h-4 text-purple-600 flex-shrink-0" />
          <span className="text-[11px] font-medium">100% Contactless Handover</span>
        </div>
      </div>
    </div>
  );
};
