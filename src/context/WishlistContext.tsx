import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';

interface WishlistContextType {
  favouriteFoods: string[];
  favouriteRestaurants: string[];
  toggleFavouriteFood: (foodId: string, name?: string) => void;
  toggleFavouriteRestaurant: (restaurantId: string, name?: string) => void;
  isFoodFavourite: (foodId: string) => boolean;
  isRestaurantFavourite: (restaurantId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const LOCAL_STORAGE_FAV_FOODS = 'foodiehub_fav_foods';
const LOCAL_STORAGE_FAV_RESTS = 'foodiehub_fav_restaurants';

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();

  const [favouriteFoods, setFavouriteFoods] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_FAV_FOODS);
      return saved ? JSON.parse(saved) : ['food-1', 'food-5', 'food-9'];
    } catch {
      return ['food-1', 'food-5', 'food-9'];
    }
  });

  const [favouriteRestaurants, setFavouriteRestaurants] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_FAV_RESTS);
      return saved ? JSON.parse(saved) : ['rest-1', 'rest-2'];
    } catch {
      return ['rest-1', 'rest-2'];
    }
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_FAV_FOODS, JSON.stringify(favouriteFoods));
  }, [favouriteFoods]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_FAV_RESTS, JSON.stringify(favouriteRestaurants));
  }, [favouriteRestaurants]);

  const toggleFavouriteFood = (foodId: string, name?: string) => {
    setFavouriteFoods((prev) => {
      const exists = prev.includes(foodId);
      if (exists) {
        showToast({
          type: 'info',
          title: 'Removed from Favourites',
          message: name ? `${name} removed from your wishlist.` : undefined,
          duration: 2000,
        });
        return prev.filter((id) => id !== foodId);
      } else {
        showToast({
          type: 'success',
          title: 'Saved to Favourites',
          message: name ? `${name} saved to your wishlist.` : undefined,
          duration: 2000,
        });
        return [...prev, foodId];
      }
    });
  };

  const toggleFavouriteRestaurant = (restaurantId: string, name?: string) => {
    setFavouriteRestaurants((prev) => {
      const exists = prev.includes(restaurantId);
      if (exists) {
        showToast({
          type: 'info',
          title: 'Removed from Favourites',
          message: name ? `${name} removed from saved restaurants.` : undefined,
          duration: 2000,
        });
        return prev.filter((id) => id !== restaurantId);
      } else {
        showToast({
          type: 'success',
          title: 'Saved to Favourites',
          message: name ? `${name} added to favourite restaurants.` : undefined,
          duration: 2000,
        });
        return [...prev, restaurantId];
      }
    });
  };

  const isFoodFavourite = (foodId: string) => favouriteFoods.includes(foodId);
  const isRestaurantFavourite = (restaurantId: string) => favouriteRestaurants.includes(restaurantId);

  return (
    <WishlistContext.Provider
      value={{
        favouriteFoods,
        favouriteRestaurants,
        toggleFavouriteFood,
        toggleFavouriteRestaurant,
        isFoodFavourite,
        isRestaurantFavourite,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
};
