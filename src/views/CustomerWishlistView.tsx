import React, { useState } from 'react';
import { Restaurant, FoodItem } from '../types';
import { useWishlist } from '../context/WishlistContext';
import { FoodCard } from '../components/customer/FoodCard';
import { RestaurantCard } from '../components/customer/RestaurantCard';
import { Heart, Utensils, Store, ChevronRight } from 'lucide-react';

interface CustomerWishlistViewProps {
  restaurants: Restaurant[];
  foodItems: FoodItem[];
  onOpenRestaurant: (restaurantId: string) => void;
  onExploreFood: () => void;
}

export const CustomerWishlistView: React.FC<CustomerWishlistViewProps> = ({
  restaurants,
  foodItems,
  onOpenRestaurant,
  onExploreFood,
}) => {
  const { favouriteFoods, favouriteRestaurants } = useWishlist();
  const [activeTab, setActiveTab] = useState<'foods' | 'restaurants'>('foods');

  const savedDishes = foodItems.filter((f) => favouriteFoods.includes(f.foodId));
  const savedKitchens = restaurants.filter((r) => favouriteRestaurants.includes(r.restaurantId));

  return (
    <div className="min-h-screen bg-stone-50 pb-24 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-rose-500 mb-1">
              <Heart className="w-5 h-5 fill-rose-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">
                Your Culinary Collection
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading text-stone-900 tracking-tight">
              Favourites & Wishlist
            </h1>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-stone-200/70 p-1 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('foods')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
                activeTab === 'foods'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Saved Dishes ({savedDishes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('restaurants')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
                activeTab === 'restaurants'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Kitchens ({savedKitchens.length})</span>
            </button>
          </div>
        </div>

        {activeTab === 'foods' ? (
          savedDishes.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-stone-800">No saved dishes yet</h3>
              <p className="text-xs text-stone-500 mt-1">
                Tap the heart on any delicious meal to bookmark it for quick ordering!
              </p>
              <button
                onClick={onExploreFood}
                className="mt-4 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition"
              >
                Browse Trending Dishes
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {savedDishes.map((food) => {
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
        ) : savedKitchens.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
              <Store className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-stone-800">No favourite kitchens yet</h3>
            <p className="text-xs text-stone-500 mt-1">
              Save your favourite biryani points, pizza spots, and bistros here.
            </p>
            <button
              onClick={onExploreFood}
              className="mt-4 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition"
            >
              Discover Kitchens
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedKitchens.map((restaurant) => (
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
  );
};
