import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { db, auth } from '../lib/firebase';
import { doc, setDoc, collection } from 'firebase/firestore';
import { DeliveryAddress, Order } from '../types';
import { getRouteCoordinates } from '../services/deliveryService';
import confetti from 'canvas-confetti';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  MapPin,
  Banknote,
  Tag,
  ArrowRight,
  ShieldCheck,
  Check,
  Clock,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

/**
 * Remove undefined optional fields recursively to strictly comply with Firestore requirements
 */
function cleanData<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        result[key] = value.map((item) =>
          item && typeof item === 'object' && !(item instanceof Date) ? cleanData(item) : item
        );
      } else if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
        result[key] = cleanData(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

interface CartCheckoutViewProps {
  onOrderPlaced: (orderId: string) => void;
  onOpenRestaurant: (restaurantId: string) => void;
  onOpenAuth: () => void;
}

export const CartCheckoutView: React.FC<CartCheckoutViewProps> = ({
  onOrderPlaced,
  onOpenRestaurant,
  onOpenAuth,
}) => {
  const {
    items,
    restaurantId,
    restaurantName,
    appliedCoupon,
    subtotal,
    deliveryFee,
    tax,
    discount,
    grandTotal,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const { userProfile } = useAuth();
  const { showToast } = useToast();

  const [couponInput, setCouponInput] = useState('');
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [devErrorInfo, setDevErrorInfo] = useState<{
    code?: string;
    message?: string;
    details?: string;
  } | null>(null);

  // Address state
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [savedAddresses, setSavedAddresses] = useState<DeliveryAddress[]>([
    {
      name: userProfile?.name || 'My Delivery Address',
      phone: userProfile?.phone || '',
      tag: 'Home',
      address: 'Flat 402, Skyline Heritage Towers, Sector 15',
      city: 'Central City',
      state: 'Delhi NCR',
      pincode: '110001',
    },
    {
      name: userProfile?.name || 'Office Address',
      phone: userProfile?.phone || '',
      tag: 'Work',
      address: 'Floor 6, Tech Park Horizon, DLF Phase 2',
      city: 'Gurugram',
      state: 'Haryana',
      pincode: '122002',
    },
  ]);

  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddr, setNewAddr] = useState<DeliveryAddress>({
    name: userProfile?.name || '',
    phone: userProfile?.phone || '',
    tag: 'Home',
    address: '',
    city: 'Central City',
    state: 'Delhi NCR',
    pincode: '110001',
  });

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = applyCoupon(couponInput.trim());
    if (res.success) {
      showToast({ type: 'success', title: 'Coupon Applied', message: res.message });
      setCouponInput('');
    } else {
      showToast({ type: 'error', title: 'Coupon Error', message: res.message });
    }
  };

  const handleSaveNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.address.trim()) {
      showToast({ type: 'error', title: 'Address Required' });
      return;
    }
    setSavedAddresses([...savedAddresses, newAddr]);
    setSelectedAddressIndex(savedAddresses.length);
    setIsAddingAddress(false);
    showToast({ type: 'success', title: 'Address Added' });
  };

  const activeAddress = savedAddresses[selectedAddressIndex] || savedAddresses[0];

  const handlePlaceOrder = async () => {
    setDevErrorInfo(null);

    // =========================================================================
    // 2. VERIFY AUTHENTICATION & CUSTOMER IDENTITY
    // Strict requirement: User must be signed in with a valid account
    // =========================================================================
    const user = auth.currentUser;
    const customerId = user?.uid || userProfile?.uid;

    if (!customerId) {
      showToast({
        type: 'warning',
        title: 'Sign In Required',
        message: 'Please sign in to your customer account to place your order.',
      });
      onOpenAuth();
      return;
    }

    // =========================================================================
    // 3. VERIFY CART
    // Before creating the order verify:
    // - cart exists
    // - cart has at least one item
    // - every item has a valid food ID
    // - quantity > 0
    // - price is valid
    // - total is valid
    // If invalid: "Your cart contains invalid items. Please refresh your cart and try again."
    // =========================================================================
    const isCartValid =
      Array.isArray(items) &&
      items.length > 0 &&
      items.every((item) => {
        const foodId = item?.food?.id || item?.food?.foodId;
        const qty = item?.quantity;
        const price = item?.food?.discountPrice ?? item?.food?.price;
        return (
          foodId &&
          typeof foodId === 'string' &&
          foodId.trim().length > 0 &&
          typeof qty === 'number' &&
          qty > 0 &&
          typeof price === 'number' &&
          !isNaN(price) &&
          price >= 0
        );
      }) &&
      typeof grandTotal === 'number' &&
      !isNaN(grandTotal) &&
      grandTotal > 0;

    if (!isCartValid) {
      showToast({
        type: 'error',
        title: 'Invalid Cart',
        message: 'Your cart contains invalid items. Please refresh your cart and try again.',
      });
      return;
    }

    // Verify delivery address
    if (!activeAddress || !activeAddress.address || !activeAddress.address.trim()) {
      showToast({
        type: 'error',
        title: 'Delivery Address Required',
        message: 'Please add or select a valid delivery address to proceed.',
      });
      setIsAddingAddress(true);
      return;
    }

    // Target restaurant and seller identifiers
    const targetRestaurantId = restaurantId || items[0]?.food?.restaurantId || 'rest-1';
    const targetSellerId = items[0]?.food?.sellerId || 'seller-demo-1';
    const cleanCustomerName =
      user?.displayName || userProfile?.name || activeAddress?.name || 'Valued Customer';
    const cleanCustomerPhone =
      activeAddress?.phone || user?.phoneNumber || userProfile?.phone || '9876543210';

    console.log('==================================================');
    console.log('FOODIEHUB ORDER PLACEMENT FLOW - INITIATING');
    console.log('==================================================');
    console.log('Firebase authentication state:', 'AUTHENTICATED');
    console.log('authenticated Firebase UID:', customerId);
    console.log(
      'cart contents:',
      items.map((i) => ({
        foodId: i.food?.id || i.food?.foodId,
        name: i.food?.name,
        quantity: i.quantity,
        price: i.food?.discountPrice ?? i.food?.price,
      }))
    );
    console.log('calculated subtotal: ₹', subtotal);
    console.log('delivery fee: ₹', deliveryFee);
    console.log('tax: ₹', tax);
    console.log('total: ₹', grandTotal);
    console.log('restaurantId:', targetRestaurantId);
    console.log('sellerId:', targetSellerId);
    console.log('delivery address:', activeAddress.address + ', ' + activeAddress.city);
    console.log('payment method: COD');

    setIsProcessingOrder(true);

    // =========================================================================
    // 5. FIRESTORE ORDER CREATION FUNCTION
    // Create the order in orders/{orderId}
    // =========================================================================
    const executeOrderCreation = async () => {
      const now = new Date().toISOString();
      const orderRef = doc(collection(db, 'orders'));
      const orderId = orderRef.id;

      console.log('Firestore write operation: setDoc(doc(db, "orders", "' + orderId + '"))');

      const orderItems = items.map((i) => ({
        foodId: i.food.id || i.food.foodId,
        name: i.food.name,
        price: Number(i.food.discountPrice ?? i.food.price),
        quantity: Number(i.quantity),
        image: i.food.image || '',
        foodType: i.food.foodType || 'veg',
      }));

      // =========================================================================
      // 4. VERIFY REQUIRED ORDER DATA
      // Before Firestore write, verify:
      // customerId, customerName, customerPhone, items, subtotal, deliveryFee,
      // tax, total, deliveryAddress, restaurantId, sellerId, orderStatus,
      // paymentStatus, createdAt.
      // Do not write undefined fields to Firestore.
      // =========================================================================
      const coords = getRouteCoordinates(activeAddress?.city, activeAddress?.address);

      const rawOrderPayload: Record<string, any> = {
        orderId,
        id: orderId,
        customerId, // strictly auth.currentUser.uid
        customerName: cleanCustomerName,
        customerPhone: cleanCustomerPhone,
        items: orderItems,
        subtotal: Number(subtotal),
        deliveryFee: Number(deliveryFee),
        discount: Number(discount || 0),
        tax: Number(tax),
        total: Number(grandTotal),
        paymentMethod: 'COD',
        paymentStatus: 'PENDING',
        orderStatus: 'PLACED',
        deliveryAddress: activeAddress,
        address: activeAddress,
        restaurantId: targetRestaurantId,
        sellerId: targetSellerId,
        restaurantName: restaurantName || 'Partner Kitchen',
        statusHistory: [
          {
            status: 'PLACED',
            timestamp: now,
            note: 'Order placed via Cash on Delivery and registered in Firestore.',
          },
        ],
        estimatedDeliveryTime: '25-35 mins',
        riderId: 'rider-1',
        riderName: 'Vikram Singh',
        riderPhone: '+91 98234 11204',
        riderVehicleNumber: 'DL 04 EF 9821',
        riderVehicleModel: 'TVS Apache 160',
        riderPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        riderRating: 4.9,
        riderTotalDeliveries: 1420,
        riderStatus: 'assigned',
        restaurantLat: coords.restaurantLat,
        restaurantLng: coords.restaurantLng,
        deliveryLat: coords.deliveryLat,
        deliveryLng: coords.deliveryLng,
        riderCurrentLat: coords.riderLat,
        riderCurrentLng: coords.riderLng,
        liveEtaMinutes: 28,
        liveDistanceKm: 3.2,
        createdAt: now,
        updatedAt: now,
      };

      if (appliedCoupon?.code) {
        rawOrderPayload.couponCode = appliedCoupon.code;
      }

      // Clean all undefined fields
      const cleanOrderPayload = cleanData(rawOrderPayload);

      // Verify all required fields are present and not undefined
      const requiredFields = [
        'customerId',
        'customerName',
        'customerPhone',
        'items',
        'subtotal',
        'deliveryFee',
        'tax',
        'total',
        'deliveryAddress',
        'restaurantId',
        'sellerId',
        'paymentMethod',
        'paymentStatus',
        'orderStatus',
        'createdAt',
        'updatedAt',
      ];

      const missingFields = requiredFields.filter(
        (f) => cleanOrderPayload[f] === undefined || cleanOrderPayload[f] === null
      );

      if (missingFields.length > 0) {
        console.error('Order verification failed. Missing fields:', missingFields);
        setIsProcessingOrder(false);
        showToast({
          type: 'error',
          title: 'Order Data Incomplete',
          message: `Cannot write order. Missing required fields: ${missingFields.join(', ')}`,
        });
        return;
      }

      // Execute Firestore Document Write
      try {
        await setDoc(orderRef, cleanOrderPayload);
        console.log('Firestore write operation: SUCCESS! Order document created:', orderId);
      } catch (err: any) {
        const errCode = err?.code || 'firestore/unknown';
        const errMsg = err?.message || 'Failed to write order document to Firestore.';

        console.error('==================================================');
        console.error('FIRESTORE ORDER WRITE FAILED');
        console.error('exact Firebase error code:', errCode);
        console.error('exact Firebase error message:', errMsg);
        console.error('Target Document:', `orders/${orderId}`);
        console.error('Auth User UID:', customerId);
        console.error('Full Error Object:', err);
        console.error('==================================================');

        setDevErrorInfo({
          code: errCode,
          message: errMsg,
          details: `Target: orders/${orderId} | Auth UID: ${customerId}`,
        });

        setIsProcessingOrder(false);

        showToast({
          type: 'error',
          title: 'Order Placement Error',
          message: `Order creation failed: [${errCode}] - ${errMsg}`,
          duration: 9000,
        });
        return;
      }

      // =========================================================================
      // 10. AFTER SUCCESSFUL ORDER CREATION
      // 1. Get the generated real order ID.
      // 2. Clear the customer's cart.
      // 3. Create/show an order confirmation screen with REAL order ID.
      // 4. Navigate to live tracking / confirmation using REAL order ID.
      // =========================================================================
      try {
        confetti({
          particleCount: 85,
          spread: 75,
          origin: { y: 0.6 },
        });
      } catch {}

      clearCart();
      setIsProcessingOrder(false);
      setDevErrorInfo(null);

      showToast({
        type: 'success',
        title: 'Order Placed Successfully',
        message: `Order #${orderId ? String(orderId).slice(-6).toUpperCase() : ''} registered in Firestore!`,
        duration: 5000,
      });

      // Navigate with the REAL order ID
      onOrderPlaced(orderId);
    };

    // Execute Cash on Delivery order creation directly
    await executeOrderCreation();
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-12 max-w-md w-full text-center border border-stone-200 shadow-sm">
          <div className="w-20 h-20 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-black font-heading text-stone-900">Your Cart is Empty</h2>
          <p className="text-xs text-stone-500 mt-2 leading-relaxed">
            Good food is always cooking! Explore our top-rated restaurants and add delicious dishes to your order.
          </p>
          <button
            onClick={() => onOpenRestaurant('rest-1')}
            className="mt-6 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shadow-md shadow-orange-600/20 transition"
          >
            Explore Menus
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-28 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">
            Secure Checkout
          </span>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-stone-900 tracking-tight mt-0.5">
            Review Your Order & Delivery
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Order Items & Delivery Address */}
          <div className="lg:col-span-7 space-y-6">
            {/* Restaurant Banner & Items Card */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Ordering From
                  </span>
                  <h2 className="text-lg font-black font-heading text-stone-900 mt-0.5">
                    {restaurantName}
                  </h2>
                </div>
                {restaurantId && (
                  <button
                    onClick={() => onOpenRestaurant(restaurantId)}
                    className="text-xs font-bold text-orange-600 hover:underline"
                  >
                    + Add More Dishes
                  </button>
                )}
              </div>

              {/* Items List */}
              <div className="divide-y divide-stone-100 mt-2">
                {items.map(({ food, quantity }) => (
                  <div key={food.foodId} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={food.image}
                        alt={food.name}
                        className="w-16 h-16 rounded-2xl object-cover border border-stone-200 flex-shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`w-3 h-3 border rounded-xs flex items-center justify-center ${
                              food.foodType === 'veg' ? 'border-emerald-600' : 'border-rose-600'
                            }`}
                          >
                            <div
                              className={`w-1 h-1 rounded-full ${
                                food.foodType === 'veg' ? 'bg-emerald-600' : 'bg-rose-600'
                              }`}
                            />
                          </div>
                          <h4 className="text-xs font-bold text-stone-900 line-clamp-1">
                            {food.name}
                          </h4>
                        </div>
                        <p className="text-xs font-extrabold text-stone-700 mt-1">
                          ₹{(food.discountPrice || food.price) * quantity}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Quantity Selector */}
                      <div className="flex items-center bg-stone-100 rounded-xl border border-stone-200">
                        <button
                          onClick={() => updateQuantity(food.foodId, quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-stone-600 hover:text-black transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-mono text-xs font-bold text-stone-800">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(food.foodId, quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-stone-600 hover:text-black transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(food.foodId)}
                        className="text-stone-400 hover:text-rose-600 p-1.5 transition"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Address Card */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-orange-600" />
                  <h3 className="text-base font-bold text-stone-900">Delivery Address</h3>
                </div>
                <button
                  onClick={() => setIsAddingAddress(!isAddingAddress)}
                  className="text-xs font-bold text-orange-600 hover:underline"
                >
                  {isAddingAddress ? 'Cancel' : '+ Add New Address'}
                </button>
              </div>

              {isAddingAddress ? (
                <form onSubmit={handleSaveNewAddress} className="mt-4 space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                        Contact Name
                      </label>
                      <input
                        type="text"
                        value={newAddr.name}
                        onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={newAddr.phone}
                        onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                      Complete Address (House/Flat, Street, Area)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 501 Maple Crest, Sector 45"
                      value={newAddr.address}
                      onChange={(e) => setNewAddr({ ...newAddr, address: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={newAddr.city}
                        onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                        Pincode
                      </label>
                      <input
                        type="text"
                        value={newAddr.pincode}
                        onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                        Tag
                      </label>
                      <select
                        value={newAddr.tag}
                        onChange={(e: any) => setNewAddr({ ...newAddr, tag: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 outline-none bg-white font-medium"
                      >
                        <option value="Home">Home</option>
                        <option value="Work">Work</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-stone-900 text-white text-xs font-bold rounded-xl hover:bg-black transition"
                  >
                    Save & Deliver Here
                  </button>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  {savedAddresses.map((addr, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedAddressIndex(idx)}
                      className={`p-4 rounded-2xl border cursor-pointer transition relative ${
                        selectedAddressIndex === idx
                          ? 'border-orange-600 bg-orange-50/50 shadow-xs ring-2 ring-orange-600/10'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-2 py-0.5 bg-stone-200 text-stone-700 text-[10px] font-bold uppercase rounded-md">
                          {addr.tag}
                        </span>
                        {selectedAddressIndex === idx && (
                          <div className="w-4 h-4 rounded-full bg-orange-600 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-bold text-stone-900">{addr.name}</p>
                      <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                        {addr.address}, {addr.city} - {addr.pincode}
                      </p>
                      <p className="text-[11px] text-stone-500 mt-1 font-mono">{addr.phone}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
              <div className="flex items-center gap-2 pb-4 border-b border-stone-100">
                <Banknote className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-stone-900">Payment Method</h3>
              </div>

              <div className="mt-4">
                <div className="p-4 rounded-2xl border-2 border-emerald-600 bg-emerald-50/40 shadow-xs flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-stone-900">Cash on Delivery (COD)</h4>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                          Active
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 mt-1 leading-snug">
                        Pay with cash or scan UPI QR code upon doorstep arrival. No advance online payment required.
                      </p>
                    </div>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bill Breakdown & Coupon Application */}
          <div className="lg:col-span-5 space-y-6 sticky top-22">
            {/* Coupon Card */}
            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-orange-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                  Offers & Coupons
                </h4>
              </div>

              {appliedCoupon ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-900">
                      {appliedCoupon.code} APPLIED
                    </span>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      You saved ₹{discount} on this feast!
                    </p>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-xs font-bold text-rose-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code (FOODIE50)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="flex-1 px-3.5 py-2 text-xs font-mono font-bold uppercase bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl transition"
                  >
                    Apply
                  </button>
                </form>
              )}
            </div>

            {/* Bill Summary Card */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-md">
              <h3 className="text-base font-black font-heading text-stone-900 pb-3 border-b border-stone-100">
                Order Bill Summary
              </h3>

              <div className="space-y-3 py-4 text-xs text-stone-600 border-b border-stone-100">
                <div className="flex justify-between">
                  <span>Item Subtotal</span>
                  <span className="font-semibold text-stone-900">₹{subtotal}</span>
                </div>

                <div className="flex justify-between">
                  <span>Delivery Fee (Thermal Bag)</span>
                  <span className="font-semibold text-stone-900">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-600 font-bold uppercase text-[10px]">
                        FREE (Feast &gt; ₹500)
                      </span>
                    ) : (
                      `₹${deliveryFee}`
                    )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>GST & Restaurant Taxes (5%)</span>
                  <span className="font-semibold text-stone-900">₹{tax}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Coupon Savings</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
              </div>

              {/* Grand Total */}
              <div className="py-4 flex items-baseline justify-between">
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-wider text-stone-400">
                    To Pay
                  </span>
                  <p className="text-2xl font-black text-stone-900 font-heading">₹{grandTotal}</p>
                </div>
                <div className="text-right text-[11px] text-stone-500">
                  <span>Inclusive of all taxes</span>
                </div>
              </div>

              {/* Order Placement Notice */}
              {devErrorInfo && (
                <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs space-y-1.5 animate-shake">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-800 flex items-center gap-1.5 text-xs">
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      Unable to Complete Order
                    </span>
                    <button
                      onClick={() => setDevErrorInfo(null)}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-900 cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                  <p className="text-stone-700 leading-snug">{devErrorInfo.message}</p>
                </div>
              )}

              {/* Place Order CTA */}
              <button
                onClick={handlePlaceOrder}
                disabled={isProcessingOrder}
                className="w-full py-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-orange-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessingOrder ? (
                  <span>Creating Order in Firestore...</span>
                ) : (
                  <>
                    <span>Confirm COD Order • ₹{grandTotal}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-stone-400 text-center">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>256-bit Encrypted Checkout • Safe & Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
