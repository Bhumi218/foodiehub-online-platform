import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  UserProfile,
  Restaurant,
  FoodItem,
  Order,
  Review,
  Coupon,
  Complaint,
  AuditLog,
  FoodType,
  FoodPublishStatus,
  normalizeOrderStatus,
} from '../../types';
import { db } from '../../lib/firebase';
import { doc, updateDoc, deleteDoc, setDoc, collection, onSnapshot, getDocs } from 'firebase/firestore';
import {
  ShieldAlert,
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  PlusCircle,
  CheckCircle2,
  Users,
  Store,
  Building,
  CreditCard,
  Tag,
  Star,
  MessageSquare,
  BarChart3,
  Bell,
  UserCheck,
  LogOut,
  Search,
  Filter,
  Eye,
  Edit3,
  Archive,
  Trash2,
  Upload,
  Image as ImageIcon,
  Check,
  X,
  Clock,
  MapPin,
  Phone,
  AlertTriangle,
  Flame,
  Sparkles,
  Bike,
} from 'lucide-react';
import { DeliveryPartner } from '../../types';
import { getDeliveryPartners } from '../../services/deliveryService';
import { AssignDeliveryPartnerModal } from '../../components/admin/AssignDeliveryPartnerModal';
import { DeliveryFleetTab } from '../../components/admin/DeliveryFleetTab';

interface AdminDashboardProps {
  users: UserProfile[];
  restaurants: Restaurant[];
  foodItems: FoodItem[];
  orders: Order[];
  reviews: Review[];
  coupons: Coupon[];
  complaints: Complaint[];
  auditLogs: AuditLog[];
  onRefreshData?: () => void;
}

export type AdminTab =
  | 'dashboard'
  | 'orders'
  | 'delivery_partners'
  | 'food_management'
  | 'add_food'
  | 'published_foods'
  | 'customers'
  | 'sellers'
  | 'restaurants'
  | 'payments'
  | 'coupons'
  | 'reviews'
  | 'complaints'
  | 'analytics'
  | 'notifications'
  | 'profile';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  users,
  restaurants,
  foodItems: initialFoodItems,
  orders: initialOrders,
  reviews,
  coupons,
  complaints,
  auditLogs,
}) => {
  const { userProfile, logout, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // Real-time local state synced with Firestore
  const [foods, setFoods] = useState<FoodItem[]>(initialFoodItems);
  const [adminOrders, setAdminOrders] = useState<Order[]>(() =>
    (initialOrders || []).map((o, idx) => {
      const orderId = o.orderId || (o as any).id || `init-ord-${idx}`;
      return {
        ...o,
        orderId,
        id: (o as any).id || orderId,
      };
    })
  );
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newOrderAlert, setNewOrderAlert] = useState<Order | null>(null);
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>([]);
  const [assignOrder, setAssignOrder] = useState<Order | null>(null);
  const isFirstOrdersSync = React.useRef(true);

  // Load delivery partners fleet on mount
  useEffect(() => {
    getDeliveryPartners().then((data) => setDeliveryPartners(data));
  }, []);

  // Sync initialOrders if updated from parent
  useEffect(() => {
    if (initialOrders && initialOrders.length > 0) {
      setAdminOrders((prev) => {
        if (prev.length === 0) {
          return initialOrders.map((o, idx) => {
            const orderId = o.orderId || (o as any).id || `init-ord-${idx}`;
            return {
              ...o,
              orderId,
              id: (o as any).id || orderId,
            };
          });
        }
        return prev;
      });
    }
  }, [initialOrders]);

  // Sync foods in real-time from Firestore
  useEffect(() => {
    const unsubFoods = onSnapshot(
      collection(db, 'foodItems'),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: data.id || data.foodId || d.id,
              foodId: data.foodId || data.id || d.id,
              name: data.name || '',
              image: data.image || '',
              price: Number(data.price) || 0,
              discountPrice: data.discountPrice ? Number(data.discountPrice) : undefined,
              description: data.description || '',
              category: data.category || 'General',
              cuisine: data.cuisine || data.category || 'Multi-Cuisine',
              foodType: data.foodType || 'veg',
              preparationTime: data.preparationTime || '20-30 min',
              available: data.available !== false,
              availability: data.availability || 'active',
              bestseller: !!data.bestseller || !!data.isBestseller,
              featured: !!data.featured,
              restaurantId: data.restaurantId || 'rest-1',
              restaurantName: data.restaurantName || 'Partner Kitchen',
              status: (data.status as FoodPublishStatus) || 'published',
              tags: data.tags || [],
              createdBy: data.createdBy || 'admin',
              rating: data.rating || 4.8,
              ratingCount: data.ratingCount || 10,
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || new Date().toISOString(),
            } as FoodItem;
          });
          setFoods(list);
        }
      },
      (err) => console.warn('Admin foods listener fallback:', err.message)
    );

    // Sync orders in real-time from Firestore
    const unsubOrders = onSnapshot(
      collection(db, 'orders'),
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data() as Order;
          const orderId = data.orderId || (data as any).id || d.id;
          return {
            ...data,
            orderId,
            id: (data as any).id || orderId,
          } as Order;
        });
        // Sort newest first
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAdminOrders(list);

        // Detect real-time newly created orders
        if (isFirstOrdersSync.current) {
          isFirstOrdersSync.current = false;
        } else {
          snap.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const data = change.doc.data() as Order;
              const orderId = data.orderId || (data as any).id || change.doc.id;
              const newOrd: Order = {
                ...data,
                orderId,
                id: (data as any).id || orderId,
              };
              setNewOrderAlert(newOrd);
              showToast({
                type: 'success',
                title: 'New Order Received',
                message: `Order #${newOrd.orderId ? newOrd.orderId.slice(-6).toUpperCase() : ''} by ${newOrd.customerName || 'Customer'} (₹${newOrd.total || 0})`,
                duration: 8000,
              });
            }
          });
        }
      },
      (err) => console.warn('Admin orders listener fallback:', err.message)
    );

    return () => {
      unsubFoods();
      unsubOrders();
    };
  }, []);

  // Filter queries
  const [foodSearch, setFoodSearch] = useState('');
  const [foodCategoryFilter, setFoodCategoryFilter] = useState('All');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');

  // Add / Edit Food Form State
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [foodFormData, setFoodFormData] = useState({
    name: '',
    image: '',
    price: '',
    discountPrice: '',
    description: '',
    category: 'Biryani',
    cuisine: 'North Indian',
    foodType: 'non-veg' as FoodType,
    preparationTime: '25-35 min',
    available: true,
    bestseller: false,
    featured: false,
    restaurantId: 'rest-1',
    restaurantName: 'The Royal Biryani Durbar',
    tags: 'Spicy, Signature, Slow Cooked',
    status: 'published' as FoodPublishStatus,
  });

  // Complaint reply state
  const [replyingComplaintId, setReplyingComplaintId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Handle Image File Upload (converts to base64 Data URL)
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast({ type: 'error', title: 'File too large', message: 'Image must be under 5MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          setFoodFormData((prev) => ({ ...prev, image: result }));
          showToast({ type: 'success', title: 'Image Uploaded', message: 'Food image ready.' });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Add / Edit Food
  const handleSaveFoodForm = async (targetStatus: FoodPublishStatus = 'published') => {
    if (!foodFormData.name.trim() || !foodFormData.price) {
      showToast({ type: 'error', title: 'Missing required fields', message: 'Please provide food name and price.' });
      return;
    }

    const docId = editingFoodId || 'food_' + Date.now().toString(36);
    const selectedRest = restaurants.find((r) => r.restaurantId === foodFormData.restaurantId);
    const restName = selectedRest?.name || foodFormData.restaurantName || 'Partner Kitchen';

    const foodDoc: FoodItem = {
      id: docId,
      foodId: docId,
      name: foodFormData.name.trim(),
      image:
        foodFormData.image.trim() ||
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
      price: Number(foodFormData.price),
      discountPrice: foodFormData.discountPrice ? Number(foodFormData.discountPrice) : undefined,
      description: foodFormData.description.trim() || 'Prepared fresh with signature ingredients.',
      category: foodFormData.category,
      cuisine: foodFormData.cuisine,
      foodType: foodFormData.foodType,
      preparationTime: foodFormData.preparationTime,
      available: foodFormData.available,
      availability: foodFormData.available ? 'active' : 'inactive',
      bestseller: foodFormData.bestseller,
      isBestseller: foodFormData.bestseller,
      featured: foodFormData.featured,
      restaurantId: foodFormData.restaurantId,
      restaurantName: restName,
      status: targetStatus,
      tags: foodFormData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      createdBy: userProfile?.uid || 'admin',
      rating: 4.9,
      ratingCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'foodItems', docId), foodDoc, { merge: true });
      showToast({
        type: 'success',
        title: targetStatus === 'published' ? 'Food Published!' : 'Draft Saved',
        message: `${foodDoc.name} is now ${targetStatus} and saved to Firestore.`,
      });
      // Reset form
      setFoodFormData({
        name: '',
        image: '',
        price: '',
        discountPrice: '',
        description: '',
        category: 'Biryani',
        cuisine: 'North Indian',
        foodType: 'non-veg',
        preparationTime: '25-35 min',
        available: true,
        bestseller: false,
        featured: false,
        restaurantId: 'rest-1',
        restaurantName: 'The Royal Biryani Durbar',
        tags: 'Spicy, Signature',
        status: 'published',
      });
      setEditingFoodId(null);
      setActiveTab('published_foods');
    } catch (err: any) {
      console.error('Error saving food to Firestore:', err);
      showToast({ type: 'error', title: 'Save Failed', message: err?.message || 'Error writing to Firestore' });
    }
  };

  // Change Food Status (Publish, Unpublish, Archive)
  const handleChangeFoodStatus = async (foodId: string, newStatus: FoodPublishStatus) => {
    try {
      await updateDoc(doc(db, 'foodItems', foodId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      showToast({
        type: 'success',
        title: 'Status Updated',
        message: `Dish set to ${newStatus}.`,
      });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Update failed', message: err?.message });
    }
  };

  // Toggle Food Availability
  const handleToggleFoodAvailability = async (foodId: string, currentAvailable: boolean) => {
    try {
      await updateDoc(doc(db, 'foodItems', foodId), {
        available: !currentAvailable,
        availability: !currentAvailable ? 'active' : 'out_of_stock',
        updatedAt: new Date().toISOString(),
      });
      showToast({
        type: 'info',
        title: 'Availability Toggled',
        message: `Dish is now ${!currentAvailable ? 'Available' : 'Out of Stock'}.`,
      });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Toggle failed', message: err?.message });
    }
  };

  // Delete Food
  const handleDeleteFood = async (foodId: string) => {
    if (confirm('Permanently delete this food dish from FoodieHub?')) {
      try {
        await deleteDoc(doc(db, 'foodItems', foodId));
        showToast({ type: 'info', title: 'Food Deleted', message: 'Item removed from database.' });
      } catch (err: any) {
        showToast({ type: 'error', title: 'Delete failed', message: err?.message });
      }
    }
  };

  // Populate form to Edit
  const handleStartEditFood = (food: FoodItem) => {
    setEditingFoodId(food.id || food.foodId);
    setFoodFormData({
      name: food.name,
      image: food.image,
      price: String(food.price),
      discountPrice: food.discountPrice ? String(food.discountPrice) : '',
      description: food.description,
      category: food.category,
      cuisine: food.cuisine || food.category,
      foodType: food.foodType,
      preparationTime: food.preparationTime || '20-30 min',
      available: food.available !== false,
      bestseller: !!food.bestseller || !!food.isBestseller,
      featured: !!food.featured,
      restaurantId: food.restaurantId,
      restaurantName: food.restaurantName || '',
      tags: (food.tags || []).join(', '),
      status: food.status || 'published',
    });
    setActiveTab('add_food');
  };

  // Update Order Status in Firestore (Real-Time Propagation)
  const handleAdminUpdateOrderStatus = async (
    rawOrderId: string | undefined,
    newStatus: 'PLACED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED'
  ) => {
    const orderId = rawOrderId || selectedOrder?.orderId || (selectedOrder as any)?.id;
    if (!orderId || typeof orderId !== 'string' || !orderId.trim()) {
      console.error('Order status update error: Missing valid orderId', { rawOrderId, selectedOrder });
      showToast({ type: 'error', title: 'Update failed', message: 'Order ID is missing.' });
      return;
    }

    try {
      const now = new Date().toISOString();
      await updateDoc(doc(db, 'orders', orderId), {
        orderStatus: newStatus,
        updatedAt: now,
      });

      // Update local state immediately for instant responsive UI
      setAdminOrders((prev) =>
        prev.map((ord) =>
          ord.orderId === orderId || (ord as any).id === orderId
            ? { ...ord, orderStatus: newStatus, updatedAt: now }
            : ord
        )
      );

      // Update selected modal if open
      if (selectedOrder && (selectedOrder.orderId === orderId || (selectedOrder as any).id === orderId)) {
        setSelectedOrder((prev) => (prev ? { ...prev, orderStatus: newStatus, updatedAt: now } : null));
      }

      showToast({
        type: 'success',
        title: 'Order Status Updated',
        message: `Order #${String(orderId).slice(-6).toUpperCase()} transitioned to ${newStatus}. Customer will see it in real-time.`,
      });
    } catch (err: any) {
      console.error('Order status update error:', err);
      showToast({ type: 'error', title: 'Update failed', message: err?.message || 'Failed to update order status' });
    }
  };

  // KPIs
  const totalRevenue = adminOrders
    .filter((o) => normalizeOrderStatus(o.orderStatus) !== 'CANCELLED')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const pendingOrdersCount = adminOrders.filter(
    (o) =>
      normalizeOrderStatus(o.orderStatus) !== 'DELIVERED' &&
      normalizeOrderStatus(o.orderStatus) !== 'CANCELLED'
  ).length;

  const completedOrdersCount = adminOrders.filter(
    (o) => normalizeOrderStatus(o.orderStatus) === 'DELIVERED'
  ).length;

  const publishedFoodsCount = foods.filter((f) => f.status === 'published').length;
  const customersCount = users.filter((u) => u.role === 'customer').length;
  const sellersCount = users.filter((u) => u.role === 'seller').length;

  // Filtered Foods
  const filteredFoods = foods.filter((f) => {
    if (activeTab === 'published_foods' && f.status !== 'published') return false;
    if (foodCategoryFilter !== 'All' && f.category !== foodCategoryFilter) return false;
    if (foodSearch.trim()) {
      const q = foodSearch.toLowerCase();
      return (
        (f.name || '').toLowerCase().includes(q) ||
        (f.category || '').toLowerCase().includes(q) ||
        (f.restaurantName && f.restaurantName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Filtered Orders
  const filteredOrders = adminOrders.filter((o) => {
    const norm = normalizeOrderStatus(o.orderStatus);
    if (orderStatusFilter !== 'ALL' && norm !== orderStatusFilter) return false;
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      const oid = String(o.orderId || (o as any).id || '').toLowerCase();
      const cname = String(o.customerName || '').toLowerCase();
      const cphone = String(o.customerPhone || '');
      const rname = String(o.restaurantName || '').toLowerCase();
      return (
        oid.includes(q) ||
        cname.includes(q) ||
        cphone.includes(q) ||
        rname.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row antialiased font-sans text-stone-900">
      {/* 1. ADMIN EXCLUSIVE SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-stone-950 text-stone-300 flex flex-col justify-between flex-shrink-0 border-r border-stone-800">
        <div>
          {/* Top Admin Branding */}
          <div className="p-5 border-b border-stone-800/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/40">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-black text-white tracking-tight leading-tight">
                FoodieHub Admin
              </h2>
              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block mt-0.5">
                Authorized Master
              </span>
            </div>
          </div>

          {/* Quick Add Food Button */}
          <div className="p-3">
            <button
              onClick={() => {
                setEditingFoodId(null);
                setActiveTab('add_food');
              }}
              className="w-full py-2.5 px-3.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add New Food</span>
            </button>
          </div>

          {/* Full Required Admin Navigation */}
          <nav className="px-2 py-1 space-y-0.5 max-h-[calc(100vh-210px)] overflow-y-auto scrollbar-none">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              {
                id: 'orders',
                label: `Orders (${adminOrders.length})`,
                icon: ShoppingBag,
                badge: pendingOrdersCount > 0 ? String(pendingOrdersCount) : undefined,
              },
              {
                id: 'delivery_partners',
                label: `Delivery Fleet (${deliveryPartners.length})`,
                icon: Bike,
              },
              { id: 'food_management', label: 'Food Management', icon: UtensilsCrossed },
              { id: 'add_food', label: 'Add Food', icon: PlusCircle },
              { id: 'published_foods', label: `Published Foods (${publishedFoodsCount})`, icon: CheckCircle2 },
              { id: 'customers', label: `Customers (${customersCount})`, icon: Users },
              { id: 'sellers', label: `Sellers (${sellersCount})`, icon: Store },
              { id: 'restaurants', label: `Restaurants (${restaurants.length})`, icon: Building },
              { id: 'payments', label: 'Payments', icon: CreditCard },
              { id: 'coupons', label: `Coupons (${coupons.length})`, icon: Tag },
              { id: 'reviews', label: `Reviews (${reviews.length})`, icon: Star },
              { id: 'complaints', label: `Complaints (${complaints.length})`, icon: MessageSquare },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'profile', label: 'Admin Profile', icon: UserCheck },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as AdminTab)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-md font-extrabold'
                      : 'text-stone-400 hover:text-white hover:bg-stone-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-orange-600 text-white animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Admin Footer & Logout */}
        <div className="p-4 border-t border-stone-800/80 bg-stone-950">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-purple-900/60 border border-purple-500/50 flex items-center justify-center text-xs font-black text-purple-300">
              AD
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Administrator</p>
              <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Master Console</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full py-2 px-3 bg-stone-900 hover:bg-rose-950 hover:text-rose-300 text-stone-400 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. ADMIN MAIN VIEWPORT */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Real-time New Order Notification Banner */}
        {newOrderAlert && (
          <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white p-4 sm:p-5 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-2 border-amber-300 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center font-black flex-shrink-0">
                <Bell className="w-6 h-6 text-white animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-white text-orange-800 text-[10px] font-black uppercase tracking-wider">
                    New Order Received
                  </span>
                  <span className="font-mono text-xs font-black">
                    #{newOrderAlert?.orderId ? newOrderAlert.orderId.slice(-8).toUpperCase() : ''}
                  </span>
                </div>
                <p className="text-xs text-orange-100 mt-1">
                  Customer: <span className="font-bold text-white">{newOrderAlert.customerName}</span> ({newOrderAlert.customerPhone}) • Kitchen:{' '}
                  <span className="font-bold text-white">{newOrderAlert.restaurantName}</span> • Total:{' '}
                  <span className="font-bold text-white text-sm">₹{newOrderAlert.total}</span> • Time:{' '}
                  {new Date(newOrderAlert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  setSelectedOrder(newOrderAlert);
                  setActiveTab('orders');
                  setNewOrderAlert(null);
                }}
                className="px-3.5 py-2 bg-white text-orange-800 hover:bg-orange-50 font-black text-xs rounded-xl transition cursor-pointer"
              >
                View Order
              </button>
              <button
                onClick={() => {
                  handleAdminUpdateOrderStatus(newOrderAlert.orderId || (newOrderAlert as any).id, 'CONFIRMED');
                  setNewOrderAlert(null);
                }}
                className="px-3.5 py-2 bg-stone-900 text-white hover:bg-stone-800 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Confirm Order
              </button>
              <button
                onClick={() => setNewOrderAlert(null)}
                className="p-2 text-white/80 hover:text-white transition cursor-pointer"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* ===================== TAB: DASHBOARD ===================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-900 text-[10px] font-black uppercase tracking-wider">
                  Platform Command Center
                </span>
                <h1 className="text-2xl sm:text-3xl font-black font-heading text-stone-900 tracking-tight mt-1">
                  FoodieHub Overview
                </h1>
              </div>
              <button
                onClick={() => setActiveTab('add_food')}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Add Food</span>
              </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Total Platform Orders
                </span>
                <p className="text-3xl font-black text-stone-900 font-heading mt-1">
                  {adminOrders.length}
                </p>
                <span className="text-[11px] text-stone-500 font-medium">
                  {completedOrdersCount} delivered successfully
                </span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Pending Live Orders
                </span>
                <p className="text-3xl font-black text-orange-600 font-heading mt-1">
                  {pendingOrdersCount}
                </p>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-[11px] text-orange-600 font-bold hover:underline"
                >
                  Manage active orders →
                </button>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Total Gross Revenue
                </span>
                <p className="text-3xl font-black text-purple-700 font-heading mt-1">
                  ₹{totalRevenue}
                </p>
                <span className="text-[11px] text-emerald-600 font-bold">
                  10% Commission: ₹{Math.round(totalRevenue * 0.1)}
                </span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Published Food Items
                </span>
                <p className="text-3xl font-black text-emerald-700 font-heading mt-1">
                  {publishedFoodsCount}
                </p>
                <button
                  onClick={() => setActiveTab('published_foods')}
                  className="text-[11px] text-emerald-600 font-bold hover:underline"
                >
                  View catalog →
                </button>
              </div>
            </div>

            {/* Quick Entity Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-stone-200 text-center">
                <p className="text-2xl font-black text-stone-900">{customersCount}</p>
                <span className="text-xs text-stone-500 font-bold">Total Customers</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-stone-200 text-center">
                <p className="text-2xl font-black text-stone-900">{sellersCount}</p>
                <span className="text-xs text-stone-500 font-bold">Total Sellers</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-stone-200 text-center">
                <p className="text-2xl font-black text-stone-900">{restaurants.length}</p>
                <span className="text-xs text-stone-500 font-bold">Total Restaurants</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-stone-200 text-center">
                <p className="text-2xl font-black text-rose-600">{complaints.length}</p>
                <span className="text-xs text-stone-500 font-bold">Pending Complaints</span>
              </div>
            </div>

            {/* Visual Charts: Revenue & Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                  <h3 className="text-sm font-bold text-stone-900">Weekly Revenue Inflow</h3>
                  <span className="text-xs font-bold text-emerald-600">+22.5% this week</span>
                </div>
                <div className="grid grid-cols-7 gap-2 h-40 items-end pt-4">
                  {[
                    { day: 'Mon', h: '35%', v: '₹4,200' },
                    { day: 'Tue', h: '55%', v: '₹6,400' },
                    { day: 'Wed', h: '45%', v: '₹5,100' },
                    { day: 'Thu', h: '70%', v: '₹8,200' },
                    { day: 'Fri', h: '85%', v: '₹11,000' },
                    { day: 'Sat', h: '100%', v: '₹14,500' },
                    { day: 'Sun', h: '90%', v: '₹12,800' },
                  ].map((d) => (
                    <div key={d.day} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                      <span className="text-[9px] font-mono text-stone-400 opacity-0 group-hover:opacity-100 transition">
                        {d.v}
                      </span>
                      <div
                        style={{ height: d.h }}
                        className="w-full bg-gradient-to-t from-purple-700 to-indigo-500 rounded-lg group-hover:brightness-110 transition shadow-2xs"
                      />
                      <span className="text-[10px] font-bold text-stone-500">{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                  <h3 className="text-sm font-bold text-stone-900">Food Popularity Distribution</h3>
                  <span className="text-xs font-bold text-stone-400">By Categories</span>
                </div>
                <div className="space-y-3 pt-1">
                  {[
                    { cat: 'Biryani', share: '38%', color: 'bg-amber-500' },
                    { cat: 'Pizza', share: '24%', color: 'bg-orange-500' },
                    { cat: 'Burger & Fast Food', share: '18%', color: 'bg-rose-500' },
                    { cat: 'South Indian & Dosa', share: '12%', color: 'bg-emerald-500' },
                    { cat: 'Desserts & Beverages', share: '8%', color: 'bg-purple-500' },
                  ].map((c) => (
                    <div key={c.cat}>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-stone-700">{c.cat}</span>
                        <span className="text-stone-900">{c.share}</span>
                      </div>
                      <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                        <div style={{ width: c.share }} className={`h-full ${c.color} rounded-full`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Live Orders Quick View */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                <h3 className="text-sm font-bold text-stone-900">Recent Customer Orders</h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-orange-600 hover:underline"
                >
                  View All Orders ({adminOrders.length}) →
                </button>
              </div>

              {adminOrders.length === 0 ? (
                <p className="text-xs text-stone-400 italic py-4">No customer orders placed yet.</p>
              ) : (
                <div className="divide-y divide-stone-100">
                  {adminOrders.slice(0, 4).map((ord, idx) => {
                    const norm = normalizeOrderStatus(ord.orderStatus);
                    const ordId = ord.orderId || (ord as any).id || `recent-ord-${idx}`;
                    return (
                      <div key={ordId} className="py-3 flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-stone-900">
                              #{ordId ? ordId.slice(-6).toUpperCase() : ''}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                                norm === 'DELIVERED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : norm === 'CANCELLED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {norm}
                            </span>
                          </div>
                          <p className="text-xs text-stone-600 mt-0.5">
                            {ord.customerName} ({ord.customerPhone}) • {ord.restaurantName}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-stone-900">₹{ord.total}</span>
                          <button
                            onClick={() => {
                              setSelectedOrder(ord);
                              setActiveTab('orders');
                            }}
                            className="block text-[10px] text-orange-600 font-bold hover:underline"
                          >
                            Inspect & Dispatch
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== TAB: ORDERS (FULL MANAGEMENT) ===================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-900 text-[10px] font-black uppercase tracking-wider">
                  Platform Order Dispatch
                </span>
                <h1 className="text-2xl font-black font-heading text-stone-900 tracking-tight mt-1">
                  Master Orders Feed
                </h1>
                <p className="text-xs text-stone-500 mt-0.5">
                  Live real-time feed of all customer orders. Status updates instantly reflect on the customer live tracker!
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1 bg-stone-200/70 p-1 rounded-2xl">
                {['ALL', 'PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-2.5 py-1 text-[10px] font-black rounded-xl transition ${
                      orderStatusFilter === st
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Box */}
            <div className="bg-white p-3.5 rounded-2xl border border-stone-200 flex items-center gap-2">
              <Search className="w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search orders by Order ID, customer name, phone, or restaurant..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full text-xs outline-none bg-transparent font-medium"
              />
            </div>

            {/* Orders Feed */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
                <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-2" />
                <h3 className="text-base font-bold text-stone-800">No orders found</h3>
                <p className="text-xs text-stone-500 mt-1">
                  No orders match current filter criteria.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((ord, idx) => {
                  const norm = normalizeOrderStatus(ord.orderStatus);
                  const ordId = ord.orderId || (ord as any).id || `order-${idx}`;
                  return (
                    <div
                      key={ordId}
                      className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-4 border-b border-stone-100 gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-black text-stone-900">
                              #{ordId ? ordId.slice(-6).toUpperCase() : ''}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                norm === 'DELIVERED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : norm === 'CANCELLED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : norm === 'PLACED'
                                  ? 'bg-blue-100 text-blue-800 animate-pulse'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {norm}
                            </span>
                          </div>

                          <div className="mt-1 text-xs text-stone-600">
                            Customer:{' '}
                            <span className="font-bold text-stone-900">{ord.customerName}</span> •{' '}
                            <span className="font-mono">{ord.customerPhone}</span>
                          </div>

                          <p className="text-xs text-stone-500 mt-0.5">
                            Kitchen:{' '}
                            <span className="font-bold text-stone-800">{ord.restaurantName}</span> •{' '}
                            {new Date(ord.createdAt).toLocaleString()}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="text-base font-black text-stone-900">₹{ord.total}</span>
                          <span className="block text-[10px] text-stone-400 uppercase font-semibold">
                            {ord.paymentMethod?.toUpperCase()} ({ord.paymentStatus || 'paid'})
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="py-3 text-xs">
                        <div className="flex flex-wrap gap-2">
                          {(ord.items || []).map((item, itemIdx) => (
                            <span
                              key={item.foodId ? `${item.foodId}-${itemIdx}` : `item-${itemIdx}`}
                              className="px-2.5 py-1 bg-stone-50 rounded-lg border border-stone-200 text-stone-800 font-medium"
                            >
                              {item.quantity}x {item.name} (₹{item.price * item.quantity})
                            </span>
                          ))}
                        </div>
                        <p className="text-[11px] text-stone-500 mt-2 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                          <span>
                            {ord.deliveryAddress?.address || ord.address?.address},{' '}
                            {ord.deliveryAddress?.city || ord.address?.city}
                          </span>
                        </p>
                      </div>

                      {/* Delivery Partner Assigned Strip / Quick Dispatch */}
                      <div className="my-2.5 p-3 bg-purple-50/50 rounded-2xl border border-purple-100 flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black flex-shrink-0 shadow-xs">
                            <Bike className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-stone-900 truncate">
                                {ord.riderName ? ord.riderName : 'No Delivery Boy Assigned'}
                              </span>
                              {ord.riderStatus && (
                                <span className="text-[10px] bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full font-bold">
                                  {ord.riderStatus}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                              {ord.riderPhone ? (
                                <>
                                  <a href={`tel:${ord.riderPhone}`} className="text-emerald-700 font-bold hover:underline">
                                    {ord.riderPhone}
                                  </a>
                                  {ord.riderVehicleNumber ? ` • ${ord.riderVehicleNumber}` : ''}
                                </>
                              ) : (
                                'Set rider name & phone for live customer map'
                              )}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => setAssignOrder(ord)}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Bike className="w-3.5 h-3.5" />
                          <span>{ord.riderName ? 'Change Rider' : 'Assign Delivery Boy'}</span>
                        </button>
                      </div>

                      {/* Real-Time Status Change Controls */}
                      <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect Details</span>
                        </button>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold text-stone-400 uppercase mr-1">
                            Set Status:
                          </span>

                          <button
                            onClick={() => handleAdminUpdateOrderStatus(ordId, 'CONFIRMED')}
                            disabled={norm === 'CONFIRMED'}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-[10px] font-black uppercase transition"
                          >
                            Confirm
                          </button>

                          <button
                            onClick={() => handleAdminUpdateOrderStatus(ordId, 'PREPARING')}
                            disabled={norm === 'PREPARING'}
                            className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white rounded-lg text-[10px] font-black uppercase transition"
                          >
                            Preparing
                          </button>

                          <button
                            onClick={() => handleAdminUpdateOrderStatus(ordId, 'READY')}
                            disabled={norm === 'READY'}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-lg text-[10px] font-black uppercase transition"
                          >
                            Ready
                          </button>

                          <button
                            onClick={() => handleAdminUpdateOrderStatus(ordId, 'OUT_FOR_DELIVERY')}
                            disabled={norm === 'OUT_FOR_DELIVERY'}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-lg text-[10px] font-black uppercase transition"
                          >
                            Out for Delivery
                          </button>

                          <button
                            onClick={() => handleAdminUpdateOrderStatus(ordId, 'DELIVERED')}
                            disabled={norm === 'DELIVERED'}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-[10px] font-black uppercase transition"
                          >
                            Delivered ✓
                          </button>

                          <button
                            onClick={() => handleAdminUpdateOrderStatus(ordId, 'CANCELLED')}
                            disabled={norm === 'CANCELLED'}
                            className="px-2 py-1 text-rose-600 hover:bg-rose-50 disabled:opacity-30 rounded-lg text-[10px] font-bold uppercase transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB: DELIVERY FLEET (REAL-TIME RIDERS) ===================== */}
        {activeTab === 'delivery_partners' && (
          <DeliveryFleetTab
            partners={deliveryPartners}
            orders={adminOrders}
            onPartnerAdded={(newP) => setDeliveryPartners((prev) => [newP, ...prev])}
            onPartnerUpdated={(pId, updates) =>
              setDeliveryPartners((prev) =>
                prev.map((p) => (p.partnerId === pId ? { ...p, ...updates } : p))
              )
            }
            onOpenAssignModal={(ord) => setAssignOrder(ord)}
          />
        )}

        {/* ===================== TAB: ADD FOOD ===================== */}
        {activeTab === 'add_food' && (
          <div className="max-w-3xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-orange-100 text-orange-900 text-[10px] font-black uppercase tracking-wider">
                  Menu Engineering
                </span>
                <h1 className="text-2xl font-black font-heading text-stone-900 tracking-tight mt-1">
                  {editingFoodId ? 'Edit Food Dish' : '+ Add New Food Dish'}
                </h1>
                <p className="text-xs text-stone-500 mt-0.5">
                  Publishing saves directly to Firestore and reflects instantly on the customer marketplace.
                </p>
              </div>

              {editingFoodId && (
                <button
                  onClick={() => {
                    setEditingFoodId(null);
                    setFoodFormData({
                      name: '',
                      image: '',
                      price: '',
                      discountPrice: '',
                      description: '',
                      category: 'Biryani',
                      cuisine: 'North Indian',
                      foodType: 'non-veg',
                      preparationTime: '25-35 min',
                      available: true,
                      bestseller: false,
                      featured: false,
                      restaurantId: 'rest-1',
                      restaurantName: 'The Royal Biryani Durbar',
                      tags: 'Spicy',
                      status: 'published',
                    });
                  }}
                  className="text-xs font-bold text-stone-500 hover:underline"
                >
                  Clear & Create New
                </button>
              )}
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-5">
              {/* Row 1: Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Food Name <span className="text-orange-600">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kashmiri Rogan Josh with Garlic Naan"
                    value={foodFormData.name}
                    onChange={(e) => setFoodFormData({ ...foodFormData, name: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 outline-none focus:border-orange-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Category <span className="text-orange-600">*</span>
                  </label>
                  <select
                    value={foodFormData.category}
                    onChange={(e) => setFoodFormData({ ...foodFormData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 outline-none bg-white font-medium"
                  >
                    {[
                      'Biryani',
                      'Pizza',
                      'Burger',
                      'Indian',
                      'Chinese',
                      'South Indian',
                      'Desserts',
                      'Beverages',
                      'Snacks',
                      'Fast Food',
                    ].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Price & Discount Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Price (₹) <span className="text-orange-600">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="349"
                    value={foodFormData.price}
                    onChange={(e) => setFoodFormData({ ...foodFormData, price: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 outline-none focus:border-orange-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Discount Price (₹) (Optional)
                  </label>
                  <input
                    type="number"
                    placeholder="299"
                    value={foodFormData.discountPrice}
                    onChange={(e) => setFoodFormData({ ...foodFormData, discountPrice: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 outline-none focus:border-orange-500 font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Dietary Classification
                  </label>
                  <select
                    value={foodFormData.foodType}
                    onChange={(e: any) => setFoodFormData({ ...foodFormData, foodType: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 outline-none bg-white font-bold"
                  >
                    <option value="veg">🟢 Pure Vegetarian</option>
                    <option value="non-veg">🔴 Non-Vegetarian</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Restaurant & Cuisine & Prep Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Assign Restaurant
                  </label>
                  <select
                    value={foodFormData.restaurantId}
                    onChange={(e) => {
                      const sel = restaurants.find((r) => r.restaurantId === e.target.value);
                      setFoodFormData({
                        ...foodFormData,
                        restaurantId: e.target.value,
                        restaurantName: sel?.name || '',
                      });
                    }}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 outline-none bg-white font-medium"
                  >
                    {restaurants.map((r) => (
                      <option key={r.restaurantId} value={r.restaurantId}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Cuisine
                  </label>
                  <input
                    type="text"
                    placeholder="Mughlai, Italian, Asian..."
                    value={foodFormData.cuisine}
                    onChange={(e) => setFoodFormData({ ...foodFormData, cuisine: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Preparation Time
                  </label>
                  <input
                    type="text"
                    placeholder="25-35 min"
                    value={foodFormData.preparationTime}
                    onChange={(e) => setFoodFormData({ ...foodFormData, preparationTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 outline-none"
                  />
                </div>
              </div>

              {/* Food Image: URL or Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Food Photography (URL or File Upload)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="url"
                      placeholder="Image URL: https://images.unsplash.com/..."
                      value={foodFormData.image}
                      onChange={(e) => setFoodFormData({ ...foodFormData, image: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 outline-none focus:border-orange-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer transition border border-dashed border-stone-300">
                      <Upload className="w-4 h-4 text-stone-500" />
                      <span>Upload from Device</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {foodFormData.image && (
                  <div className="mt-2 flex items-center gap-3 p-2 bg-stone-50 rounded-xl border border-stone-200 w-fit">
                    <img
                      src={foodFormData.image}
                      alt="Food preview"
                      className="w-14 h-14 rounded-lg object-cover"
                      onError={(e) => {
                        (e.target as any).src =
                          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80';
                      }}
                    />
                    <span className="text-[11px] text-stone-500 font-medium">Image Preview Ready ✓</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Detailed Dish Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe secret spices, slow-cooking technique, tenderness, and aroma..."
                  value={foodFormData.description}
                  onChange={(e) => setFoodFormData({ ...foodFormData, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 outline-none resize-none"
                />
              </div>

              {/* Tags & Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Bestseller, Organic, Chef Pick"
                    value={foodFormData.tags}
                    onChange={(e) => setFoodFormData({ ...foodFormData, tags: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 outline-none"
                  />
                </div>

                <div className="sm:col-span-2 flex flex-wrap items-center gap-4 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-800">
                    <input
                      type="checkbox"
                      checked={foodFormData.available}
                      onChange={(e) => setFoodFormData({ ...foodFormData, available: e.target.checked })}
                      className="w-4 h-4 rounded text-orange-600"
                    />
                    <span>Available in Stock</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-800">
                    <input
                      type="checkbox"
                      checked={foodFormData.bestseller}
                      onChange={(e) => setFoodFormData({ ...foodFormData, bestseller: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500"
                    />
                    <span>Bestseller Dish 🔥</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-800">
                    <input
                      type="checkbox"
                      checked={foodFormData.featured}
                      onChange={(e) => setFoodFormData({ ...foodFormData, featured: e.target.checked })}
                      className="w-4 h-4 rounded text-purple-600"
                    />
                    <span>Featured on Home ✨</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons as requested */}
              <div className="pt-6 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('food_management')}
                  className="px-4 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl transition"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveFoodForm('draft')}
                  className="px-5 py-2.5 bg-stone-800 hover:bg-black text-white text-xs font-bold rounded-xl transition"
                >
                  Save Draft
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveFoodForm('published')}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black rounded-xl shadow-lg shadow-orange-600/25 transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Publish Food</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB: FOOD MANAGEMENT & PUBLISHED FOODS ===================== */}
        {(activeTab === 'food_management' || activeTab === 'published_foods') && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-900 text-[10px] font-black uppercase tracking-wider">
                  Menu Inventory
                </span>
                <h1 className="text-2xl font-black font-heading text-stone-900 tracking-tight mt-1">
                  {activeTab === 'published_foods' ? 'Published Foods Catalog' : 'Food Management Hub'}
                </h1>
                <p className="text-xs text-stone-500 mt-0.5">
                  Real-time synchronization with Firestore. Edits immediately propagate to diner menus.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingFoodId(null);
                  setActiveTab('add_food');
                }}
                className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Add New Food</span>
              </button>
            </div>

            {/* Filter controls */}
            <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by food name, category, or restaurant..."
                  value={foodSearch}
                  onChange={(e) => setFoodSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-stone-200 outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={foodCategoryFilter}
                  onChange={(e) => setFoodCategoryFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-stone-200 outline-none bg-white font-medium"
                >
                  <option value="All">All Categories</option>
                  {[
                    'Biryani',
                    'Pizza',
                    'Burger',
                    'Indian',
                    'Chinese',
                    'South Indian',
                    'Desserts',
                    'Beverages',
                    'Snacks',
                    'Fast Food',
                  ].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Food Table / Grid as required in Section 20 */}
            <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">Dish</th>
                      <th className="py-3.5 px-3">Category</th>
                      <th className="py-3.5 px-3">Price</th>
                      <th className="py-3.5 px-3">Restaurant</th>
                      <th className="py-3.5 px-3">Availability</th>
                      <th className="py-3.5 px-3">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredFoods.map((f, idx) => (
                      <tr key={f.id || f.foodId || `food-row-${idx}`} className="hover:bg-stone-50/70 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={f.image}
                              alt={f.name}
                              className="w-11 h-11 rounded-xl object-cover border border-stone-200 flex-shrink-0"
                              onError={(e) => {
                                (e.target as any).src =
                                  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80';
                              }}
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-stone-900">{f.name}</span>
                                {f.bestseller && (
                                  <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 text-[9px] font-black rounded uppercase">
                                    Bestseller
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-stone-400">
                                {f.foodType === 'veg' ? '🟢 Veg' : '🔴 Non-Veg'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 font-semibold text-stone-700">{f.category}</td>

                        <td className="py-3 px-3">
                          <span className="font-bold text-stone-900">₹{f.discountPrice || f.price}</span>
                          {f.discountPrice && (
                            <span className="block text-[10px] text-stone-400 line-through">
                              ₹{f.price}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-stone-600 font-medium">
                          {f.restaurantName || 'Partner Kitchen'}
                        </td>

                        <td className="py-3 px-3">
                          <button
                            onClick={() => handleToggleFoodAvailability(f.id || f.foodId, f.available !== false)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition ${
                              f.available !== false
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                          >
                            {f.available !== false ? 'In Stock' : 'Out of Stock'}
                          </button>
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                              f.status === 'published'
                                ? 'bg-emerald-100 text-emerald-800'
                                : f.status === 'draft'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-stone-200 text-stone-600'
                            }`}
                          >
                            {f.status || 'published'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleStartEditFood(f)}
                              className="p-1.5 text-stone-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                              title="Edit Food Item"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {f.status !== 'published' ? (
                              <button
                                onClick={() => handleChangeFoodStatus(f.id || f.foodId, 'published')}
                                className="px-2 py-1 text-[10px] font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                              >
                                Publish
                              </button>
                            ) : (
                              <button
                                onClick={() => handleChangeFoodStatus(f.id || f.foodId, 'draft')}
                                className="px-2 py-1 text-[10px] font-bold bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-lg transition"
                              >
                                Unpublish
                              </button>
                            )}

                            <button
                              onClick={() => handleChangeFoodStatus(f.id || f.foodId, 'archived')}
                              className="p-1.5 text-stone-400 hover:text-amber-600 rounded-lg transition"
                              title="Archive Dish"
                            >
                              <Archive className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteFood(f.id || f.foodId)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg transition"
                              title="Delete Dish"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB: CUSTOMERS ===================== */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black font-heading text-stone-900 tracking-tight">
              Customer Directory
            </h1>
            <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
              <div className="divide-y divide-stone-100">
                {users
                  .filter((u) => u.role === 'customer')
                  .map((cust, idx) => (
                    <div key={cust.uid || `cust-${idx}`} className="p-4 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-stone-900">{cust.name}</h4>
                        <p className="text-[11px] text-stone-500 font-mono mt-0.5">{cust.phone}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                        {cust.status || 'active'}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB: SELLERS ===================== */}
        {activeTab === 'sellers' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black font-heading text-stone-900 tracking-tight">
              Seller & Kitchen Partners
            </h1>
            <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
              <div className="divide-y divide-stone-100">
                {users
                  .filter((u) => u.role === 'seller')
                  .map((seller, idx) => (
                    <div key={seller.uid || `seller-${idx}`} className="p-4 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-stone-900">{seller.name}</h4>
                        <p className="text-[11px] text-stone-500 font-mono mt-0.5">{seller.phone}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800">
                          {seller.status}
                        </span>
                        {seller.status === 'pending' && (
                          <button
                            onClick={async () => {
                              await updateDoc(doc(db, 'users', seller.uid), { status: 'approved' });
                              showToast({ type: 'success', title: 'Seller Approved' });
                            }}
                            className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB: RESTAURANTS ===================== */}
        {activeTab === 'restaurants' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black font-heading text-stone-900 tracking-tight">
              Platform Restaurants
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {restaurants.map((r, idx) => (
                <div key={r.restaurantId || `rest-${idx}`} className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex items-center gap-4">
                  <img src={r.logo} alt={r.name} className="w-14 h-14 rounded-2xl object-cover" />
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-stone-900">{r.name}</h4>
                    <p className="text-xs text-stone-500">{r.cuisine.join(' • ')}</p>
                    <p className="text-[11px] text-stone-400 mt-0.5">{r.address}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md uppercase">
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== TAB: PAYMENTS ===================== */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black font-heading text-stone-900 tracking-tight">
              Payments & Settlements
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-stone-200">
                <span className="text-xs font-bold text-stone-400 uppercase">Gross Merchandise Value</span>
                <p className="text-3xl font-black text-stone-900 mt-1">₹{totalRevenue}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-stone-200">
                <span className="text-xs font-bold text-purple-700 uppercase">FoodieHub Take (10%)</span>
                <p className="text-3xl font-black text-purple-700 mt-1">₹{Math.round(totalRevenue * 0.1)}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-stone-200">
                <span className="text-xs font-bold text-emerald-700 uppercase">Seller Payouts (90%)</span>
                <p className="text-3xl font-black text-emerald-700 mt-1">₹{Math.round(totalRevenue * 0.9)}</p>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB: COUPONS ===================== */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black font-heading text-stone-900 tracking-tight">
              Coupons & Vouchers
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {coupons.map((c, idx) => (
                <div key={c.couponId || c.code || `coup-${idx}`} className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
                  <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                    {c.code}
                  </span>
                  <p className="text-sm font-bold text-stone-900 mt-2">{c.description}</p>
                  <p className="text-xs text-stone-500 mt-1">Min Order: ₹{c.minOrder}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== TAB: REVIEWS ===================== */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black font-heading text-stone-900 tracking-tight">
              Diner Reviews & Ratings
            </h1>
            <div className="space-y-3">
              {reviews.map((r, idx) => (
                <div key={r.reviewId || `rev-${idx}`} className="bg-white p-4 rounded-2xl border border-stone-200 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-xs text-stone-900">{r.customerName}</span>
                    <p className="text-xs text-stone-600 mt-0.5 italic">"{r.comment}"</p>
                  </div>
                  <span className="text-xs font-bold text-amber-600">⭐ {r.rating}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== TAB: COMPLAINTS ===================== */}
        {activeTab === 'complaints' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black font-heading text-stone-900 tracking-tight">
              Resolution Center
            </h1>
            <div className="space-y-4">
              {complaints.map((c, idx) => (
                <div key={c.complaintId || `comp-${idx}`} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                        {c.category}
                      </span>
                      <h4 className="text-sm font-bold text-stone-900 mt-1">{c.subject}</h4>
                      <p className="text-xs text-stone-500">From {c.userName}</p>
                    </div>
                    <span className="text-xs font-bold text-amber-600">{c.status}</span>
                  </div>
                  <p className="text-xs text-stone-700 mt-2">{c.description}</p>
                  {c.adminReply && (
                    <div className="mt-2 p-2.5 bg-stone-50 rounded-xl text-xs text-purple-800">
                      <strong>Admin Resolution:</strong> {c.adminReply}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== TAB: ANALYTICS ===================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black font-heading text-stone-900 tracking-tight">
              Platform Analytics
            </h1>
            <div className="bg-white p-6 rounded-3xl border border-stone-200">
              <h3 className="text-sm font-bold text-stone-800 mb-2">Order Conversion Velocity</h3>
              <p className="text-xs text-stone-500">
                Average time from order placement to doorstep delivery: 28.4 minutes.
              </p>
            </div>
          </div>
        )}

        {/* ===================== TAB: NOTIFICATIONS ===================== */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black font-heading text-stone-900 tracking-tight">
              Admin Notifications
            </h1>
            <div className="bg-white p-6 rounded-3xl border border-stone-200 space-y-3">
              <div className="p-3 bg-purple-50 rounded-xl text-xs text-purple-900 font-medium">
                ⚡ Real-time listeners active on orders, foods, and user records.
              </div>
              <div className="p-3 bg-stone-50 rounded-xl text-xs text-stone-700">
                Firestore rules verified for authorized platform administrator identity.
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB: PROFILE ===================== */}
        {activeTab === 'profile' && (
          <div className="max-w-xl space-y-6">
            <h1 className="text-2xl font-black font-heading text-stone-900 tracking-tight">
              Administrator Profile
            </h1>
            <div className="bg-white p-6 rounded-3xl border border-stone-200 space-y-4">
              <div>
                <span className="text-[10px] text-stone-400 font-bold uppercase">Account Status</span>
                <p className="text-sm font-bold text-emerald-700 flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" /> Authorized Master Administrator
                </p>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 font-bold uppercase">Role</span>
                <p className="text-sm font-bold text-stone-900">Platform Super Administrator</p>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 font-bold uppercase">Access Scope</span>
                <p className="text-xs text-stone-600">Full write & read access to all collections and order pipelines.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                  Order Telemetry
                </span>
                <h3 className="text-base font-black text-stone-900 mt-1">
                  Order #{(selectedOrder?.orderId || (selectedOrder as any)?.id) ? String(selectedOrder.orderId || (selectedOrder as any).id).slice(-6).toUpperCase() : ''}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">Customer:</span>
                <span className="font-bold text-stone-900">{selectedOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Phone:</span>
                <span className="font-mono text-stone-800">{selectedOrder.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Restaurant:</span>
                <span className="font-bold text-stone-900">{selectedOrder.restaurantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Address:</span>
                <span className="font-medium text-stone-800 text-right max-w-xs">
                  {selectedOrder.deliveryAddress?.address || selectedOrder.address?.address}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Total:</span>
                <span className="font-black text-stone-900 text-sm">₹{selectedOrder.total}</span>
              </div>

              {/* Delivery Partner Assigned in Modal */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                <div>
                  <span className="text-stone-500 block">Delivery Boy:</span>
                  <span className="font-bold text-stone-900">
                    {selectedOrder.riderName ? selectedOrder.riderName : 'None Assigned'}
                  </span>
                  {selectedOrder.riderPhone && (
                    <span className="text-stone-500 font-mono text-[11px] block">
                      {selectedOrder.riderPhone}
                      {selectedOrder.riderVehicleNumber ? ` • ${selectedOrder.riderVehicleNumber}` : ''}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setAssignOrder(selectedOrder)}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Bike className="w-3.5 h-3.5" />
                  <span>{selectedOrder.riderName ? 'Change Rider' : 'Assign Rider'}</span>
                </button>
              </div>

              <div className="pt-3 border-t border-stone-100">
                <p className="font-bold text-stone-700 mb-2">Food Items:</p>
                <div className="space-y-1">
                  {(selectedOrder.items || []).map((i, idx) => (
                    <div key={i.foodId ? `${i.foodId}-${idx}` : `item-${idx}`} className="flex justify-between text-stone-600">
                      <span>
                        {i.quantity}x {i.name}
                      </span>
                      <span>₹{i.price * i.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status progression buttons */}
              <div className="pt-4 border-t border-stone-100">
                <p className="text-[10px] font-bold uppercase text-stone-400 mb-2">
                  Update Status (Reflects Live to Customer):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    ['PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] as const
                  ).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleAdminUpdateOrderStatus(selectedOrder.orderId || (selectedOrder as any).id, st)}
                      className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg transition ${
                        normalizeOrderStatus(selectedOrder.orderStatus) === st
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Delivery Partner Modal */}
      <AssignDeliveryPartnerModal
        isOpen={!!assignOrder}
        onClose={() => setAssignOrder(null)}
        order={assignOrder}
        partners={deliveryPartners}
        onOrderUpdated={(ordId, updates) => {
          setAdminOrders((prev) =>
            prev.map((o) =>
              o.orderId === ordId || (o as any).id === ordId ? { ...o, ...updates } : o
            )
          );
          if (
            selectedOrder &&
            (selectedOrder.orderId === ordId || (selectedOrder as any).id === ordId)
          ) {
            setSelectedOrder((prev) => (prev ? { ...prev, ...updates } : null));
          }
        }}
      />
    </div>
  );
};
