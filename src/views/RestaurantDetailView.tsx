import React, { useState } from 'react';
import { Restaurant, FoodItem, Review } from '../types';
import { FoodCard } from '../components/customer/FoodCard';
import { useWishlist } from '../context/WishlistContext';
import {
  Star,
  Clock,
  MapPin,
  Heart,
  Phone,
  Info,
  Calendar,
  ChevronLeft,
  Search,
  Filter,
  Flame,
  MessageCircle,
} from 'lucide-react';

interface RestaurantDetailViewProps {
  restaurant: Restaurant;
  foodItems: FoodItem[];
  reviews: Review[];
  onBack: () => void;
}

export const RestaurantDetailView: React.FC<RestaurantDetailViewProps> = ({
  restaurant,
  foodItems,
  reviews,
  onBack,
}) => {
  const { isRestaurantFavourite, toggleFavouriteRestaurant } = useWishlist();
  const isFav = isRestaurantFavourite(restaurant.restaurantId);

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [menuSearch, setMenuSearch] = useState<string>('');
  const [vegOnly, setVegOnly] = useState<boolean>(false);

  const restaurantFoods = foodItems.filter((f) => f.restaurantId === restaurant.restaurantId);
  const restaurantReviews = reviews.filter((r) => r.restaurantId === restaurant.restaurantId);

  // Available categories in this restaurant's menu
  const menuCategories = ['All', ...Array.from(new Set(restaurantFoods.map((f) => f.category)))];

  // Filter foods
  const filteredFoods = restaurantFoods.filter((food) => {
    if (activeCategory !== 'All' && food.category !== activeCategory) return false;
    if (vegOnly && food.foodType !== 'veg') return false;
    if (menuSearch.trim()) {
      const q = menuSearch.toLowerCase();
      return (
        food.name.toLowerCase().includes(q) ||
        food.description.toLowerCase().includes(q) ||
        food.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const isOpen = restaurant.status === 'open';

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      {/* Top Back Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-orange-600 transition bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-2xs"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Restaurants</span>
        </button>
      </div>

      {/* Restaurant Hero Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2">
        <div className="relative rounded-3xl overflow-hidden bg-stone-900 text-white shadow-xl">
          <div className="aspect-21/9 sm:aspect-16/5 w-full relative">
            <img
              src={restaurant.coverImage}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          </div>

          {/* Restaurant Details Overlay */}
          <div className="p-6 sm:p-8 relative -mt-16 sm:-mt-20 z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-1 shadow-2xl border border-stone-200 overflow-hidden flex-shrink-0">
                <img
                  src={restaurant.logo}
                  alt={restaurant.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black font-heading text-white">
                    {restaurant.name}
                  </h1>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isOpen
                        ? 'bg-emerald-500 text-emerald-950'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    {isOpen ? 'Open Now' : 'Closed'}
                  </span>
                </div>

                <p className="text-xs text-stone-300 mt-1 font-medium">
                  {restaurant.cuisine.join(' • ')}
                </p>

                <p className="text-xs text-stone-400 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-orange-400" />
                  <span>{restaurant.address}</span>
                </p>
              </div>
            </div>

            {/* Quick Actions & KPIs */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20">
                <div className="text-center pr-3 border-r border-white/20">
                  <div className="flex items-center justify-center gap-1 text-amber-400 font-black text-sm">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>{restaurant.rating}</span>
                  </div>
                  <span className="text-[10px] text-stone-300 font-medium">
                    {restaurant.reviewsCount} ratings
                  </span>
                </div>

                <div className="text-center pr-3 border-r border-white/20">
                  <div className="text-sm font-black text-white">{restaurant.deliveryTime}</div>
                  <span className="text-[10px] text-stone-300 font-medium">Delivery</span>
                </div>

                <div className="text-center">
                  <div className="text-sm font-black text-white">₹{restaurant.minOrder}</div>
                  <span className="text-[10px] text-stone-300 font-medium">Min Order</span>
                </div>
              </div>

              <button
                onClick={() => toggleFavouriteRestaurant(restaurant.restaurantId, restaurant.name)}
                className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition flex-shrink-0"
                aria-label="Save restaurant"
              >
                <Heart className={`w-5 h-5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Notice & Description */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs text-xs text-stone-600 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <p className="leading-relaxed text-stone-700">
            <span className="font-bold text-stone-900">About: </span>
            {restaurant.description}
          </p>
          <div className="flex items-center gap-4 text-stone-500 flex-shrink-0">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              Hours: {restaurant.openingHours}
            </span>
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-stone-400" />
              {restaurant.phone}
            </span>
          </div>
        </div>
      </div>

      {/* Menu Filter & Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sticky top-18 z-30">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-stone-200/90 shadow-md flex flex-wrap items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none max-w-full">
            {menuCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Quick Veg Filter & Search */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setVegOnly(!vegOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                vegOnly
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Veg Only</span>
            </button>

            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search dish in menu..."
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-orange-500 font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Menu Dishes Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black font-heading text-stone-900 tracking-tight">
            {activeCategory === 'All' ? 'Full Menu Catalog' : `${activeCategory} Specialties`}
            <span className="text-xs font-semibold text-stone-400 ml-2">
              ({filteredFoods.length} items)
            </span>
          </h2>
        </div>

        {filteredFoods.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
            <p className="text-3xl mb-2">🍽️</p>
            <h3 className="text-base font-bold text-stone-800">No dishes match your filter</h3>
            <p className="text-xs text-stone-500 mt-1">
              Try adjusting your category, veg-only toggle, or search query.
            </p>
            <button
              onClick={() => {
                setActiveCategory('All');
                setVegOnly(false);
                setMenuSearch('');
              }}
              className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredFoods.map((food) => (
              <FoodCard key={food.foodId} food={food} restaurantName={restaurant.name} />
            ))}
          </div>
        )}
      </div>

      {/* Verified Customer Reviews Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-6">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-orange-600" />
              <h3 className="text-xl font-black font-heading text-stone-900 tracking-tight">
                Verified Diner Ratings & Reviews
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              <span>{restaurant.rating} Platform Score</span>
            </div>
          </div>

          {restaurantReviews.length === 0 ? (
            <p className="text-xs text-stone-500 italic py-4">
              Be the first to order and leave a verified review for {restaurant.name}!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {restaurantReviews.map((rev) => (
                <div
                  key={rev.reviewId}
                  className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-stone-900">{rev.customerName}</span>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    {rev.foodName && (
                      <span className="text-[11px] text-orange-600 font-semibold block mb-1">
                        Ordered: {rev.foodName}
                      </span>
                    )}
                    <p className="text-xs text-stone-600 leading-relaxed italic">
                      "{rev.comment}"
                    </p>
                  </div>
                  <span className="text-[10px] text-stone-400 mt-3 block">
                    Verified Order • {new Date(rev.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
