import React, { createContext, useContext, useState, useEffect } from 'react';
import { FoodItem, CartItem, Coupon } from '../types';
import { useToast } from './ToastContext';
import { INITIAL_COUPONS } from '../services/seedData';

interface CartContextType {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  appliedCoupon: Coupon | null;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  grandTotal: number;
  totalItemCount: number;
  addToCart: (food: FoodItem, restaurant: { restaurantId: string; name: string }) => boolean;
  removeFromCart: (foodId: string) => void;
  updateQuantity: (foodId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  promptDifferentRestaurant: {
    isOpen: boolean;
    pendingFood?: FoodItem;
    pendingRestaurant?: { restaurantId: string; name: string };
  };
  confirmReplaceCart: () => void;
  cancelReplaceCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_CART = 'foodiehub_cart_items';
const LOCAL_STORAGE_COUPON = 'foodiehub_applied_coupon';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();

  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CART);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_COUPON);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [promptDifferentRestaurant, setPromptDifferentRestaurant] = useState<{
    isOpen: boolean;
    pendingFood?: FoodItem;
    pendingRestaurant?: { restaurantId: string; name: string };
  }>({ isOpen: false });

  // Save cart state
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_CART, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem(LOCAL_STORAGE_COUPON, JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_COUPON);
    }
  }, [appliedCoupon]);

  const restaurantId = items.length > 0 ? items[0].restaurantId : null;
  const restaurantName = items.length > 0 ? items[0].restaurantName : null;

  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = items.reduce((sum, item) => {
    const itemPrice = item.food.discountPrice || item.food.price;
    return sum + itemPrice * item.quantity;
  }, 0);

  const deliveryFee = subtotal === 0 ? 0 : subtotal >= 500 ? 0 : 40;
  const tax = Math.round(subtotal * 0.05); // 5% GST

  // Calculate discount based on applied coupon
  let discount = 0;
  if (appliedCoupon && subtotal >= appliedCoupon.minOrder) {
    if (appliedCoupon.discountType === 'percentage') {
      const calculated = (subtotal * appliedCoupon.discount) / 100;
      discount = appliedCoupon.maxDiscount ? Math.min(calculated, appliedCoupon.maxDiscount) : calculated;
    } else {
      discount = appliedCoupon.discount;
    }
    discount = Math.min(discount, subtotal);
  }

  const grandTotal = Math.max(0, subtotal + deliveryFee + tax - discount);

  const addToCart = (food: FoodItem, restaurant: { restaurantId: string; name: string }): boolean => {
    if (food.availability === 'out_of_stock' || food.availability === 'inactive') {
      showToast({ type: 'error', title: 'Item Unavailable', message: `${food.name} is currently out of stock.` });
      return false;
    }

    if (items.length > 0 && items[0].restaurantId !== restaurant.restaurantId) {
      // Prompt user to replace existing cart
      setPromptDifferentRestaurant({
        isOpen: true,
        pendingFood: food,
        pendingRestaurant: restaurant,
      });
      return false;
    }

    setItems((prev) => {
      const existing = prev.find((i) => i.food.foodId === food.foodId);
      if (existing) {
        return prev.map((i) =>
          i.food.foodId === food.foodId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          food,
          quantity: 1,
          restaurantId: restaurant.restaurantId,
          restaurantName: restaurant.name,
        },
      ];
    });

    showToast({
      type: 'success',
      title: 'Added to Cart',
      message: `${food.name} added to your order.`,
      duration: 2500,
    });
    return true;
  };

  const confirmReplaceCart = () => {
    if (promptDifferentRestaurant.pendingFood && promptDifferentRestaurant.pendingRestaurant) {
      const { pendingFood, pendingRestaurant } = promptDifferentRestaurant;
      setItems([
        {
          food: pendingFood,
          quantity: 1,
          restaurantId: pendingRestaurant.restaurantId,
          restaurantName: pendingRestaurant.name,
        },
      ]);
      setAppliedCoupon(null);
      showToast({
        type: 'info',
        title: 'Cart Updated',
        message: `Cart replaced with items from ${pendingRestaurant.name}.`,
      });
    }
    setPromptDifferentRestaurant({ isOpen: false });
  };

  const cancelReplaceCart = () => {
    setPromptDifferentRestaurant({ isOpen: false });
  };

  const removeFromCart = (foodId: string) => {
    setItems((prev) => prev.filter((i) => i.food.foodId !== foodId));
  };

  const updateQuantity = (foodId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(foodId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.food.foodId === foodId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  const applyCoupon = (code: string): { success: boolean; message: string } => {
    const cleanCode = (code || '').trim().toUpperCase();
    const found = INITIAL_COUPONS.find((c) => c.code === cleanCode && c.active);

    if (!found) {
      return { success: false, message: 'Invalid or expired coupon code.' };
    }

    if (subtotal < found.minOrder) {
      return {
        success: false,
        message: `Add ₹${found.minOrder - subtotal} more to apply code ${found.code}. (Min order: ₹${found.minOrder})`,
      };
    }

    setAppliedCoupon(found);
    return { success: true, message: `Coupon ${found.code} applied! You saved on this order.` };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast({ type: 'info', title: 'Coupon Removed' });
  };

  return (
    <CartContext.Provider
      value={{
        items,
        restaurantId,
        restaurantName,
        appliedCoupon,
        subtotal,
        tax,
        deliveryFee,
        discount,
        grandTotal,
        totalItemCount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        applyCoupon,
        removeCoupon,
        promptDifferentRestaurant,
        confirmReplaceCart,
        cancelReplaceCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
