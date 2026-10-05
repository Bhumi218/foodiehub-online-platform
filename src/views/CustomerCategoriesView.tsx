import React from 'react';
import { FoodItem } from '../types';
import { CATEGORIES } from '../services/seedData';
import { Sparkles, ArrowRight, Flame } from 'lucide-react';

interface CustomerCategoriesViewProps {
  foodItems: FoodItem[];
  onSelectCategory: (categoryName: string) => void;
}

export const CustomerCategoriesView: React.FC<CustomerCategoriesViewProps> = ({
  foodItems,
  onSelectCategory,
}) => {
  return (
    <div className="min-h-screen bg-stone-50 pb-24 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span>Taste Profiles</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-heading text-stone-900 tracking-tight">
            Food Categories
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            From smoky clay oven tandoors to artisan sourdough crusts, select your culinary mood.
          </p>
        </div>

        {/* 10 Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {CATEGORIES.map((cat) => {
            const itemCount = foodItems.filter(
              (f) =>
                f.category?.toLowerCase() === cat.name.toLowerCase() &&
                f.available !== false &&
                (f.status === 'published' || !f.status)
            ).length;

            return (
              <div
                key={cat.id}
                onClick={() => onSelectCategory(cat.name)}
                className="group relative bg-white rounded-3xl overflow-hidden border border-stone-200 shadow-xs hover:shadow-xl hover:-translate-y-1 transition duration-300 cursor-pointer flex flex-col justify-between"
              >
                {/* Image */}
                <div className="relative h-44 w-full overflow-hidden bg-stone-100">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent" />
                  <span className="absolute bottom-3 left-4 text-xs font-black text-white px-2.5 py-1 rounded-lg bg-orange-600/90 backdrop-blur-xs shadow-xs">
                    {itemCount} {itemCount === 1 ? 'Dish' : 'Dishes'}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-black font-heading text-stone-900 group-hover:text-orange-600 transition">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                      {cat.description || `Authentic ${cat.name} recipes made fresh to order.`}
                    </p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-orange-600 group-hover:translate-x-0.5 transition-transform">
                    <span>Explore Menu</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
