import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Restaurant, FoodItem, Order, Review, OrderStatus } from '../../types';
import { db, auth } from '../../lib/firebase';
import { doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { normalizeOrderStatus } from '../../utils/orderStatus';
import {
  Store,
  UtensilsCrossed,
  ShoppingBag,
  TrendingUp,
  Star,
  Clock,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  AlertCircle,
  MapPin,
  Phone,
  BarChart3,
  Calendar,
  Save,
  Check,
  ChevronRight,
  ShieldAlert,
  Bell,
  Link2,
  Globe,
  Smartphone,
} from 'lucide-react';

interface SellerDashboardProps {
  restaurants: Restaurant[];
  foodItems: FoodItem[];
  orders: Order[];
  reviews: Review[];
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  restaurants,
  foodItems,
  orders,
  reviews,
}) => {
  const {
    userProfile,
    currentUser,
    isSellerApproved,
    authProviderType,
    linkGoogleAccount,
    logout,
  } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'orders' | 'restaurant' | 'menu' | 'add_food' | 'sales' | 'analytics' | 'reviews' | 'profile' | 'notifications'
  >('overview');
  const [isLinkingSellerGoogle, setIsLinkingSellerGoogle] = useState(false);

  const handleSellerLinkGoogle = async () => {
    setIsLinkingSellerGoogle(true);
    const res = await linkGoogleAccount();
    setIsLinkingSellerGoogle(false);
    if (res.success) {
      showToast({
        type: 'success',
        title: 'Google Provider Linked!',
        message: 'Your Google account has been linked while keeping your verified mobile number.',
      });
    } else {
      showToast({
        type: 'error',
        title: 'Linking Failed',
        message: res.error || 'Could not link Google account.',
      });
    }
  };

  // Match restaurant for this seller
  const sellerRestaurant =
    restaurants.find((r) => r.sellerId === userProfile?.uid) || restaurants[0];
  const restaurantId = sellerRestaurant?.restaurantId || 'rest-1';

  // Seller orders and foods - strictly isolate to this seller
  const sellerOrders = orders.filter((o) => {
    if (userProfile?.uid) {
      return o.sellerId === userProfile.uid || (userProfile.restaurantId && o.restaurantId === userProfile.restaurantId);
    }
    return o.restaurantId === restaurantId;
  });

  const [newSellerOrderAlert, setNewSellerOrderAlert] = useState<Order | null>(null);
  const prevSellerOrdersCount = useRef(sellerOrders.length);

  useEffect(() => {
    if (sellerOrders.length > prevSellerOrdersCount.current) {
      const latestOrder = sellerOrders[0];
      if (latestOrder) {
        setNewSellerOrderAlert(latestOrder);
        showToast({
          type: 'success',
          title: 'New Kitchen Order Received!',
          message: `Order #${latestOrder?.orderId ? latestOrder.orderId.slice(-6).toUpperCase() : ''} by ${latestOrder?.customerName || 'Customer'} (₹${latestOrder?.total || 0})`,
          duration: 7000,
        });
      }
    }
    prevSellerOrdersCount.current = sellerOrders.length;
  }, [sellerOrders, showToast]);

  const sellerFoods = foodItems.filter(
    (f) => f.restaurantId === restaurantId || (userProfile?.uid && f.sellerId === userProfile.uid)
  );
  const sellerReviews = reviews.filter((r) => r.restaurantId === restaurantId);

  // KPIs
  const todayOrders = sellerOrders.filter(
    (o) => new Date(o.createdAt).toDateString() === new Date().toDateString()
  );
  const pendingOrders = sellerOrders.filter((o) => {
    const s = normalizeOrderStatus(o.orderStatus);
    return s !== 'DELIVERED' && s !== 'CANCELLED';
  });
  const completedOrders = sellerOrders.filter(
    (o) => normalizeOrderStatus(o.orderStatus) === 'DELIVERED'
  );

  const totalSales = sellerOrders
    .filter((o) => normalizeOrderStatus(o.orderStatus) !== 'CANCELLED')
    .reduce((sum, o) => sum + o.total, 0);

  const todaySales = todayOrders
    .filter((o) => normalizeOrderStatus(o.orderStatus) !== 'CANCELLED')
    .reduce((sum, o) => sum + o.total, 0);

  // Food Form State
  const [isEditingFood, setIsEditingFood] = useState(false);
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [foodFormData, setFoodFormData] = useState({
    name: '',
    description: '',
    price: 299,
    discountPrice: 249,
    image: '',
    category: 'Biryani',
    foodType: 'non-veg' as 'veg' | 'non-veg',
    availability: 'active' as 'active' | 'inactive' | 'out_of_stock',
    isBestseller: false,
  });

  // Restaurant Edit State
  const [restFormData, setRestFormData] = useState({
    name: sellerRestaurant?.name || '',
    description: sellerRestaurant?.description || '',
    address: sellerRestaurant?.address || '',
    phone: sellerRestaurant?.phone || '',
    openingHours: sellerRestaurant?.openingHours || '10:00 AM - 11:00 PM',
    deliveryTime: sellerRestaurant?.deliveryTime || '25-35 min',
    minOrder: sellerRestaurant?.minOrder || 199,
    status: sellerRestaurant?.status || 'open',
    coverImage: sellerRestaurant?.coverImage || '',
    logo: sellerRestaurant?.logo || '',
  });

  // If seller status is pending, show required Pending Approval Screen
  if (userProfile?.role === 'seller' && userProfile?.status === 'pending') {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-lg w-full text-center border border-amber-200 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-black uppercase tracking-wider">
            Status: Pending Admin Approval
          </span>
          <h2 className="text-2xl font-black font-heading text-stone-900">
            Application Under Review
          </h2>
          <p className="text-xs text-stone-600 leading-relaxed">
            Welcome to FoodieHub Partner Network! Your restaurant registration has been submitted and is currently being reviewed by platform administration.
          </p>
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-stone-500">Owner Name:</span>
              <span className="font-bold text-stone-800">{userProfile.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Verified Mobile:</span>
              <span className="font-bold text-stone-800">
                {auth.currentUser?.phoneNumber ||
                  (userProfile?.uid?.startsWith('seller_') && userProfile.phone
                    ? userProfile.phone
                    : 'Phone number not added')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Security Rule:</span>
              <span className="text-emerald-700 font-semibold">Active selling locked until verified</span>
            </div>
          </div>
          <div className="pt-2 flex gap-3">
            <button
              onClick={logout}
              className="flex-1 py-2.5 bg-stone-100 hover:bg-rose-50 hover:text-rose-600 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle Order Status Workflow
  const handleUpdateOrderStatus = async (rawOrderId: string | undefined, newStatus: OrderStatus) => {
    const orderId = rawOrderId;
    if (!orderId || typeof orderId !== 'string') return;
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        orderStatus: newStatus,
        updatedAt: new Date().toISOString(),
      });
      showToast({
        type: 'success',
        title: 'Status Updated',
        message: `Order #${orderId.length > 6 ? orderId.slice(-6) : orderId} transitioned to ${newStatus}.`,
      });
    } catch (err) {
      console.warn('Firestore update error:', err);
    }
  };

  // Handle Food Save / Add
  const handleSaveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    const foodId = editingFoodId || 'food_' + Date.now().toString(36);
    const newFood: FoodItem = {
      foodId,
      restaurantId,
      sellerId: userProfile?.uid || 'seller-demo-1',
      name: foodFormData.name,
      description: foodFormData.description,
      price: Number(foodFormData.price),
      discountPrice: foodFormData.discountPrice ? Number(foodFormData.discountPrice) : undefined,
      image:
        foodFormData.image ||
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
      category: foodFormData.category,
      foodType: foodFormData.foodType,
      availability: foodFormData.availability,
      isBestseller: foodFormData.isBestseller,
      rating: 4.8,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'foodItems', foodId), newFood);
      showToast({
        type: 'success',
        title: editingFoodId ? 'Dish Updated' : 'New Dish Added',
        message: `${newFood.name} is now updated in your kitchen menu.`,
      });
    } catch (err) {
      console.warn('Food save error:', err);
    }

    setIsEditingFood(false);
    setEditingFoodId(null);
  };

  const handleDeleteFood = async (foodId: string) => {
    if (confirm('Delete this food item from your restaurant catalog?')) {
      try {
        await deleteDoc(doc(db, 'foodItems', foodId));
        showToast({ type: 'info', title: 'Food Deleted' });
      } catch (err) {
        console.warn('Food delete error:', err);
      }
    }
  };

  const handleSaveRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const restRef = doc(db, 'restaurants', restaurantId);
      await updateDoc(restRef, restFormData as any);
      showToast({ type: 'success', title: 'Restaurant Details Saved' });
    } catch (err) {
      console.warn('Restaurant update error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row pb-24 md:pb-0">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-stone-900 text-stone-300 p-5 flex flex-col justify-between flex-shrink-0">
        <div>
          {/* Brand & Restaurant header */}
          <div className="flex items-center gap-3 pb-6 border-b border-stone-800">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black">
              <Store className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h2 className="text-sm font-black text-white truncate">
                {sellerRestaurant?.name || 'My Restaurant'}
              </h2>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                Seller Partner Portal
              </span>
            </div>
          </div>

          {/* Navigation Links as requested in Section 3 */}
          <nav className="mt-6 space-y-1">
            {[
              { id: 'overview', label: 'Dashboard', icon: BarChart3 },
              { id: 'orders', label: `Orders (${pendingOrders.length})`, icon: ShoppingBag },
              { id: 'restaurant', label: 'Restaurant', icon: Store },
              { id: 'menu', label: `Food / Menu (${sellerFoods.length})`, icon: UtensilsCrossed },
              { id: 'add_food', label: 'Add Food', icon: Plus },
              { id: 'sales', label: 'Sales', icon: TrendingUp },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'reviews', label: `Reviews (${sellerReviews.length})`, icon: Star },
              { id: 'profile', label: 'Profile', icon: Store },
              { id: 'notifications', label: 'Notifications', icon: Clock },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
                      : 'text-stone-400 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Seller Logout */}
        <div className="pt-6 border-t border-stone-800">
          <button
            onClick={logout}
            className="w-full py-2 px-3 rounded-xl bg-stone-800 hover:bg-rose-950 hover:text-rose-200 text-stone-400 text-xs font-bold transition flex items-center justify-between"
          >
            <span>Sign Out</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Real-time Incoming Order Alert for Kitchen */}
        {newSellerOrderAlert && (
          <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white p-4 sm:p-5 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-2 border-amber-300 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center font-black flex-shrink-0">
                <Bell className="w-6 h-6 text-white animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-white text-orange-800 text-[10px] font-black uppercase tracking-wider">
                    New Kitchen Order Received
                  </span>
                  <span className="font-mono text-xs font-black">
                    #{newSellerOrderAlert?.orderId ? newSellerOrderAlert.orderId.slice(-8).toUpperCase() : ''}
                  </span>
                </div>
                <p className="text-xs text-orange-100 mt-1">
                  Customer: <span className="font-bold text-white">{newSellerOrderAlert.customerName}</span> • Items:{' '}
                  <span className="font-bold text-white">
                    {newSellerOrderAlert.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                  </span> • Total: <span className="font-bold text-white text-sm">₹{newSellerOrderAlert.total}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  setActiveTab('orders');
                  setNewSellerOrderAlert(null);
                }}
                className="px-3.5 py-2 bg-white text-orange-800 hover:bg-orange-50 font-black text-xs rounded-xl transition cursor-pointer"
              >
                View Orders Pipeline
              </button>
              <button
                onClick={() => {
                  handleUpdateOrderStatus(newSellerOrderAlert.orderId, 'CONFIRMED');
                  setNewSellerOrderAlert(null);
                }}
                className="px-3.5 py-2 bg-stone-900 text-white hover:bg-stone-800 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Accept Order
              </button>
              <button
                onClick={() => setNewSellerOrderAlert(null)}
                className="p-2 text-white/80 hover:text-white transition cursor-pointer"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* 1. OVERVIEW / DASHBOARD HOME */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black font-heading text-stone-900 tracking-tight">
                  Kitchen Dispatch Overview
                </h1>
                <p className="text-xs text-stone-500 mt-0.5">
                  Real-time restaurant sales, active queue, and kitchen ratings
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-bold text-emerald-700">Kitchen Live & Accepting Orders</span>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Today's Sales
                </span>
                <p className="text-2xl font-black text-stone-900 font-heading mt-1">₹{todaySales}</p>
                <span className="text-[10px] text-emerald-600 font-bold">
                  {todayOrders.length} orders today
                </span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Pending Kitchen Orders
                </span>
                <p className="text-2xl font-black text-amber-600 font-heading mt-1">
                  {pendingOrders.length}
                </p>
                <span className="text-[10px] text-stone-500 font-medium">In preparation / transit</span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Total Revenue
                </span>
                <p className="text-2xl font-black text-stone-900 font-heading mt-1">₹{totalSales}</p>
                <span className="text-[10px] text-stone-500 font-medium">
                  {completedOrders.length} completed
                </span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Average Rating
                </span>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                  <span className="text-2xl font-black text-stone-900 font-heading">
                    {sellerRestaurant?.rating || 4.8}
                  </span>
                </div>
                <span className="text-[10px] text-stone-500">
                  {sellerReviews.length} verified diner reviews
                </span>
              </div>
            </div>

            {/* Sales Performance Chart (Visual Vector / CSS Bars) */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-6">
                <div>
                  <h3 className="text-base font-bold text-stone-900">Weekly Revenue Trajectory</h3>
                  <p className="text-xs text-stone-500">Gross food sales over last 7 days</p>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  +18.4% vs last week
                </span>
              </div>

              {/* Bar visualization */}
              <div className="grid grid-cols-7 gap-3 h-44 items-end pt-4">
                {[
                  { day: 'Mon', amount: 2400, height: '40%' },
                  { day: 'Tue', amount: 3100, height: '55%' },
                  { day: 'Wed', amount: 2800, height: '50%' },
                  { day: 'Thu', amount: 4200, height: '70%' },
                  { day: 'Fri', amount: 5600, height: '88%' },
                  { day: 'Sat', amount: 6200, height: '100%' },
                  { day: 'Sun', amount: 5100, height: '82%' },
                ].map((item) => (
                  <div key={item.day} className="flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-mono font-bold text-stone-400 opacity-0 group-hover:opacity-100 transition">
                      ₹{item.amount}
                    </span>
                    <div
                      style={{ height: item.height }}
                      className="w-full bg-gradient-to-t from-amber-500 to-orange-500 rounded-xl group-hover:brightness-110 transition shadow-xs"
                    />
                    <span className="text-[11px] font-bold text-stone-600">{item.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Orders Alert */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <h3 className="text-base font-bold text-stone-900">Active Incoming Orders</h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-orange-600 hover:underline"
                >
                  Open Full Order Queue →
                </button>
              </div>

              <div className="divide-y divide-stone-100 mt-2">
                {pendingOrders.slice(0, 3).map((order, idx) => {
                  const pId = order.orderId || (order as any).id || `pending-ord-${idx}`;
                  return (
                    <div key={pId} className="py-3 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-stone-900">
                          #{pId ? String(pId).slice(-6).toUpperCase() : ''} • {order?.customerName || 'Customer'}
                        </span>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          {(order.items || []).map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-stone-900">₹{order.total}</span>
                        <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-md text-[10px] font-bold uppercase">
                          {order.orderStatus}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 2. LIVE ORDER MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black font-heading text-stone-900 tracking-tight">
                Live Kitchen Orders & Status Pipeline
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                Accept, prepare, and dispatch orders in real-time
              </p>
            </div>

            {sellerOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-xs">
                <ShoppingBag className="w-12 h-12 text-stone-400 mx-auto mb-2" />
                <h3 className="text-base font-bold text-stone-800">No orders received yet</h3>
                <p className="text-xs text-stone-500 mt-1">
                  Place an order from the customer view to see the live restaurant pipeline!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sellerOrders.map((order, idx) => {
                  const sId = order.orderId || (order as any).id || `seller-ord-${idx}`;
                  const normStatus = normalizeOrderStatus(order.orderStatus);

                  return (
                    <div
                      key={sId}
                      className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs flex flex-col justify-between"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-black text-stone-900">
                              #{sId ? String(sId).slice(-6).toUpperCase() : ''}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-800">
                              {normStatus}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 mt-0.5">
                            Customer: <span className="font-bold text-stone-800">{order.customerName}</span> (
                            {order.customerPhone}) •{' '}
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="text-base font-black text-stone-900">₹{order.total}</span>
                          <span className="block text-[10px] text-stone-400 uppercase font-semibold">
                            {order.paymentMethod ? String(order.paymentMethod).toUpperCase() : 'COD'} ({order.paymentStatus || 'pending'})
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="py-3 text-xs">
                        <div className="flex flex-wrap gap-2">
                          {(order.items || []).map((item, itemIdx) => (
                            <span
                              key={item.foodId ? `${item.foodId}-${itemIdx}` : `item-${itemIdx}`}
                              className="px-2.5 py-1 bg-stone-50 rounded-lg border border-stone-200 text-stone-800 font-medium"
                            >
                              {item.quantity}x {item.name} (₹{item.price * item.quantity})
                            </span>
                          ))}
                        </div>
                        <p className="text-[11px] text-stone-500 mt-2 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          Destination: {order.deliveryAddress?.address || order.address?.address}, {order.deliveryAddress?.city || order.address?.city}
                        </p>
                      </div>

                      {/* Status Action Buttons */}
                      <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                          Next Action:
                        </span>

                        <div className="flex flex-wrap items-center gap-2">
                          {normStatus === 'PLACED' && (
                            <>
                              <button
                                onClick={() => handleUpdateOrderStatus(sId, 'CONFIRMED')}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                              >
                                Accept & Confirm Order
                              </button>
                              <button
                                onClick={() => handleUpdateOrderStatus(sId, 'CANCELLED')}
                                className="px-3 py-2 text-rose-600 hover:bg-rose-50 font-bold text-xs rounded-xl transition cursor-pointer"
                              >
                                Reject Order
                              </button>
                            </>
                          )}

                          {normStatus === 'CONFIRMED' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(sId, 'PREPARING')}
                              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                            >
                              Start Cooking (Preparing)
                            </button>
                          )}

                          {normStatus === 'PREPARING' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(sId, 'READY')}
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                            >
                              Mark Ready & Pack
                            </button>
                          )}

                          {normStatus === 'READY' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(sId, 'OUT_FOR_DELIVERY')}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                            >
                              Hand to Rider (Out for Delivery)
                            </button>
                          )}

                          {normStatus === 'OUT_FOR_DELIVERY' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(sId, 'DELIVERED')}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                            >
                              Mark Delivered ✓
                            </button>
                          )}

                          {normStatus === 'DELIVERED' && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Order Delivered</span>
                            </span>
                          )}

                          {normStatus === 'CANCELLED' && (
                            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl">
                              Cancelled
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. MY FOOD (MENU MANAGEMENT) */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black font-heading text-stone-900 tracking-tight">
                  Restaurant Menu Catalog
                </h1>
                <p className="text-xs text-stone-500 mt-0.5">
                  Manage dishes, pricing, discounts, and inventory availability
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingFoodId(null);
                  setFoodFormData({
                    name: '',
                    description: '',
                    price: 299,
                    discountPrice: 249,
                    image: '',
                    category: 'Biryani',
                    foodType: 'non-veg',
                    availability: 'active',
                    isBestseller: false,
                  });
                  setIsEditingFood(true);
                }}
                className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Dish</span>
              </button>
            </div>

            {/* Food Edit / Add Modal */}
            {isEditingFood && (
              <div className="bg-white rounded-3xl p-6 border-2 border-orange-500 shadow-xl mb-6">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                  <h3 className="text-base font-bold text-stone-900">
                    {editingFoodId ? 'Edit Dish' : 'Create New Dish for Menu'}
                  </h3>
                  <button
                    onClick={() => setIsEditingFood(false)}
                    className="text-stone-400 hover:text-stone-600 text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleSaveFood} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                        Dish Name
                      </label>
                      <input
                        type="text"
                        value={foodFormData.name}
                        onChange={(e) => setFoodFormData({ ...foodFormData, name: e.target.value })}
                        required
                        placeholder="e.g. Saffron Dum Biryani"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                        Category
                      </label>
                      <select
                        value={foodFormData.category}
                        onChange={(e) => setFoodFormData({ ...foodFormData, category: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 outline-none bg-white font-medium"
                      >
                        {['Biryani', 'Pizza', 'Burger', 'Indian', 'Chinese', 'South Indian', 'Desserts', 'Beverages', 'Snacks', 'Fast Food'].map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                        Original Price (₹)
                      </label>
                      <input
                        type="number"
                        value={foodFormData.price}
                        onChange={(e) => setFoodFormData({ ...foodFormData, price: Number(e.target.value) })}
                        required
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                        Discount Price (₹)
                      </label>
                      <input
                        type="number"
                        value={foodFormData.discountPrice}
                        onChange={(e) => setFoodFormData({ ...foodFormData, discountPrice: Number(e.target.value) })}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                        Food Type
                      </label>
                      <select
                        value={foodFormData.foodType}
                        onChange={(e: any) => setFoodFormData({ ...foodFormData, foodType: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 outline-none bg-white font-medium"
                      >
                        <option value="veg">Vegetarian (Pure)</option>
                        <option value="non-veg">Non-Vegetarian</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                        Availability
                      </label>
                      <select
                        value={foodFormData.availability}
                        onChange={(e: any) => setFoodFormData({ ...foodFormData, availability: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 outline-none bg-white font-medium"
                      >
                        <option value="active">Active (Available)</option>
                        <option value="inactive">Inactive</option>
                        <option value="out_of_stock">Out of Stock</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                      Dish Image URL
                    </label>
                    <input
                      type="url"
                      value={foodFormData.image}
                      onChange={(e) => setFoodFormData({ ...foodFormData, image: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={foodFormData.description}
                      onChange={(e) => setFoodFormData({ ...foodFormData, description: e.target.value })}
                      required
                      placeholder="Ingredients, preparation technique, portion size..."
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 outline-none resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="bestseller-checkbox"
                      checked={foodFormData.isBestseller}
                      onChange={(e) => setFoodFormData({ ...foodFormData, isBestseller: e.target.checked })}
                      className="rounded text-orange-600"
                    />
                    <label htmlFor="bestseller-checkbox" className="text-xs font-bold text-stone-700 cursor-pointer">
                      Mark as Chef's Bestseller
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingFood(false)}
                      className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md"
                    >
                      Save Dish
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Foods Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sellerFoods.map((food) => (
                <div
                  key={food.foodId}
                  className="bg-white rounded-3xl p-4 border border-stone-200 shadow-xs flex flex-col justify-between"
                >
                  <div className="flex gap-3">
                    <img
                      src={food.image}
                      alt={food.name}
                      className="w-20 h-20 rounded-2xl object-cover border border-stone-200 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-stone-100 text-stone-700">
                          {food.category}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            food.availability === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {food.availability}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-stone-900 mt-1 line-clamp-1">
                        {food.name}
                      </h4>
                      <p className="text-xs font-extrabold text-stone-800 mt-0.5">
                        ₹{food.discountPrice || food.price}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100 mt-3 flex items-center justify-between">
                    <span className="text-[11px] text-stone-400">
                      {food.foodType === 'veg' ? '🟢 Pure Veg' : '🔴 Non-Veg'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingFoodId(food.foodId);
                          setFoodFormData({
                            name: food.name,
                            description: food.description,
                            price: food.price,
                            discountPrice: food.discountPrice || food.price,
                            image: food.image,
                            category: food.category,
                            foodType: food.foodType,
                            availability: food.availability || 'active',
                            isBestseller: !!food.isBestseller,
                          });
                          setIsEditingFood(true);
                        }}
                        className="p-1.5 text-stone-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                        title="Edit Dish"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFood(food.foodId)}
                        className="p-1.5 text-stone-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Dish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. RESTAURANT PROFILE */}
        {activeTab === 'restaurant' && (
          <div className="max-w-3xl space-y-6">
            <div>
              <h1 className="text-2xl font-black font-heading text-stone-900 tracking-tight">
                Restaurant Profile Management
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                Update restaurant branding, opening hours, and delivery minimums
              </p>
            </div>

            <form onSubmit={handleSaveRestaurant} className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Restaurant Name
                  </label>
                  <input
                    type="text"
                    value={restFormData.name}
                    onChange={(e) => setRestFormData({ ...restFormData, name: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 outline-none focus:border-orange-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Status (Open / Closed)
                  </label>
                  <select
                    value={restFormData.status}
                    onChange={(e: any) => setRestFormData({ ...restFormData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 outline-none bg-white font-bold"
                  >
                    <option value="open">Open (Accepting Orders)</option>
                    <option value="closed">Closed for Kitchen Break</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Description / Heritage
                </label>
                <textarea
                  rows={2}
                  value={restFormData.description}
                  onChange={(e) => setRestFormData({ ...restFormData, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={restFormData.phone}
                    onChange={(e) => setRestFormData({ ...restFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Delivery Time
                  </label>
                  <input
                    type="text"
                    value={restFormData.deliveryTime}
                    onChange={(e) => setRestFormData({ ...restFormData, deliveryTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Min Order (₹)
                  </label>
                  <input
                    type="number"
                    value={restFormData.minOrder}
                    onChange={(e) => setRestFormData({ ...restFormData, minOrder: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Physical Address
                </label>
                <input
                  type="text"
                  value={restFormData.address}
                  onChange={(e) => setRestFormData({ ...restFormData, address: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Cover Banner Image URL
                </label>
                <input
                  type="url"
                  value={restFormData.coverImage}
                  onChange={(e) => setRestFormData({ ...restFormData, coverImage: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 outline-none"
                />
              </div>

              <div className="pt-4 border-t border-stone-100 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Restaurant Profile</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 5. REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black font-heading text-stone-900 tracking-tight">
                Verified Customer Reviews
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                Feedback from completed customer deliveries
              </p>
            </div>

            {sellerReviews.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
                <Star className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                <h3 className="text-base font-bold text-stone-800">No reviews yet</h3>
                <p className="text-xs text-stone-500 mt-1">
                  Reviews will appear here as customers complete orders and leave ratings.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sellerReviews.map((rev) => (
                  <div key={rev.reviewId} className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-stone-900">{rev.customerName}</span>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-stone-600 italic leading-relaxed">
                      "{rev.comment}"
                    </p>
                    <span className="text-[10px] text-stone-400 mt-3 block">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 6. ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black font-heading text-stone-900 tracking-tight">
                Sales & Operational Analytics
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                Financial performance, order retention, and popular dishes
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
                  Average Order Value (AOV)
                </h4>
                <p className="text-3xl font-black text-stone-900 font-heading">
                  ₹{completedOrders.length > 0 ? Math.round(totalSales / completedOrders.length) : 340}
                </p>
                <p className="text-xs text-stone-500 mt-2">
                  Based on {completedOrders.length} completed transactions
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
                  Order Fulfillment Rate
                </h4>
                <p className="text-3xl font-black text-emerald-600 font-heading">
                  {sellerOrders.length > 0
                    ? Math.round((completedOrders.length / sellerOrders.length) * 100)
                    : 98}
                  %
                </p>
                <p className="text-xs text-stone-500 mt-2">Low cancellation frequency</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
                  Total Food Dishes
                </h4>
                <p className="text-3xl font-black text-stone-900 font-heading">
                  {sellerFoods.length}
                </p>
                <p className="text-xs text-stone-500 mt-2">Active dishes in online menu</p>
              </div>
            </div>
          </div>
        )}

        {/* 7. ADD FOOD TAB */}
        {activeTab === 'add_food' && (
          <div className="max-w-2xl space-y-6">
            <h1 className="text-2xl font-black font-heading text-stone-900 tracking-tight">
              Add New Dish to {sellerRestaurant?.name}
            </h1>
            <form onSubmit={handleSaveFood} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Saffron Dum Chicken Biryani"
                  value={foodFormData.name}
                  onChange={(e) => setFoodFormData({ ...foodFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 outline-none focus:border-amber-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={foodFormData.price}
                    onChange={(e) => setFoodFormData({ ...foodFormData, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 outline-none focus:border-amber-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Category</label>
                  <select
                    value={foodFormData.category}
                    onChange={(e) => setFoodFormData({ ...foodFormData, category: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 outline-none bg-white font-medium"
                  >
                    {['Biryani', 'Pizza', 'Burger', 'Indian', 'Chinese', 'South Indian', 'Desserts', 'Beverages', 'Snacks', 'Fast Food'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={foodFormData.image}
                  onChange={(e) => setFoodFormData({ ...foodFormData, image: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  value={foodFormData.description}
                  onChange={(e) => setFoodFormData({ ...foodFormData, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  Publish Food Dish
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 8. SALES TAB */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black font-heading text-stone-900 tracking-tight">
              Restaurant Sales Ledger
            </h1>
            <div className="bg-white p-6 rounded-3xl border border-stone-200">
              <span className="text-xs font-bold text-stone-400 uppercase">Gross Kitchen Sales</span>
              <p className="text-3xl font-black text-stone-900 mt-1">₹{totalSales}</p>
              <p className="text-xs text-stone-500 mt-2">
                Net earnings payable (after 10% platform commission): ₹{Math.round(totalSales * 0.9)}
              </p>
            </div>
          </div>
        )}

        {/* 9. PROFILE TAB */}
        {activeTab === 'profile' && (() => {
          const firebaseUser = auth.currentUser || currentUser;
          const isSellerUidVerified = !firebaseUser || !userProfile || userProfile.uid === firebaseUser.uid;
          const actualSellerVerifiedPhone =
            firebaseUser?.phoneNumber ||
            (userProfile?.uid?.startsWith('seller_') ? userProfile.phone : null);
          const hasSellerVerifiedPhone = Boolean(
            actualSellerVerifiedPhone && actualSellerVerifiedPhone.trim().length > 0
          );
          const sellerPhoneDisplay = hasSellerVerifiedPhone
            ? actualSellerVerifiedPhone!
            : 'Phone number not added';

          return (
            <div className="max-w-2xl space-y-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">
                  Partner Credentials
                </span>
                <h1 className="text-2xl font-black font-heading text-stone-900 tracking-tight mt-0.5">
                  Seller Profile
                </h1>
              </div>

              {!isSellerUidVerified && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <p className="text-xs text-rose-800">
                    Security warning: Profile session identifier mismatch detected.
                  </p>
                </div>
              )}

              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 space-y-5 shadow-xs">
                {/* 1. Seller Name */}
                <div>
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-1">
                    Full Name
                  </span>
                  <p className="text-sm font-bold text-stone-900">
                    {userProfile?.name || firebaseUser?.displayName || 'Restaurant Partner'}
                  </p>
                </div>

                {/* 2. Verified Mobile Number */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                      Verified Mobile Number
                    </span>
                    {hasSellerVerifiedPhone ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Verified Phone
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <AlertCircle className="w-3 h-3" /> Not verified
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-sm font-mono ${
                      hasSellerVerifiedPhone ? 'text-stone-900 font-bold' : 'text-stone-400 italic'
                    }`}
                  >
                    {sellerPhoneDisplay}
                  </p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    {hasSellerVerifiedPhone
                      ? 'Primary authentication identifier confirmed via Firebase Phone Authentication.'
                      : 'Google Sign-In does not include a recovery phone number. Mobile number is not verified.'}
                  </p>
                </div>

                {/* 3. Email Address */}
                <div>
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-1">
                    Email Address
                  </span>
                  <p className="text-sm font-medium text-stone-800">
                    {firebaseUser?.email || userProfile?.email || 'No email registered'}
                  </p>
                </div>

                {/* 4. Authentication Provider */}
                <div>
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-1.5">
                    Authentication Provider
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {authProviderType === 'phone_google_linked' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Link2 className="w-3.5 h-3.5" />
                        <span>Phone + Google Linked</span>
                      </span>
                    )}
                    {authProviderType === 'phone' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Phone OTP Verified</span>
                      </span>
                    )}
                    {authProviderType === 'google' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        <Globe className="w-3.5 h-3.5" />
                        <span>Google Account</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Account Linking for Phone OTP sellers */}
                {authProviderType === 'phone' && (
                  <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200">
                    <div className="flex items-start gap-2.5">
                      <Link2 className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-amber-900 block">Link Google Account</span>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          Link your Google provider to this restaurant partner account while retaining your verified phone number.
                        </p>
                        <button
                          type="button"
                          onClick={handleSellerLinkGoogle}
                          disabled={isLinkingSellerGoogle}
                          className="mt-3 py-1.5 px-3.5 bg-white hover:bg-stone-50 border border-amber-300 rounded-xl text-xs font-bold text-amber-900 transition flex items-center gap-2 shadow-xs"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                          </svg>
                          <span>{isLinkingSellerGoogle ? 'Linking...' : 'Link Google Provider'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Restaurant ID & Seller UID */}
                <div className="pt-3 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-0.5">
                      Restaurant ID
                    </span>
                    <p className="text-xs font-mono text-amber-700 font-bold">{restaurantId}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-0.5">
                      Seller Partner UID
                    </span>
                    <p className="text-xs font-mono text-stone-500">
                      {firebaseUser?.uid || userProfile?.uid || 'seller-demo-1'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 10. NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black font-heading text-stone-900 tracking-tight">
              Seller Notifications
            </h1>
            <div className="bg-white p-6 rounded-3xl border border-stone-200 space-y-3">
              <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-900 font-medium">
                ⚡ Kitchen order dispatch listeners active. New customer orders will ring here.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
