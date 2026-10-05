import React from 'react';
import { FoodItem } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { Plus, Minus, Star, Heart, Flame } from 'lucide-react';

interface FoodCardProps {
  food: FoodItem;
  restaurantName?: string;
  onOpenRestaurant?: (restaurantId: string) => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({ food, restaurantName, onOpenRestaurant }) => {
  const { items, addToCart, updateQuantity } = useCart();
  const { isFoodFavourite, toggleFavouriteFood } = useWishlist();

  const isFav = isFoodFavourite(food.foodId);
  const cartItem = items.find((i) => i.food.foodId === food.foodId);
  const quantity = cartItem ? cartItem.quantity : 0;

  const isAvailable = food.availability === 'active';

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAvailable) return;
    addToCart(food, {
      restaurantId: food.restaurantId,
      name: restaurantName || 'Partner Kitchen',
    });
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateQuantity(food.foodId, quantity + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateQuantity(food.foodId, quantity - 1);
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden group">
      <div>
        {/* Food Image with Badges */}
        <div className="relative aspect-4/3 w-full bg-stone-100 overflow-hidden">
          <img
            src={food.image}
            alt={food.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

          {/* Veg / Non-Veg Indicator */}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md p-1 rounded-md shadow-xs">
            <div
              className={`w-3.5 h-3.5 border-2 rounded-xs flex items-center justify-center ${
                food.foodType === 'veg' ? 'border-emerald-600' : 'border-rose-600'
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  food.foodType === 'veg' ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              />
            </div>
          </div>

          {/* Bestseller Badge */}
          {food.isBestseller && (
            <div className="absolute top-3 left-10 bg-amber-500/95 text-stone-950 font-black text-[10px] uppercase px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1">
              <Flame className="w-3 h-3 fill-stone-950" />
              Bestseller
            </div>
          )}

          {/* Wishlist Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavouriteFood(food.foodId, food.name);
            }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-stone-600 hover:text-rose-500 shadow-sm transition"
            aria-label="Save to favourites"
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          {/* Out of Stock Overlay */}
          {!isAvailable && (
            <div className="absolute inset-0 bg-stone-900/70 backdrop-blur-[2px] flex items-center justify-center">
              <span className="px-3 py-1 bg-stone-800 text-stone-200 text-xs font-bold rounded-lg border border-stone-600 uppercase tracking-wider">
                Out of Stock
              </span>
            </div>
          )}

          {/* Category Pill */}
          <div className="absolute bottom-2.5 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
            {food.category}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h3 className="font-bold text-stone-900 text-sm group-hover:text-orange-600 transition leading-snug line-clamp-1">
              {food.name}
            </h3>
            <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60 flex-shrink-0">
              <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
              <span className="text-[11px] font-bold text-amber-900">{food.rating}</span>
            </div>
          </div>

          <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
            {food.description}
          </p>

          {restaurantName && onOpenRestaurant && (
            <button
              onClick={() => onOpenRestaurant(food.restaurantId)}
              className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 hover:underline mt-2 text-left block"
            >
              by {restaurantName} →
            </button>
          )}
        </div>
      </div>

      {/* Footer Price & Add to Cart */}
      <div className="p-4 pt-0 border-t border-stone-100 flex items-center justify-between gap-3 mt-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-extrabold text-stone-900">
            ₹{food.discountPrice || food.price}
          </span>
          {food.discountPrice && (
            <span className="text-xs text-stone-400 line-through">
              ₹{food.price}
            </span>
          )}
        </div>

        {/* Quantity Controls or Add Button */}
        {isAvailable ? (
          quantity > 0 ? (
            <div className="flex items-center bg-orange-600 text-white rounded-xl shadow-xs font-bold text-xs">
              <button
                onClick={handleDecrement}
                className="w-7 h-7 flex items-center justify-center hover:bg-orange-700 rounded-l-xl transition"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-xs">{quantity}</span>
              <button
                onClick={handleIncrement}
                className="w-7 h-7 flex items-center justify-center hover:bg-orange-700 rounded-r-xl transition"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="px-3.5 py-1.5 bg-orange-50 hover:bg-orange-600 text-orange-700 hover:text-white border border-orange-200 hover:border-orange-600 rounded-xl font-bold text-xs transition duration-200 flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          )
        ) : (
          <span className="text-[11px] font-semibold text-stone-400">Unavailable</span>
        )}
      </div>
    </div>
  );
};
