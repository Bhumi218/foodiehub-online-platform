import React, { useState } from 'react';
import { Bell, Tag, Bike, ShieldCheck, CheckCheck, Trash2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface CustomerNotificationsViewProps {
  onNavigate: (view: string, param?: string) => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'discount' | 'system';
  time: string;
  read: boolean;
  actionView?: string;
  actionParam?: string;
}

export const CustomerNotificationsView: React.FC<CustomerNotificationsViewProps> = ({
  onNavigate,
}) => {
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: '🎉 Flat 50% Off Coupon Active',
      message: 'Use code CRAZY50 on orders above ₹299 to save up to ₹150 instantly today!',
      type: 'discount',
      time: 'Just now',
      read: false,
      actionView: 'home',
    },
    {
      id: 'notif-2',
      title: '🛵 Welcome to FoodieHub Delivery',
      message: 'Place your order via Cash on Delivery and track your kitchen progress live in real time.',
      type: 'order',
      time: '2 hours ago',
      read: false,
      actionView: 'foods',
    },
    {
      id: 'notif-3',
      title: '✨ Welcome to FoodieHub',
      message: 'Explore over 30+ artisan kitchens with verified hygiene certifications.',
      type: 'system',
      time: '1 day ago',
      read: true,
      actionView: 'restaurants',
    },
  ]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast({ type: 'success', title: 'Notifications', message: 'All notifications marked as read.' });
  };

  const clearAll = () => {
    setNotifications([]);
    showToast({ type: 'info', title: 'Cleared', message: 'All notifications cleared.' });
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24 pt-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold uppercase tracking-wider mb-2">
              <Bell className="w-3.5 h-3.5 text-orange-600" />
              <span>Inbox & Live Alerts</span>
            </div>
            <h1 className="text-3xl font-black font-heading text-stone-900 tracking-tight">
              Notifications
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Stay updated with live delivery progress, exclusive coupons, and kitchen announcements.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={markAllAsRead}
              className="px-3.5 py-1.5 bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mark all read</span>
            </button>
            <button
              onClick={clearAll}
              className="p-2 bg-white border border-stone-200 text-stone-400 hover:text-rose-600 rounded-xl transition cursor-pointer"
              title="Clear all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  if (n.actionView) onNavigate(n.actionView, n.actionParam);
                }}
                className={`p-5 rounded-3xl border transition cursor-pointer flex items-start gap-4 ${
                  n.read
                    ? 'bg-white border-stone-200 hover:border-stone-300'
                    : 'bg-orange-50/50 border-orange-200 shadow-2xs hover:bg-orange-50'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    n.type === 'order'
                      ? 'bg-emerald-100 text-emerald-700'
                      : n.type === 'discount'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  {n.type === 'order' ? (
                    <Bike className="w-5 h-5" />
                  ) : n.type === 'discount' ? (
                    <Tag className="w-5 h-5" />
                  ) : (
                    <ShieldCheck className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate">{n.title}</h4>
                    <span className="text-[10px] text-stone-400 font-medium whitespace-nowrap">{n.time}</span>
                  </div>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">{n.message}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-xs">
              <Bell className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-stone-800">You're all caught up!</h3>
              <p className="text-xs text-stone-500 mt-1">No new alerts right now. We'll notify you when your next order updates.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
