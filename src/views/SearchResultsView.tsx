import React, { useState } from 'react';
import { Restaurant, FoodItem } from '../types';
import { FoodCard } from '../components/customer/FoodCard';
import { RestaurantCard } from '../components/customer/RestaurantCard';
import { CATEGORIES } from '../services/seedData';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Star,
  Clock,
  Sparkles,
  ArrowUpDown,
  X,
} from 'lucide-react';

interface SearchResultsViewProps {
  restaurants: Restaurant[];
  foodItems: FoodItem[];
  initialQuery?: string;
  initialCategory?: string;
  onOpenRestaurant: (restaurantId: string) => void;
}

export const SearchResultsView: React.FC<SearchResultsViewProps> = ({
  restaurants,
  foodItems,
  initialQuery = '',
  initialCategory = '',
  onOpenRestaurant,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [resultType, setResultType] = useState<'dishes' | 'restaurants'>('dishes');

  // Filters
  const [vegOnly, setVegOnly] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(600);
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'price_low' | 'price_high' | 'fast_delivery'>('popular');

  // Search and filter Dishes
  let matchedFoods = foodItems.filter((item) => {
    // Category check
    if (selectedCategory && item.category.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    // Query check
    if (query.trim()) {
      const q = query.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchCat) return false;
    }
    // Veg/Non-veg
    if (vegOnly && item.foodType !== 'veg') return false;
    // Rating
    if (ratingFilter > 0 && item.rating < ratingFilter) return false;
    // Price
    const effectivePrice = item.discountPrice || item.price;
    if (effectivePrice > maxPrice) return false;

    return true;
  });

  // Sort dishes
  matchedFoods.sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'price_low') {
      const pA = a.discountPrice || a.price;
      const pB = b.discountPrice || b.price;
      return pA - pB;
    }
    if (sortBy === 'price_high') {
      const pA = a.discountPrice || a.price;
      const pB = b.discountPrice || b.price;
      return pB - pA;
    }
    if (sortBy === 'popular') return (b.ratingCount || 0) - (a.ratingCount || 0);
    return 0;
  });

  // Search and filter Restaurants
  let matchedRestaurants = restaurants.filter((r) => {
    if (query.trim()) {
      const q = query.toLowerCase();
      const matchName = r.name.toLowerCase().includes(q);
      const matchDesc = r.description.toLowerCase().includes(q);
      const matchCuisine = r.cuisine.some((c) => c.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchCuisine) return false;
    }
    if (selectedCategory) {
      const matchCuisine = r.cuisine.some((c) => c.toLowerCase() === selectedCategory.toLowerCase());
      if (!matchCuisine) return false;
    }
    if (ratingFilter > 0 && r.rating < ratingFilter) return false;
    return true;
  });

  // Sort restaurants
  matchedRestaurants.sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'fast_delivery') {
      const timeA = parseInt(a.deliveryTime) || 30;
      const timeB = parseInt(b.deliveryTime) || 30;
      return timeA - timeB;
    }
    return b.reviewsCount - a.reviewsCount;
  });

  const clearAllFilters = () => {
    setQuery('');
    setSelectedCategory('');
    setVegOnly(false);
    setRatingFilter(0);
    setMaxPrice(600);
    setSortBy('popular');
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      {/* Top Search Control Header */}
      <div className="bg-white border-b border-stone-200 py-6 px-4 sm:px-6 lg:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search food dishes, restaurants, or cuisines..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-stone-100 rounded-2xl border border-stone-200 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Type Switcher: Dishes vs Restaurants */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200 w-full sm:w-auto">
              <button
                onClick={() => setResultType('dishes')}
                className={`flex-1 sm:flex-initial px-5 py-2 text-xs font-bold rounded-xl transition ${
                  resultType === 'dishes'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Dishes ({matchedFoods.length})
              </button>
              <button
                onClick={() => setResultType('restaurants')}
                className={`flex-1 sm:flex-initial px-5 py-2 text-xs font-bold rounded-xl transition ${
                  resultType === 'restaurants'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Restaurants ({matchedRestaurants.length})
              </button>
            </div>
          </div>

          {/* Quick Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                !selectedCategory
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              All Cuisines
            </button>
            {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name === selectedCategory ? '' : cat.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                  selectedCategory === cat.name
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content & Side Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Filter Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-6 sticky top-22">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2 font-bold text-sm text-stone-900">
                  <SlidersHorizontal className="w-4 h-4 text-orange-600" />
                  <span>Refine Results</span>
                </div>
                <button
                  onClick={clearAllFilters}
                  className="text-xs font-bold text-orange-600 hover:underline"
                >
                  Reset All
                </button>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-800 bg-stone-50 focus:outline-none focus:border-orange-500"
                >
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="fast_delivery">Fastest Delivery</option>
                </select>
              </div>

              {/* Veg Toggle */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  Food Preference
                </label>
                <button
                  onClick={() => setVegOnly(!vegOnly)}
                  className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                    vegOnly
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    Pure Vegetarian Only
                  </span>
                  {vegOnly && <span>✓</span>}
                </button>
              </div>

              {/* Minimum Rating */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  Minimum Rating
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[0, 4.0, 4.5, 4.8].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRatingFilter(r)}
                      className={`py-1.5 rounded-xl text-xs font-bold transition ${
                        ratingFilter === r
                          ? 'bg-amber-500 text-stone-950 shadow-2xs'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      }`}
                    >
                      {r === 0 ? 'Any' : `${r}+ ⭐`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Price Slider (for Dishes) */}
              {resultType === 'dishes' && (
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-stone-700 mb-1">
                    <span className="uppercase tracking-wider">Max Price</span>
                    <span className="text-orange-600">₹{maxPrice}</span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={600}
                    step={25}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-orange-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                    <span>₹100</span>
                    <span>₹600+</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Results Grid */}
          <div className="lg:col-span-3">
            {resultType === 'dishes' ? (
              matchedFoods.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
                  <p className="text-4xl mb-2">🔍</p>
                  <h3 className="text-base font-bold text-stone-900">No dishes found</h3>
                  <p className="text-xs text-stone-500 mt-1">
                    We couldn't find any dishes matching "{query || selectedCategory}". Try searching for biryani, pizza, or burger.
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold"
                  >
                    Clear Search & Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {matchedFoods.map((food) => {
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
              )
            ) : matchedRestaurants.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
                <p className="text-4xl mb-2">🏪</p>
                <h3 className="text-base font-bold text-stone-900">No restaurants found</h3>
                <p className="text-xs text-stone-500 mt-1">
                  No culinary kitchens found matching "{query || selectedCategory}".
                </p>
                <button
                  onClick={clearAllFilters}
                  className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {matchedRestaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.restaurantId}
                    restaurant={restaurant}
                    onClick={() => onOpenRestaurant(restaurant.restaurantId)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
