import React, { useState, useEffect } from 'react';
import { ToastProvider, useToast } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { MobileNav } from './components/common/MobileNav';
import { ToastContainer } from './components/common/ToastContainer';
import { ConfirmationModal } from './components/common/ConfirmationModal';
import { AuthModal } from './components/auth/AuthModal';

import { HomeView } from './views/HomeView';
import { RestaurantDetailView } from './views/RestaurantDetailView';
import { SearchResultsView } from './views/SearchResultsView';
import { CartCheckoutView } from './views/CartCheckoutView';
import { CustomerOrderConfirmationView } from './views/CustomerOrderConfirmationView';
import { LiveOrderTrackingView } from './views/LiveOrderTrackingView';
import { CustomerOrdersView } from './views/CustomerOrdersView';
import { CustomerWishlistView } from './views/CustomerWishlistView';
import { CustomerProfileView } from './views/CustomerProfileView';
import { CustomerRestaurantsView } from './views/CustomerRestaurantsView';
import { CustomerFoodsView } from './views/CustomerFoodsView';
import { CustomerCategoriesView } from './views/CustomerCategoriesView';
import { CustomerReviewsView } from './views/CustomerReviewsView';
import { CustomerNotificationsView } from './views/CustomerNotificationsView';

import { SellerDashboard } from './views/seller/SellerDashboard';
import { AdminDashboard } from './views/admin/AdminDashboard';

import {
  Restaurant,
  FoodItem,
  Order,
  Review,
  Coupon,
  Complaint,
  AuditLog,
  UserProfile,
} from './types';
import { db, ADMIN_EMAIL } from './lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import {
  INITIAL_RESTAURANTS,
  INITIAL_FOOD_ITEMS,
  INITIAL_COUPONS,
  seedFirestoreIfEmpty,
} from './services/seedData';

function AppContent() {
  const { userProfile, isAdmin } = useAuth();
  const { showToast } = useToast();
  const { promptDifferentRestaurant, confirmReplaceCart, cancelReplaceCart } = useCart();

  // Navigation State for Customer Application
  const [currentView, setCurrentView] = useState<string>('home');
  const [currentParam, setCurrentParam] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Auth modal
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'customer' | 'seller' | 'admin'>('customer');

  // Firestore Real-Time Datasets
  const [restaurants, setRestaurants] = useState<Restaurant[]>(INITIAL_RESTAURANTS);
  const [foodItems, setFoodItems] = useState<FoodItem[]>(INITIAL_FOOD_ITEMS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([
    {
      reviewId: 'rev-sample-1',
      customerId: 'cust-demo-101',
      customerName: 'Aarav Sharma',
      restaurantId: 'rest-1',
      foodName: 'Hyderabadi Dum Chicken Biryani',
      orderId: 'ord-verified-101',
      rating: 5,
      comment: 'Authentic saffron fragrance and juicy tender chicken pieces. Best biryani in town!',
      createdAt: new Date().toISOString(),
    },
    {
      reviewId: 'rev-sample-2',
      customerId: 'cust-demo-102',
      customerName: 'Rhea Sen',
      restaurantId: 'rest-2',
      foodName: 'Woodfired Margherita Burrata',
      orderId: 'ord-verified-102',
      rating: 5,
      comment: 'Crust was exceptionally light with delicious artisanal burrata. Arrived hot in 25 mins.',
      createdAt: new Date().toISOString(),
    },
  ]);
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [complaints, setComplaints] = useState<Complaint[]>([
    {
      complaintId: 'comp-sample-1',
      userId: 'cust-demo-101',
      userName: 'Aarav Sharma',
      userRole: 'customer',
      subject: 'Packaging spill issue with curry',
      category: 'Food Quality',
      description: 'The raita leaked slightly into the outer paper bag, though food was delicious.',
      status: 'In Progress',
      createdAt: new Date().toISOString(),
    },
  ]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      logId: 'log-sample-1',
      adminUid: 'admin-master',
      action: 'PLATFORM_INITIALIZATION',
      targetId: 'system',
      description: 'FoodieHub platform database rules verified and deployed.',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [usersList, setUsersList] = useState<UserProfile[]>([
    {
      uid: 'admin-master',
      name: 'Administrator',
      phone: '',
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  ]);

  // Seed Firestore on startup
  useEffect(() => {
    seedFirestoreIfEmpty();
  }, []);

  // Listen to Firestore Collections in Real Time
  useEffect(() => {
    // Restaurants
    const unsubRest = onSnapshot(
      collection(db, 'restaurants'),
      (snap) => {
        if (!snap.empty) {
          const data = snap.docs.map((d) => d.data() as Restaurant);
          setRestaurants(data);
        }
      },
      (error) => {
        console.warn('Restaurants listener fallback:', error.message);
      }
    );

    // Foods (Real-time synchronization for published dishes)
    const unsubFoods = onSnapshot(
      collection(db, 'foodItems'),
      (snap) => {
        if (!snap.empty) {
          const data = snap.docs.map((d) => {
            const item = d.data();
            return {
              id: item.id || item.foodId || d.id,
              foodId: item.foodId || item.id || d.id,
              name: item.name || '',
              image: item.image || '',
              price: Number(item.price) || 0,
              discountPrice: item.discountPrice ? Number(item.discountPrice) : undefined,
              description: item.description || '',
              category: item.category || 'General',
              cuisine: item.cuisine || item.category || 'Multi-Cuisine',
              foodType: item.foodType || 'veg',
              preparationTime: item.preparationTime || '20-30 min',
              available: item.available !== false,
              availability: item.availability || 'active',
              bestseller: !!item.bestseller || !!item.isBestseller,
              isBestseller: !!item.bestseller || !!item.isBestseller,
              featured: !!item.featured,
              restaurantId: item.restaurantId || 'rest-1',
              restaurantName: item.restaurantName || 'Partner Kitchen',
              status: item.status || 'published',
              tags: item.tags || [],
              createdBy: item.createdBy || 'admin',
              rating: item.rating || 4.8,
              ratingCount: item.ratingCount || 10,
              createdAt: item.createdAt || new Date().toISOString(),
              updatedAt: item.updatedAt || new Date().toISOString(),
            } as FoodItem;
          });
          setFoodItems(data);
        }
      },
      (error) => {
        console.warn('Foods listener fallback:', error.message);
      }
    );

    // Reviews
    const unsubReviews = onSnapshot(
      collection(db, 'reviews'),
      (snap) => {
        if (!snap.empty) {
          const data = snap.docs.map((d) => d.data() as Review);
          setReviews(data);
        }
      },
      (error) => {
        console.warn('Reviews listener fallback:', error.message);
      }
    );

    // Coupons
    const unsubCoupons = onSnapshot(
      collection(db, 'coupons'),
      (snap) => {
        if (!snap.empty) {
          const data = snap.docs.map((d) => d.data() as Coupon);
          setCoupons(data);
        }
      },
      (error) => {
        console.warn('Coupons listener fallback:', error.message);
      }
    );

    // Complaints
    const unsubComplaints = onSnapshot(
      collection(db, 'complaints'),
      (snap) => {
        if (!snap.empty) {
          const data = snap.docs.map((d) => d.data() as Complaint);
          setComplaints(data);
        }
      },
      (error) => {
        console.warn('Complaints listener fallback:', error.message);
      }
    );

    // Audit logs
    const unsubAudit = onSnapshot(
      collection(db, 'auditLogs'),
      (snap) => {
        if (!snap.empty) {
          const data = snap.docs.map((d) => d.data() as AuditLog);
          setAuditLogs(data);
        }
      },
      (error) => {
        console.warn('Audit logs listener fallback:', error.message);
      }
    );

    // Users
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        if (!snap.empty) {
          const data = snap.docs.map((d) => d.data() as UserProfile);
          setUsersList(data);
        }
      },
      (error) => {
        console.warn('Users listener fallback:', error.message);
      }
    );

    return () => {
      unsubRest();
      unsubFoods();
      unsubReviews();
      unsubCoupons();
      unsubComplaints();
      unsubAudit();
      unsubUsers();
    };
  }, []);

  // Real-time Orders Listener scoped to user role & permission
  useEffect(() => {
    let orderQuery;
    const isMasterAdmin =
      isAdmin ||
      userProfile?.role === 'admin' ||
      (userProfile?.email && userProfile.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());

    if (isMasterAdmin) {
      // Admin reads all orders
      orderQuery = collection(db, 'orders');
    } else if (userProfile?.role === 'seller' && userProfile?.uid) {
      // Seller reads orders where sellerId is their UID
      orderQuery = query(collection(db, 'orders'), where('sellerId', '==', userProfile.uid));
    } else if (userProfile?.uid) {
      // Authenticated customer reads orders where customerId is their UID
      orderQuery = query(collection(db, 'orders'), where('customerId', '==', userProfile.uid));
    } else {
      // Not logged in: no orders to subscribe to
      setOrders([]);
      return;
    }

    const unsubOrders = onSnapshot(
      orderQuery,
      (snap) => {
        const data = snap.docs.map((d) => {
          const item = d.data() as Order;
          const orderId = item.orderId || (item as any).id || d.id;
          return {
            ...item,
            orderId,
            id: (item as any).id || orderId,
          } as Order;
        });
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(data);
      },
      (error) => {
        console.warn('Orders listener notice:', error.message);
      }
    );

    return () => unsubOrders();
  }, [userProfile?.uid, userProfile?.role, userProfile?.email, isAdmin]);

  // Track previous authenticated user ID to handle immediate logout cleanup
  const prevUserUidRef = React.useRef<string | undefined>(userProfile?.uid);

  useEffect(() => {
    // When a user logs out (transition from authenticated to unauthenticated)
    if (prevUserUidRef.current && !userProfile?.uid) {
      setOrders([]);
      setCurrentParam('');
      // If currently on an authenticated/private customer view or admin/seller view
      const privateViews = [
        'customer-orders',
        'orders',
        'order-confirmation',
        'customer/orders',
        'track',
        'profile',
        'notifications',
        'admin',
        'seller',
        'wishlist',
      ];
      if (
        privateViews.includes(currentView) ||
        currentView.startsWith('customer/orders/')
      ) {
        setCurrentView('home');
      }
    }
    prevUserUidRef.current = userProfile?.uid;
  }, [userProfile?.uid, currentView]);

  const handleNavigate = (view: string, param: string = '') => {
    setCurrentView(view);
    setCurrentParam(param);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuth = (tab: 'customer' | 'seller' | 'admin' = 'customer') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const handleOpenRestaurant = (restaurantId: string) => {
    handleNavigate('restaurant', restaurantId);
  };

  const handleExecuteSearch = (q: string) => {
    setSearchQuery(q);
    handleNavigate('search', q);
  };

  // Active restaurant for detail view
  const currentRestaurant =
    restaurants.find((r) => r.restaurantId === currentParam) || restaurants[0];

  // =========================================================================
  // 1. STRICT ADMIN ROLE APPLICATION
  // When authenticated user is the authorized admin, show ONLY Admin application.
  // DO NOT show customer navigation, seller navigation, customer wishlist/cart,
  // or any role switcher button.
  // =========================================================================
  const isAuthorizedAdmin =
    userProfile?.role === 'admin' ||
    isAdmin ||
    (userProfile?.email && userProfile.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());

  if (isAuthorizedAdmin) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col font-sans text-stone-900">
        <AdminDashboard
          users={usersList}
          restaurants={restaurants}
          foodItems={foodItems}
          orders={orders}
          reviews={reviews}
          coupons={coupons}
          complaints={complaints}
          auditLogs={auditLogs}
        />
        <ToastContainer />
      </div>
    );
  }

  // =========================================================================
  // 2. STRICT SELLER ROLE APPLICATION
  // Seller login opens ONLY the Seller application.
  // Seller must never see Admin navigation or Customer navigation.
  // =========================================================================
  if (userProfile?.role === 'seller') {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col font-sans text-stone-900">
        <SellerDashboard
          restaurants={restaurants}
          foodItems={foodItems}
          orders={orders}
          reviews={reviews}
        />
        <ToastContainer />
      </div>
    );
  }

  // =========================================================================
  // 3. STRICT CUSTOMER / PUBLIC APPLICATION
  // Customer navigation: Home, Restaurants, Food, Search, Categories,
  // Cart, Orders, Live Tracking, Wishlist, Reviews, Profile, Notifications, Logout.
  // Customer never sees Admin or Seller navigation.
  // =========================================================================
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 selection:bg-orange-600 selection:text-white">
      {/* Top Customer Header */}
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenAuthModal={handleOpenAuth}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onExecuteSearch={handleExecuteSearch}
      />

      {/* Main Customer Viewport */}
      <main className="flex-1">
        {/* 1. Home */}
        {currentView === 'home' && (
          <HomeView
            restaurants={restaurants}
            foodItems={foodItems}
            onNavigate={handleNavigate}
            onOpenRestaurant={handleOpenRestaurant}
            onSelectCategory={(cat) => {
              setSearchQuery('');
              handleNavigate('search', cat);
            }}
          />
        )}

        {/* 2. Restaurants Directory */}
        {currentView === 'restaurants' && (
          <CustomerRestaurantsView
            restaurants={restaurants}
            onOpenRestaurant={handleOpenRestaurant}
          />
        )}

        {/* 3. Food Catalog */}
        {(currentView === 'foods' || currentView === 'food') && (
          <CustomerFoodsView
            foodItems={foodItems}
            initialCategory={currentParam || 'All'}
            onSelectCategory={(cat) => setCurrentParam(cat)}
          />
        )}

        {/* 4. Categories Visual Grid */}
        {currentView === 'categories' && (
          <CustomerCategoriesView
            foodItems={foodItems}
            onSelectCategory={(cat) => {
              setCurrentParam(cat);
              handleNavigate('foods', cat);
            }}
          />
        )}

        {/* 5. Search */}
        {currentView === 'search' && (
          <SearchResultsView
            restaurants={restaurants}
            foodItems={foodItems}
            initialQuery={searchQuery}
            initialCategory={currentParam}
            onOpenRestaurant={handleOpenRestaurant}
          />
        )}

        {/* 6. Cart */}
        {currentView === 'cart' && (
          <CartCheckoutView
            onOrderPlaced={(orderId) => handleNavigate('order-confirmation', orderId)}
            onOpenRestaurant={handleOpenRestaurant}
            onOpenAuth={() => handleOpenAuth('customer')}
          />
        )}

        {/* 6b. Order Confirmation */}
        {(currentView === 'order-confirmation' || currentView === 'customer/orders' || currentView.startsWith('customer/orders/')) && (
          <CustomerOrderConfirmationView
            orderId={currentParam || (userProfile?.uid ? orders[0]?.orderId : '') || ''}
            initialOrder={orders.find((o) => o.orderId === currentParam || (o as any).id === currentParam)}
            onTrackOrder={(orderId) => handleNavigate('track', orderId)}
            onViewAllOrders={() => handleNavigate('customer-orders')}
            onExploreMore={() => handleNavigate('foods')}
            onOpenAuth={() => handleOpenAuth('customer')}
          />
        )}

        {/* 7. Orders */}
        {(currentView === 'customer-orders' || currentView === 'orders') && (
          <CustomerOrdersView
            orders={orders}
            onTrackOrder={(orderId) => handleNavigate('track', orderId)}
            onExploreFood={() => handleNavigate('foods')}
            onOpenAuth={() => handleOpenAuth('customer')}
          />
        )}

        {/* 8. Live Tracking */}
        {currentView === 'track' && (
          <LiveOrderTrackingView
            orderId={currentParam || (userProfile?.uid ? orders[0]?.orderId : '') || ''}
            initialOrder={orders.find((o) => o.orderId === currentParam || (o as any).id === currentParam)}
            fallbackOrders={orders}
            onBack={() => handleNavigate('customer-orders')}
            onOpenAuth={() => handleOpenAuth('customer')}
          />
        )}

        {/* 9. Wishlist */}
        {currentView === 'wishlist' && (
          <CustomerWishlistView
            restaurants={restaurants}
            foodItems={foodItems}
            onOpenRestaurant={handleOpenRestaurant}
            onExploreFood={() => handleNavigate('foods')}
          />
        )}

        {/* 10. Reviews */}
        {currentView === 'reviews' && (
          <CustomerReviewsView
            reviews={reviews}
            onExploreFood={() => handleNavigate('foods')}
          />
        )}

        {/* 11. Profile */}
        {currentView === 'profile' && (
          <CustomerProfileView
            onNavigateOrders={() => handleNavigate('customer-orders')}
            onNavigateWishlist={() => handleNavigate('wishlist')}
            onOpenAuth={() => handleOpenAuth('customer')}
          />
        )}

        {/* 12. Notifications */}
        {currentView === 'notifications' && (
          <CustomerNotificationsView onNavigate={handleNavigate} />
        )}

        {/* Restaurant Detail Page */}
        {currentView === 'restaurant' && (
          <RestaurantDetailView
            restaurant={currentRestaurant}
            foodItems={foodItems}
            reviews={reviews}
            onBack={() => handleNavigate('restaurants')}
          />
        )}
      </main>

      {/* Customer Footer */}
      <Footer onNavigate={handleNavigate} onOpenAuth={handleOpenAuth} />

      {/* Mobile Bottom Navigation */}
      <MobileNav
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenAuth={handleOpenAuth}
      />

      {/* Modals & Floating Components */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        mode={authModalTab}
      />

      <ConfirmationModal
        isOpen={promptDifferentRestaurant.isOpen}
        title="Replace items in cart?"
        message={`Your cart contains dishes from another restaurant. You can only order from one kitchen at a time. Clear cart and add dish from ${promptDifferentRestaurant.pendingRestaurant?.name}?`}
        confirmLabel="Yes, Replace Cart"
        cancelLabel="Keep Current Items"
        onConfirm={confirmReplaceCart}
        onCancel={cancelReplaceCart}
      />

      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <AppContent />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
