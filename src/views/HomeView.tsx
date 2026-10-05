import React, { useState } from 'react';
import { Restaurant, FoodItem, Coupon } from '../types';
import { CATEGORIES, INITIAL_COUPONS } from '../services/seedData';
import { FoodCard } from '../components/customer/FoodCard';
import { RestaurantCard } from '../components/customer/RestaurantCard';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import {
  Flame,
  Sparkles,
  TrendingUp,
  Tag,
  Star,
  Clock,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  ArrowRight,
  Filter,
  CheckCircle,
} from 'lucide-react';

interface HomeViewProps {
  restaurants: Restaurant[];
  foodItems: FoodItem[];
  onNavigate: (view: string, param?: string) => void;
  onOpenRestaurant: (restaurantId: string) => void;
  onSelectCategory: (category: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  restaurants,
  foodItems,
  onNavigate,
  onOpenRestaurant,
  onSelectCategory,
}) => {
  const { applyCoupon } = useCart();
  const { showToast } = useToast();

  const [filterVegOnly, setFilterVegOnly] = useState(false);
  const [filterRating4Plus, setFilterRating4Plus] = useState(false);
  const [filterFastDelivery, setFilterFastDelivery] = useState(false);

  // Apply filters
  let displayedFoods = foodItems;
  if (filterVegOnly) {
    displayedFoods = displayedFoods.filter((f) => f.foodType === 'veg');
  }
  if (filterRating4Plus) {
    displayedFoods = displayedFoods.filter((f) => f.rating >= 4.7);
  }

  let displayedRestaurants = restaurants;
  if (filterRating4Plus) {
    displayedRestaurants = displayedRestaurants.filter((r) => r.rating >= 4.7);
  }
  if (filterFastDelivery) {
    displayedRestaurants = displayedRestaurants.filter((r) => r.deliveryTime.includes('20') || r.deliveryTime.includes('25'));
  }

  const trendingFoods = displayedFoods.filter((f) => f.isBestseller).slice(0, 4);
  const recommendedFoods = displayedFoods.slice(4, 12);
  const popularRestaurants = displayedRestaurants.filter((r) => r.isPopular).slice(0, 4);
  const topRatedRestaurants = displayedRestaurants.filter((r) => r.isTopRated).slice(0, 4);

  const handleCopyCoupon = (code: string) => {
    const res = applyCoupon(code);
    if (res.success) {
      showToast({ type: 'success', title: 'Coupon Applied!', message: res.message });
    } else {
      showToast({ type: 'info', title: 'Coupon Code', message: res.message });
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 text-white pt-10 pb-16 lg:pb-24 px-4 sm:px-6 lg:px-8">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>THE ARTISAN RESTAURANT MARKETPLACE</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-heading tracking-tight leading-[1.1]">
              Crave-Worthy Dishes,{' '}
              <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
                Delivered Superfast.
              </span>
            </h1>

            <p className="text-stone-300 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Indulge in slow-dum Biryanis, woodfired Neapolitan pizzas, smash burgers, and authentic Asian flavours from the city’s highest-rated kitchens.
            </p>

            {/* Quick Hero Search Input */}
            <div className="pt-2 max-w-lg mx-auto lg:mx-0">
              <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 flex items-center gap-2 shadow-2xl">
                <input
                  type="text"
                  placeholder="What are you craving today? (e.g. Biryani)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onNavigate('search', (e.target as HTMLInputElement).value);
                    }
                  }}
                  className="flex-1 px-4 py-2.5 bg-transparent text-white placeholder-stone-400 text-sm focus:outline-none"
                />
                <button
                  onClick={() => onNavigate('search')}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-lg shadow-orange-600/30"
                >
                  <span>Explore</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Live Trust Badges */}
            <div className="pt-4 grid grid-cols-3 gap-3 max-w-md mx-auto lg:mx-0 text-stone-300 text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <span>30 Min Average</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 flex-shrink-0 fill-amber-400" />
                <span>4.8+ Top Rated</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>100% Contactless</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Card Stack */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="aspect-4/3 rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative group">
                <img
                  src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=900&auto=format&fit=crop&q=80"
                  alt="Hyderabadi Dum Biryani Feast"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <span className="px-2.5 py-1 bg-orange-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                    Today's Top Pick
                  </span>
                  <h3 className="text-xl font-bold font-heading mt-2">
                    The Royal Biryani Durbar
                  </h3>
                  <p className="text-xs text-stone-300 mt-1 line-clamp-1">
                    Authentic Hyderabadi Dum Chicken Biryani with Mirchi ka Salan
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-base font-black text-amber-400">₹299</span>
                    <button
                      onClick={() => onOpenRestaurant('rest-1')}
                      className="px-3.5 py-1.5 bg-white text-stone-900 rounded-xl text-xs font-bold hover:bg-orange-500 hover:text-white transition"
                    >
                      View Menu
                    </button>
                  </div>
                </div>
              </div>

              {/* Floating micro pill */}
              <div className="absolute -top-4 -right-4 bg-stone-900/90 backdrop-blur-md border border-stone-700 p-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce-subtle">
                <div className="w-10 h-10 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center font-bold text-sm">
                  ⚡
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-stone-400">Live Delivery</p>
                  <p className="text-xs font-black text-white">Bikes On The Move</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FOOD CATEGORIES CAROUSEL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="bg-white rounded-3xl p-5 shadow-xl border border-stone-200/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-black font-heading text-stone-900 tracking-tight flex items-center gap-2">
                <span>Craving Inspiration</span>
                <span className="text-xs font-semibold text-stone-400">Browse by cuisine</span>
              </h2>
            </div>
            <button
              onClick={() => onNavigate('search')}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-11 gap-2 sm:gap-3 text-center">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id === 'all' ? '' : cat.name)}
                className="flex flex-col items-center gap-2 p-2.5 rounded-2xl hover:bg-orange-50/80 hover:border-orange-200 border border-stone-100 transition duration-200 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-stone-50 group-hover:bg-white group-hover:scale-110 flex items-center justify-center text-2xl shadow-2xs group-hover:shadow-md transition">
                  {cat.icon}
                </div>
                <span className="text-[11px] font-bold text-stone-700 group-hover:text-orange-600 truncate w-full">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. TODAY'S DEALS & PROMO COUPONS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-orange-600" />
            <h2 className="text-xl font-black font-heading text-stone-900 tracking-tight">
              Today's Deals & Vouchers
            </h2>
          </div>
          <span className="text-xs font-semibold text-stone-400">Tap code to apply to cart</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {INITIAL_COUPONS.map((coupon) => (
            <div
              key={coupon.couponId}
              onClick={() => handleCopyCoupon(coupon.code)}
              className="bg-gradient-to-r from-orange-600 to-amber-600 text-white p-4 rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 relative overflow-hidden cursor-pointer group"
            >
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 bg-black/25 backdrop-blur-md rounded-md text-[10px] font-mono font-bold uppercase tracking-wider text-amber-200">
                    CODE: {coupon.code}
                  </span>
                  <h3 className="text-lg font-black font-heading mt-2">{coupon.description}</h3>
                  <p className="text-[11px] text-orange-100 mt-1">
                    Valid till {coupon.expiryDate} • Limited redemptions
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/20 group-hover:bg-white group-hover:text-orange-600 text-white flex items-center justify-center transition flex-shrink-0">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. FILTER CONTROLS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-stone-600">
            <Filter className="w-4 h-4 text-orange-600" />
            <span>Quick Filters:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterVegOnly(!filterVegOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                filterVegOnly
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-300" />
              <span>Veg Only</span>
            </button>

            <button
              onClick={() => setFilterRating4Plus(!filterRating4Plus)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                filterRating4Plus
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <Star className="w-3 h-3 fill-current" />
              <span>Top Rated (4.7+)</span>
            </button>

            <button
              onClick={() => setFilterFastDelivery(!filterFastDelivery)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                filterFastDelivery
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Fast Delivery (&lt;30m)</span>
            </button>
          </div>
        </div>
      </section>

      {/* 5. TRENDING DISHES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl font-black font-heading text-stone-900 tracking-tight">
                Trending on FoodieHub
              </h2>
              <p className="text-xs text-stone-500">Most ordered dishes in your area right now</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('search')}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            <span>See More</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingFoods.map((food) => {
            const rest = restaurants.find((r) => r.restaurantId === food.restaurantId);
            return (
              <FoodCard
                key={food.foodId}
                food={food}
                restaurantName={rest?.name}
                onOpenRestaurant={onOpenRestaurant}
              />
            );
          })}
        </div>
      </section>

      {/* 6. POPULAR & TOP-RATED RESTAURANTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black font-heading text-stone-900 tracking-tight">
              Top Rated Culinary Kitchens
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Handcrafted specialties with verified diner ratings
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularRestaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.restaurantId}
              restaurant={restaurant}
              onClick={() => onOpenRestaurant(restaurant.restaurantId)}
            />
          ))}
        </div>
      </section>

      {/* 7. RECOMMENDED FOR YOU */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-2xl font-black font-heading text-stone-900 tracking-tight">
                Recommended For You
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Curated based on your culinary interests
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendedFoods.map((food) => {
            const rest = restaurants.find((r) => r.restaurantId === food.restaurantId);
            return (
              <FoodCard
                key={food.foodId}
                food={food}
                restaurantName={rest?.name}
                onOpenRestaurant={onOpenRestaurant}
              />
            );
          })}
        </div>
      </section>

      {/* 8. HOW FOODIEHUB WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="bg-gradient-to-br from-stone-900 to-stone-950 text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase font-extrabold tracking-widest text-orange-400">
              The FoodieHub Experience
            </span>
            <h2 className="text-3xl font-black font-heading tracking-tight mt-1">
              How FoodieHub Works
            </h2>
            <p className="text-xs text-stone-300 mt-2">
              From artisan kitchen pans to your dining table in record time
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-orange-600/20 border border-orange-500/40 text-orange-400 flex items-center justify-center text-2xl mx-auto font-black font-heading">
                1
              </div>
              <h4 className="font-bold text-sm text-white">Select Your Cuisine</h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Explore handpicked regional menus, woodfired pizzas, and gourmet burgers.
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-orange-600/20 border border-orange-500/40 text-orange-400 flex items-center justify-center text-2xl mx-auto font-black font-heading">
                2
              </div>
              <h4 className="font-bold text-sm text-white">Fresh Cooking on Dum</h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Partner chefs prepare your dishes from scratch upon order acceptance.
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-orange-600/20 border border-orange-500/40 text-orange-400 flex items-center justify-center text-2xl mx-auto font-black font-heading">
                3
              </div>
              <h4 className="font-bold text-sm text-white">Live Realtime Tracking</h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Watch order milestone status updates live from kitchen pickup to doorstep.
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-orange-600/20 border border-orange-500/40 text-orange-400 flex items-center justify-center text-2xl mx-auto font-black font-heading">
                4
              </div>
              <h4 className="font-bold text-sm text-white">Hot & Delicious Dining</h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Enjoy piping hot restaurant-quality food delivered in thermal bags.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-black font-heading text-stone-900 tracking-tight">
            Loved By 50,000+ Happy Foodies
          </h2>
          <p className="text-xs text-stone-500 mt-1">Real ratings from real verified meals</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-stone-600 leading-relaxed italic">
                "The Hyderabadi Dum Chicken Biryani from Royal Durbar arrived steaming hot within 25 minutes. The live tracking status kept me updated throughout!"
              </p>
            </div>
            <div className="mt-4 flex items-center gap-3 pt-4 border-t border-stone-100">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Rhea Sen"
                className="w-9 h-9 rounded-full object-cover"
              />
              <div>
                <p className="text-xs font-bold text-stone-800">Rhea Sen</p>
                <p className="text-[10px] text-stone-400">Regular Diner • Indiranagar</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-stone-600 leading-relaxed italic">
                "Artisan Crust's woodfired Margherita Burrata is heavenly. Crisp sourdough crust and genuine Fior di latte mozzarella. Best pizza delivery in the city."
              </p>
            </div>
            <div className="mt-4 flex items-center gap-3 pt-4 border-t border-stone-100">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                alt="Aditya Varma"
                className="w-9 h-9 rounded-full object-cover"
              />
              <div>
                <p className="text-xs font-bold text-stone-800">Aditya Varma</p>
                <p className="text-[10px] text-stone-400">Verified Food Critic • Cyber City</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-stone-600 leading-relaxed italic">
                "The separate seller and admin portal makes FoodieHub look like a true enterprise marketplace. Seamless checkout with Razorpay and instant SMS OTP!"
              </p>
            </div>
            <div className="mt-4 flex items-center gap-3 pt-4 border-t border-stone-100">
              <img
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
                alt="Kavita Rao"
                className="w-9 h-9 rounded-full object-cover"
              />
              <div>
                <p className="text-xs font-bold text-stone-800">Kavita Rao</p>
                <p className="text-[10px] text-stone-400">Gourmet Lover • Bandra</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
