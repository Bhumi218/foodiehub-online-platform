import React from 'react';
import { Home, UtensilsCrossed, ShoppingBag, Clock, User, Heart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

interface MobileNavProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: (tab: 'customer' | 'seller' | 'admin') => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentView, onNavigate, onOpenAuth }) => {
  const { totalItemCount } = useCart();
  const { userProfile } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-stone-200 md:hidden py-2 px-3 flex items-center justify-around shadow-2xl">
      <button
        onClick={() => onNavigate('home')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition cursor-pointer ${
          currentView === 'home' ? 'text-orange-600 font-bold' : 'text-stone-500'
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px]">Home</span>
      </button>

      <button
        onClick={() => onNavigate('foods')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition cursor-pointer ${
          currentView === 'foods' ? 'text-orange-600 font-bold' : 'text-stone-500'
        }`}
      >
        <UtensilsCrossed className="w-5 h-5" />
        <span className="text-[10px]">Food</span>
      </button>

      <button
        onClick={() => onNavigate('cart')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition relative cursor-pointer ${
          currentView === 'cart' ? 'text-orange-600 font-bold' : 'text-stone-500'
        }`}
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5" />
          {totalItemCount > 0 && (
            <span className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full bg-orange-600 text-white text-[9px] font-black flex items-center justify-center">
              {totalItemCount}
            </span>
          )}
        </div>
        <span className="text-[10px]">Cart</span>
      </button>

      <button
        onClick={() => {
          if (!userProfile) {
            onOpenAuth('customer');
          } else {
            onNavigate('customer-orders');
          }
        }}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition cursor-pointer ${
          currentView === 'customer-orders' ? 'text-orange-600 font-bold' : 'text-stone-500'
        }`}
      >
        <Clock className="w-5 h-5" />
        <span className="text-[10px]">Orders</span>
      </button>

      {userProfile ? (
        <button
          onClick={() => onNavigate('profile')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition cursor-pointer ${
            currentView === 'profile' ? 'text-orange-600 font-bold' : 'text-stone-500'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">Profile</span>
        </button>
      ) : (
        <button
          onClick={() => onOpenAuth('customer')}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-stone-500 transition cursor-pointer"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">Login</span>
        </button>
      )}
    </nav>
  );
};
