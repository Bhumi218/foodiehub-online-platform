import React from 'react';
import { Flame, ShieldCheck, Heart, Smartphone, ArrowUpRight } from 'lucide-react';
import { CATEGORIES } from '../../services/seedData';

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: (tab: 'customer' | 'seller' | 'admin') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenAuth }) => {
  return (
    <footer className="bg-stone-950 text-stone-300 pt-16 pb-24 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-stone-800/80">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-600/30">
                <Flame className="w-5 h-5 fill-white" />
              </div>
              <span className="text-2xl font-black font-heading tracking-tight text-white">
                FoodieHub
              </span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed max-w-sm">
              India's premier artisan food marketplace connecting conscious diners with the city's finest independent kitchens, authentic regional restaurants, and gourmet culinary crafters.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <div className="flex items-center gap-2 bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-stone-300 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Verified Kitchens & Payments</span>
              </div>
            </div>
          </div>

          {/* Popular Cuisines */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Popular Cuisines
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              {['Dum Biryani', 'Woodfired Pizza', 'Smash Burgers', 'South Indian', 'Authentic Chinese', 'Artisan Desserts'].map((item) => (
                <li key={item}>
                  <button
                    onClick={() => onNavigate('search', item)}
                    className="hover:text-orange-400 transition"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Navigation */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>
                <button
                  onClick={() => onNavigate('restaurants')}
                  className="hover:text-orange-400 transition text-left cursor-pointer"
                >
                  Partner Restaurants
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('foods')}
                  className="hover:text-orange-400 transition text-left cursor-pointer"
                >
                  Gourmet Food Menu
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('categories')}
                  className="hover:text-orange-400 transition text-left cursor-pointer"
                >
                  Browse Categories
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('customer-orders')}
                  className="hover:text-orange-400 transition text-left cursor-pointer"
                >
                  Track Orders
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('wishlist')}
                  className="hover:text-orange-400 transition text-left cursor-pointer"
                >
                  Saved Wishlist
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('reviews')}
                  className="hover:text-orange-400 transition text-left cursor-pointer"
                >
                  Diner Reviews
                </button>
              </li>
            </ul>
          </div>

          {/* Download App CTA */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Get FoodieHub App
            </h4>
            <p className="text-xs text-stone-400 mb-3">
              Order on the go, track delivery bikes live on map, and unlock app-exclusive coupons.
            </p>
            <div className="space-y-2">
              <div className="bg-stone-900 border border-stone-800 rounded-xl p-2.5 flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="text-[10px] text-stone-400 uppercase">Available on</p>
                  <p className="text-xs font-bold text-white">iOS App Store & Android</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} FoodieHub Technologies Inc. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <button
              onClick={() => onOpenAuth('seller')}
              className="text-stone-400 hover:text-orange-400 transition cursor-pointer"
            >
              Partner Login
            </button>
            <button
              onClick={() => onOpenAuth('admin')}
              className="text-stone-400 hover:text-purple-400 transition cursor-pointer"
            >
              Admin Login
            </button>
            <span className="text-orange-500 flex items-center gap-1 font-medium">
              Made with <Heart className="w-3 h-3 fill-orange-500" /> for Foodies
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
