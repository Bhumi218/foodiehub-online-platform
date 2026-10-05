import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  LogOut,
  MapPin,
  ChevronDown,
  Clock,
  Flame,
  UtensilsCrossed,
  Building,
  Grid,
  Bell,
  Star,
  Activity,
  Store,
  Lock,
} from 'lucide-react';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenAuthModal: (tab?: 'customer' | 'seller' | 'admin') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onExecuteSearch: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenAuthModal,
  searchQuery,
  onSearchChange,
  onExecuteSearch,
}) => {
  const { userProfile, logout } = useAuth();
  const { totalItemCount, grandTotal } = useCart();
  const { favouriteFoods, favouriteRestaurants } = useWishlist();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('Connaught Place, Central City');
  const [isLocationSelectorOpen, setIsLocationSelectorOpen] = useState(false);

  const totalWishlistCount = favouriteFoods.length + favouriteRestaurants.length;

  const locations = [
    'Connaught Place, Central City',
    'Indiranagar, 100ft Road',
    'Bandra West, Hill Road',
    'Cyber City, DLF Phase 2',
    'Jubilee Hills, Road No. 36',
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onExecuteSearch(searchQuery.trim());
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Logo and Location */}
        <div className="flex items-center gap-5">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/25 group-hover:scale-105 transition-transform">
              <Flame className="w-6 h-6 fill-white" />
            </div>
            <div>
              <span className="text-xl font-black font-heading tracking-tight bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 bg-clip-text text-transparent">
                FoodieHub
              </span>
              <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest -mt-1">
                Gourmet Delivery
              </span>
            </div>
          </button>

          {/* Location Picker */}
          <div className="relative hidden xl:block">
            <button
              onClick={() => setIsLocationSelectorOpen(!isLocationSelectorOpen)}
              className="flex items-center gap-1.5 text-xs text-stone-700 hover:text-orange-600 font-semibold py-1.5 px-3 rounded-full hover:bg-stone-100 transition border border-transparent hover:border-stone-200 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
              <span className="max-w-[150px] truncate">{selectedLocation}</span>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
            </button>

            {isLocationSelectorOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 animate-fade-in">
                <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Select Delivery Location
                </div>
                {locations.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => {
                      setSelectedLocation(loc);
                      setIsLocationSelectorOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs transition flex items-center justify-between cursor-pointer ${
                      loc === selectedLocation
                        ? 'bg-orange-50 text-orange-700 font-bold'
                        : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span className="truncate">{loc}</span>
                    {loc === selectedLocation && <span className="text-orange-600">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Customer Primary Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-bold text-stone-600">
          <button
            onClick={() => onNavigate('home')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              currentView === 'home' ? 'text-orange-600 bg-orange-50' : 'hover:text-stone-900'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onNavigate('restaurants')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
              currentView === 'restaurants' ? 'text-orange-600 bg-orange-50' : 'hover:text-stone-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Restaurants</span>
          </button>
          <button
            onClick={() => onNavigate('foods')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
              currentView === 'foods' ? 'text-orange-600 bg-orange-50' : 'hover:text-stone-900'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Food</span>
          </button>
          <button
            onClick={() => onNavigate('categories')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
              currentView === 'categories' ? 'text-orange-600 bg-orange-50' : 'hover:text-stone-900'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Categories</span>
          </button>
          <button
            onClick={() => {
              if (!userProfile) {
                onOpenAuthModal('customer');
              } else {
                onNavigate('customer-orders');
              }
            }}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
              currentView === 'customer-orders' ? 'text-orange-600 bg-orange-50' : 'hover:text-stone-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Orders</span>
          </button>
          <button
            onClick={() => {
              if (!userProfile) {
                onOpenAuthModal('customer');
              } else {
                onNavigate('track');
              }
            }}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
              currentView === 'track' ? 'text-orange-600 bg-orange-50' : 'hover:text-stone-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
            <span>Live Tracking</span>
          </button>
        </nav>

        {/* Global Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex-1 max-w-xs sm:max-w-sm hidden md:flex items-center relative"
        >
          <Search className="w-4 h-4 text-stone-400 absolute left-4 pointer-events-none" />
          <input
            type="text"
            placeholder="Search food, restaurants, categories..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-11 pr-16 py-2 bg-stone-100 hover:bg-stone-50 focus:bg-white text-xs rounded-2xl border border-stone-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition font-medium"
          />
          <button
            type="submit"
            className="absolute right-1.5 px-2.5 py-1 bg-stone-900 hover:bg-orange-600 text-white text-[10px] font-bold rounded-xl transition cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Right Navigation & Customer Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications Button */}
          <button
            onClick={() => onNavigate('notifications')}
            className={`p-2.5 rounded-xl border border-stone-200/80 hover:border-orange-200 hover:bg-orange-50/50 text-stone-700 hover:text-orange-600 relative transition cursor-pointer ${
              currentView === 'notifications' ? 'bg-orange-50 text-orange-600 border-orange-300' : ''
            }`}
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-orange-600 animate-pulse" />
          </button>

          {/* Wishlist Button */}
          <button
            onClick={() => onNavigate('wishlist')}
            className={`p-2.5 rounded-xl border border-stone-200/80 hover:border-orange-200 hover:bg-orange-50/50 text-stone-700 hover:text-orange-600 relative transition cursor-pointer ${
              currentView === 'wishlist' ? 'bg-orange-50 text-orange-600 border-orange-300' : ''
            }`}
            title="Wishlist"
          >
            <Heart className="w-4 h-4" />
            {totalWishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {totalWishlistCount}
              </span>
            )}
          </button>

          {/* Cart Button */}
          <button
            onClick={() => onNavigate('cart')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition font-bold text-xs cursor-pointer border ${
              totalItemCount > 0
                ? 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600 shadow-md shadow-orange-500/20'
                : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200/80'
            }`}
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4" />
              {totalItemCount > 0 && (
                <span className="absolute -top-2 -right-2.5 w-4 h-4 rounded-full bg-stone-900 text-white text-[10px] font-black flex items-center justify-center border-2 border-orange-600">
                  {totalItemCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">
              {totalItemCount > 0 ? `₹${grandTotal}` : 'Cart'}
            </span>
          </button>

          {/* Customer Authentication Dropdown / Login Button */}
          {userProfile ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-2xl hover:bg-stone-100 border border-stone-200 transition cursor-pointer"
              >
                <img
                  src={
                    userProfile.photoURL ||
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80'
                  }
                  alt={userProfile.name}
                  className="w-7 h-7 rounded-xl object-cover border border-stone-300"
                />
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-stone-800 leading-tight max-w-[90px] truncate">
                    {userProfile.name}
                  </p>
                  <p className="text-[10px] font-bold text-stone-400 leading-tight">
                    Customer
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              </button>

              {isUserMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 animate-fade-in"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-stone-100">
                    <p className="text-xs font-bold text-stone-900">{userProfile.name}</p>
                    <p className="text-[11px] text-stone-500 font-mono truncate">
                      {userProfile.phone || userProfile.email}
                    </p>
                  </div>

                  {/* Customer Navigation Links strictly */}
                  <div className="py-1">
                    <button
                      onClick={() => onNavigate('customer-orders')}
                      className="w-full text-left px-4 py-2 text-xs text-stone-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      Orders
                    </button>
                    <button
                      onClick={() => onNavigate('track')}
                      className="w-full text-left px-4 py-2 text-xs text-stone-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <Activity className="w-3.5 h-3.5 text-orange-500" />
                      Live Tracking
                    </button>
                    <button
                      onClick={() => onNavigate('wishlist')}
                      className="w-full text-left px-4 py-2 text-xs text-stone-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <Heart className="w-3.5 h-3.5 text-stone-400" />
                      Wishlist
                    </button>
                    <button
                      onClick={() => onNavigate('reviews')}
                      className="w-full text-left px-4 py-2 text-xs text-stone-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-500" />
                      Reviews
                    </button>
                    <button
                      onClick={() => onNavigate('notifications')}
                      className="w-full text-left px-4 py-2 text-xs text-stone-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <Bell className="w-3.5 h-3.5 text-orange-500" />
                      Notifications
                    </button>
                    <button
                      onClick={() => onNavigate('profile')}
                      className="w-full text-left px-4 py-2 text-xs text-stone-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-stone-400" />
                      Profile
                    </button>
                  </div>

                  <div className="pt-1 border-t border-stone-100">
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-medium transition cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => onOpenAuthModal('customer')}
                className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                title="Customer Sign-In"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Customer Login</span>
                <span className="sm:hidden">Login</span>
              </button>

              <button
                onClick={() => onOpenAuthModal('seller')}
                className="hidden sm:flex items-center gap-1 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs rounded-xl transition cursor-pointer"
                title="Restaurant Partner Portal"
              >
                <Store className="w-3.5 h-3.5 text-amber-600" />
                <span>Partner</span>
              </button>

              <button
                onClick={() => onOpenAuthModal('admin')}
                className="p-2 text-stone-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition cursor-pointer"
                title="Admin Access Gateway"
                aria-label="Admin Access"
              >
                <Lock className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
