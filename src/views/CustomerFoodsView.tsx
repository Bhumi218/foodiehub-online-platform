import React, { useState } from 'react';
import { FoodItem } from '../types';
import { FoodCard } from '../components/customer/FoodCard';
import { CATEGORIES } from '../services/seedData';
import { Search, Filter, ArrowUpDown, Sparkles, UtensilsCrossed } from 'lucide-react';

interface CustomerFoodsViewProps {
  foodItems: FoodItem[];
  initialCategory?: string;
  onSelectCategory?: (category: string) => void;
}

export const CustomerFoodsView: React.FC<CustomerFoodsViewProps> = ({
  foodItems,
  initialCategory = 'All',
  onSelectCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'price_asc' | 'price_desc'>('popular');

  // Filter ONLY published and active dishes as required by spec
  const publishedFoods = foodItems.filter(
    (f) => (f.status === 'published' || !f.status) && f.available !== false
  );

  let filtered = publishedFoods.filter((f) => {
    // Category match
    if (selectedCategory !== 'All' && f.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    // Dietary match
    if (dietaryFilter === 'veg' && f.foodType !== 'veg') return false;
    if (dietaryFilter === 'non-veg' && f.foodType !== 'non-veg') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = f.name?.toLowerCase().includes(q);
      const matchDesc = f.description?.toLowerCase().includes(q);
      const matchRest = f.restaurantName?.toLowerCase().includes(q);
      const matchCuisine = f.cuisine?.toLowerCase().includes(q);
      const matchTags = f.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchRest && !matchCuisine && !matchTags) return false;
    }

    return true;
  });

  // Sorting logic
  filtered.sort((a, b) => {
    if (sortBy === 'rating') {
      return (b.rating || 0) - (a.rating || 0);
    }
    if (sortBy === 'price_asc') {
      const priceA = a.discountPrice || a.price;
      const priceB = b.discountPrice || b.price;
      return priceA - priceB;
    }
    if (sortBy === 'price_desc') {
      const priceA = a.discountPrice || a.price;
      const priceB = b.discountPrice || b.price;
      return priceB - priceA;
    }
    // Default 'popular': bestsellers first, then highest rating
    if (a.isBestseller && !b.isBestseller) return -1;
    if (!a.isBestseller && b.isBestseller) return 1;
    return (b.rating || 0) - (a.rating || 0);
  });

  return (
    <div className="min-h-screen bg-stone-50 pb-24 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold uppercase tracking-wider mb-2">
              <UtensilsCrossed className="w-3.5 h-3.5 text-orange-600" />
              <span>Live Marketplace Catalog</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-heading text-stone-900 tracking-tight">
              Explore Gourmet Dishes
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-xl">
              Freshly cooked by verified master chefs. All dishes synchronize directly from Firestore in real time.
            </p>
          </div>

          {/* Search bar inside food view */}
          <div className="w-full md:w-80 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dishes, ingredients, chefs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-2xl text-xs font-medium focus:border-orange-500 focus:outline-none shadow-xs"
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => {
              setSelectedCategory('All');
              if (onSelectCategory) onSelectCategory('All');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.name);
                if (onSelectCategory) onSelectCategory(cat.name);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                selectedCategory.toLowerCase() === cat.name.toLowerCase()
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
              }`}
            >
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Secondary Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs">
          {/* Dietary radio buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase text-stone-400 mr-1">Dietary:</span>
            <button
              onClick={() => setDietaryFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                dietaryFilter === 'all' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setDietaryFilter('veg')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition cursor-pointer ${
                dietaryFilter === 'veg'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-stone-100 text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Pure Veg</span>
            </button>
            <button
              onClick={() => setDietaryFilter('non-veg')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition cursor-pointer ${
                dietaryFilter === 'non-veg'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-stone-100 text-rose-800 hover:bg-rose-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              <span>Non-Veg</span>
            </button>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-stone-400 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" /> Sort by:
            </span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-1.5 bg-stone-100 rounded-xl text-xs font-bold text-stone-800 border-none outline-none cursor-pointer"
            >
              <option value="popular">Popular Dishes</option>
              <option value="rating">Top Rated (Highest First)</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Food Items Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-2">
            {filtered.map((food) => (
              <FoodCard key={food.id || food.foodId} food={food} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-xs max-w-md mx-auto my-12">
            <UtensilsCrossed className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-900">No dishes found</h3>
            <p className="text-xs text-stone-500 mt-1">
              Try changing your dietary or category filter to discover more mouth-watering meals.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setDietaryFilter('all');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition cursor-pointer"
            >
              View All Food Items
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
