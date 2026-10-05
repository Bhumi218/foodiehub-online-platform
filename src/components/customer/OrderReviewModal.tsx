import React, { useState } from 'react';
import { Star, X, Check, Image as ImageIcon } from 'lucide-react';
import { Order, Review } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { db } from '../../lib/firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';

interface OrderReviewModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted: (review: Review) => void;
}

export const OrderReviewModal: React.FC<OrderReviewModalProps> = ({
  order,
  isOpen,
  onClose,
  onReviewSubmitted,
}) => {
  const { userProfile } = useAuth();
  const { showToast } = useToast();

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      showToast({ type: 'error', title: 'Review Required', message: 'Please write a brief comment describing your dining experience.' });
      return;
    }

    setSubmitting(true);
    const reviewId = 'rev_' + Date.now().toString(36);
    const newReview: Review = {
      reviewId,
      customerId: order.customerId,
      customerName: userProfile?.name || order.customerName,
      customerPhoto: userProfile?.photoURL,
      restaurantId: order.restaurantId,
      orderId: order.orderId,
      foodName: order.items.map((i) => i.name).join(', '),
      rating,
      comment: comment.trim(),
      imageUrl: imageUrl.trim() || undefined,
      isReported: false,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'reviews', reviewId), newReview);
    } catch (err) {
      console.warn('Error saving review to Firestore:', err);
    }

    setSubmitting(false);
    showToast({
      type: 'success',
      title: 'Review Published!',
      message: 'Thank you for rating your meal. Your feedback helps our partner chefs improve!',
    });
    onReviewSubmitted(newReview);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div>
            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">
              Verified Order Review
            </span>
            <h3 className="text-lg font-bold text-stone-900 mt-0.5">
              Rate your experience with {order.restaurantName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 mt-5">
          {/* Order Summary Pill */}
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-600 flex items-center justify-between">
            <div>
              <span className="font-bold text-stone-800">Order #{order?.orderId ? order.orderId.slice(-6) : ''}</span>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {order.items.length} item(s): {order.items.map((i) => i.name).join(', ')}
              </p>
            </div>
            <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold uppercase">
              Delivered
            </span>
          </div>

          {/* Star Rating Select */}
          <div className="text-center py-2">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Tap to Rate
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 text-stone-300 hover:scale-110 transition cursor-pointer"
                >
                  <Star
                    className={`w-8 h-8 ${
                      (hoverRating || rating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-stone-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-amber-600 mt-1 inline-block">
              {rating === 5 && 'Outstanding! Flavour explosion ⭐⭐⭐⭐⭐'}
              {rating === 4 && 'Very Good, enjoyed it thoroughly ⭐⭐⭐⭐'}
              {rating === 3 && 'Average taste, room for improvement ⭐⭐⭐'}
              {rating === 2 && 'Disappointing meal ⭐⭐'}
              {rating === 1 && 'Poor quality or delivery issues ⭐'}
            </span>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Your Review / Dish Comments <span className="text-orange-600">*</span>
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell others about the food taste, packaging, freshness, and temperature..."
              className="w-full px-4 py-3 rounded-2xl border border-stone-200 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition"
              required
            />
          </div>

          {/* Optional Image */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Food Photo URL (Optional)
            </label>
            <div className="relative">
              <ImageIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? 'Publishing...' : 'Submit Verified Review'}
              <Check className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
