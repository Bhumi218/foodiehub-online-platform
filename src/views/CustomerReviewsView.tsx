import React, { useState } from 'react';
import { Review } from '../types';
import { Star, MessageSquare, ThumbsUp, CheckCircle, ShieldCheck } from 'lucide-react';

interface CustomerReviewsViewProps {
  reviews: Review[];
  onExploreFood: () => void;
}

export const CustomerReviewsView: React.FC<CustomerReviewsViewProps> = ({
  reviews,
  onExploreFood,
}) => {
  const [filterRating, setFilterRating] = useState<number>(0);

  const filteredReviews = reviews.filter((r) => {
    if (filterRating > 0 && r.rating !== filterRating) return false;
    return true;
  });

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '4.9';

  return (
    <div className="min-h-screen bg-stone-50 pb-24 pt-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold uppercase tracking-wider mb-2">
              <Star className="w-3.5 h-3.5 text-orange-600 fill-orange-600" />
              <span>Verified Diner Experiences</span>
            </div>
            <h1 className="text-3xl font-black font-heading text-stone-900 tracking-tight">
              Community Reviews & Ratings
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Read authentic feedback from diners who placed and completed orders on FoodieHub.
            </p>
          </div>

          {/* Average Rating Box */}
          <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-stone-200 shadow-2xs">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-stone-950 flex flex-col items-center justify-center font-black">
              <span className="text-lg leading-none">{avgRating}</span>
              <span className="text-[9px] uppercase font-bold">★ Overall</span>
            </div>
            <div>
              <p className="text-xs font-bold text-stone-900">{reviews.length} Verified Reviews</p>
              <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> 100% Real Diners
              </p>
            </div>
          </div>
        </div>

        {/* Rating Filter Pills */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-stone-500 mr-1">Filter by stars:</span>
          {[0, 5, 4, 3].map((stars) => (
            <button
              key={stars}
              onClick={() => setFilterRating(stars)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                filterRating === stars
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              {stars === 0 ? (
                'All Reviews'
              ) : (
                <>
                  <span>{stars}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </>
              )}
            </button>
          ))}
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {filteredReviews.length > 0 ? (
            filteredReviews.map((rev) => (
              <div
                key={rev.reviewId}
                className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-800 font-black text-xs flex items-center justify-center border border-orange-200">
                      {rev.customerName?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-stone-900">{rev.customerName}</h4>
                      <p className="text-[11px] text-stone-400">
                        Ordered: <span className="font-semibold text-stone-700">{rev.foodName || 'Meal'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-xs font-black text-amber-900">{rev.rating}.0</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-normal">
                  "{rev.comment}"
                </p>

                {rev.photoURL && (
                  <div className="pt-2">
                    <img
                      src={rev.photoURL}
                      alt="Food photo"
                      className="w-24 h-24 rounded-xl object-cover border border-stone-200"
                    />
                  </div>
                )}

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Purchase
                  </span>
                  <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-xs">
              <MessageSquare className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-stone-800">No reviews found for this rating</h3>
              <p className="text-xs text-stone-500 mt-1">Try selecting "All Reviews" to see other diner feedback.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
