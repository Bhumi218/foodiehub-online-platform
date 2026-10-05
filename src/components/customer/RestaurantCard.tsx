import React from 'react';
import { Restaurant } from '../../types';
import { useWishlist } from '../../context/WishlistContext';
import { Star, Clock, MapPin, Heart, ChevronRight } from 'lucide-react';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick: () => void;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, onClick }) => {
  const { isRestaurantFavourite, toggleFavouriteRestaurant } = useWishlist();
  const isFav = isRestaurantFavourite(restaurant.restaurantId);

  const isOpen = restaurant.status === 'open';

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-3xl border border-stone-200/80 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group flex flex-col justify-between"
    >
      <div>
        {/* Cover Image & Badges */}
        <div className="relative aspect-16/9 w-full bg-stone-100 overflow-hidden">
          <img
            src={restaurant.coverImage}
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

          {/* Delivery Time Badge */}
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl shadow-xs text-xs font-bold text-stone-800 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-orange-600" />
            <span>{restaurant.deliveryTime}</span>
          </div>

          {/* Rating Pill */}
          <div className="absolute top-3 left-3 bg-emerald-600 text-white px-2.5 py-0.5 rounded-lg shadow-sm text-xs font-bold flex items-center gap-1">
            <Star className="w-3 h-3 fill-white" />
            <span>{restaurant.rating}</span>
            <span className="text-[10px] text-emerald-200">({restaurant.reviewsCount})</span>
          </div>

          {/* Favourite Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavouriteRestaurant(restaurant.restaurantId, restaurant.name);
            }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-stone-600 hover:text-rose-500 shadow-sm transition"
            aria-label="Save restaurant"
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          {/* Closed overlay */}
          {!isOpen && (
            <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-[2px] flex items-center justify-center">
              <span className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded-lg uppercase tracking-wider shadow-md">
                Currently Closed
              </span>
            </div>
          )}

          {/* Restaurant Logo Avatar */}
          <div className="absolute -bottom-4 right-4 w-12 h-12 rounded-2xl bg-white p-0.5 shadow-md border border-stone-200 overflow-hidden">
            <img
              src={restaurant.logo}
              alt={restaurant.name}
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
        </div>

        {/* Details Body */}
        <div className="p-5 pt-4">
          <div className="pr-12">
            <h3 className="font-extrabold text-stone-900 text-base group-hover:text-orange-600 transition leading-snug line-clamp-1">
              {restaurant.name}
            </h3>
            <p className="text-xs text-stone-500 font-medium mt-0.5 truncate">
              {restaurant.cuisine.join(' • ')}
            </p>
          </div>

          <p className="text-xs text-stone-500 mt-2.5 line-clamp-2 leading-relaxed">
            {restaurant.description}
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-5 pb-4 pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
        <div className="flex items-center gap-1 truncate max-w-[190px]">
          <MapPin className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
          <span className="truncate">{restaurant.address}</span>
        </div>
        <div className="flex items-center gap-1 font-bold text-orange-600 group-hover:translate-x-0.5 transition-transform flex-shrink-0">
          <span>Explore</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
