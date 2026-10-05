import React, { useState } from 'react';
import { Restaurant } from '../types';
import { RestaurantCard } from '../components/customer/RestaurantCard';
import { Search, Star, Clock, Filter, Sparkles, Building } from 'lucide-react';

interface CustomerRestaurantsViewProps {
  restaurants: Restaurant[];
  onOpenRestaurant: (restaurantId: string) => void;
}

export const CustomerRestaurantsView: React.FC<CustomerRestaurantsViewProps> = ({
  restaurants,
  onOpenRestaurant,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [minRating, setMinRating] = useState<number>(0);
  const [filterFastDelivery, setFilterFastDelivery] = useState(false);

  const cuisines = [
    'All',
    'Biryani',
    'Indian',
    'Italian',
    'Fast Food',
    'Chinese',
    'South Indian',
    'Desserts',
    'Beverages',
  ];

  const filteredRestaurants = restaurants.filter((r) => {
    if (selectedCuisine !== 'All') {
      const hasCuisine = r.cuisine?.some((c) =>
        c.toLowerCase().includes(selectedCuisine.toLowerCase())
      );
      if (!hasCuisine) return false;
    }
    if (minRating > 0 && (r.rating || 0) < minRating) return false;
    if (filterFastDelivery && !r.deliveryTime?.includes('20') && !r.deliveryTime?.includes('25')) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.name?.toLowerCase().includes(q);
      const matchAddress = r.address?.toLowerCase().includes(q);
      const matchCuisine = r.cuisine?.some((c) => c.toLowerCase().includes(q));
      if (!matchName && !matchAddress && !matchCuisine) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-stone-50 pb-24 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold uppercase tracking-wider mb-2">
              <Building className="w-3.5 h-3.5 text-orange-600" />
              <span>Gourmet Kitchens</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-heading text-stone-900 tracking-tight">
              Partner Restaurants
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-xl">
              Explore authentic regional kitchens, top-rated local dining spots, and artisan chefs with verified hygiene standards.
            </p>
          </div>

          {/* Search bar inside view */}
          <div className="w-full md:w-80 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by restaurant name or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-2xl text-xs font-medium focus:border-orange-500 focus:outline-none shadow-xs"
            />
          </div>
        </div>

        {/* Cuisine Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {cuisines.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCuisine(c)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCuisine === c
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Secondary Quick Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setMinRating(minRating === 4.5 ? 0 : 4.5)}
            className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              minRating === 4.5
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>Top Rated 4.5+</span>
          </button>

          <button
            onClick={() => setFilterFastDelivery(!filterFastDelivery)}
            className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              filterFastDelivery
                ? 'bg-orange-600 text-white border-orange-600'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Under 30 Mins</span>
          </button>

          {(selectedCuisine !== 'All' || minRating > 0 || filterFastDelivery || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCuisine('All');
                setMinRating(0);
                setFilterFastDelivery(false);
                setSearchQuery('');
              }}
              className="text-stone-500 hover:text-rose-600 text-xs font-bold underline ml-2 cursor-pointer"
            >
              Reset Filters
            </button>
          )}

          <span className="ml-auto text-xs text-stone-400 font-bold">
            Showing {filteredRestaurants.length} {filteredRestaurants.length === 1 ? 'kitchen' : 'kitchens'}
          </span>
        </div>

        {/* Restaurant Cards Grid */}
        {filteredRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-2">
            {filteredRestaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.restaurantId}
                restaurant={restaurant}
                onClick={() => onOpenRestaurant(restaurant.restaurantId)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-xs max-w-md mx-auto my-12">
            <Building className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-900">No restaurants match your filters</h3>
            <p className="text-xs text-stone-500 mt-1">
              Try adjusting your cuisine or rating filter to discover more dining options.
            </p>
            <button
              onClick={() => {
                setSelectedCuisine('All');
                setMinRating(0);
                setFilterFastDelivery(false);
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition"
            >
              Show All Restaurants
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
