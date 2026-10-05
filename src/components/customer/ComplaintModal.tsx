import React, { useState } from 'react';
import { X, Send, HelpCircle, MessageSquare } from 'lucide-react';
import { Complaint, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface ComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string;
  onSubmitted?: (complaint: Complaint) => void;
}

export const ComplaintModal: React.FC<ComplaintModalProps> = ({
  isOpen,
  onClose,
  orderId = '',
  onSubmitted,
}) => {
  const { userProfile, role } = useAuth();
  const { showToast } = useToast();

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Food Quality');
  const [complaintOrderId, setComplaintOrderId] = useState(orderId);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      showToast({ type: 'error', title: 'Fields Missing', message: 'Please complete the subject and description.' });
      return;
    }

    setSubmitting(true);
    const complaintId = 'comp_' + Date.now().toString(36);
    const complaintDoc: Complaint = {
      complaintId,
      userId: userProfile?.uid || 'guest-user',
      userName: userProfile?.name || 'Customer',
      userRole: (role as UserRole) || 'customer',
      orderId: complaintOrderId.trim() || undefined,
      subject: subject.trim(),
      category,
      description: description.trim(),
      status: 'Open',
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'complaints', complaintId), complaintDoc);
    } catch (err) {
      console.warn('Error saving complaint to Firestore:', err);
    }

    setSubmitting(false);
    showToast({
      type: 'success',
      title: 'Ticket Submitted',
      message: 'Support ticket registered. Our platform grievance officer will investigate promptly.',
    });
    if (onSubmitted) onSubmitted(complaintDoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">FoodieHub Resolution Center</h3>
              <p className="text-[11px] text-stone-500">Report an order issue, refund request, or dispute</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none bg-white font-medium"
              >
                <option value="Food Quality">Food Quality / Spill</option>
                <option value="Missing Item">Missing Item in Delivery</option>
                <option value="Late Delivery">Delivery Delay</option>
                <option value="Billing / Refund">Billing & Refund Issue</option>
                <option value="Restaurant Conduct">Restaurant Partner Issue</option>
                <option value="Other">General Inquiry</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                Related Order ID (Optional)
              </label>
              <input
                type="text"
                value={complaintOrderId}
                onChange={(e) => setComplaintOrderId(e.target.value)}
                placeholder="e.g. ord-12345"
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
              Issue Subject <span className="text-orange-600">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of the grievance"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
              Detailed Description <span className="text-orange-600">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact details so our admin support team can investigate and process refunds or warnings..."
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none resize-none"
              required
            />
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
              {submitting ? 'Submitting...' : 'Lodge Grievance'}
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
