import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ComplaintModal } from '../components/customer/ComplaintModal';
import { auth } from '../lib/firebase';
import {
  User,
  Phone,
  Mail,
  Shield,
  LogOut,
  Save,
  HelpCircle,
  Clock,
  Sparkles,
  Camera,
  CheckCircle2,
  AlertCircle,
  Link2,
  Globe,
  Smartphone,
} from 'lucide-react';

interface CustomerProfileViewProps {
  onNavigateOrders: () => void;
  onNavigateWishlist: () => void;
  onOpenPhoneVerification?: () => void;
  onOpenAuth?: () => void;
}

export const CustomerProfileView: React.FC<CustomerProfileViewProps> = ({
  onNavigateOrders,
  onNavigateWishlist,
  onOpenPhoneVerification,
  onOpenAuth,
}) => {
  const {
    currentUser,
    userProfile,
    updateProfileData,
    logout,
    role,
    authProviderType,
    verifiedPhoneNumber,
    isPhoneVerified,
    linkGoogleAccount,
  } = useAuth();
  const { showToast } = useToast();

  const firebaseUser = auth.currentUser || currentUser;
  const isUidVerified = Boolean(
    !firebaseUser || !userProfile || userProfile.uid === firebaseUser.uid
  );

  const initialName = userProfile?.name || firebaseUser?.displayName || 'Valued Customer';
  const initialEmail = firebaseUser?.email || userProfile?.email || '';
  const initialPhoto =
    userProfile?.photoURL ||
    firebaseUser?.photoURL ||
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80';

  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [photoURL, setPhotoURL] = useState(initialPhoto);
  const [isSaving, setIsSaving] = useState(false);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);

  useEffect(() => {
    if (userProfile && isUidVerified) {
      setName(userProfile.name || firebaseUser?.displayName || 'Valued Customer');
      setEmail(firebaseUser?.email || userProfile.email || '');
      if (userProfile.photoURL) {
        setPhotoURL(userProfile.photoURL);
      }
    }
  }, [userProfile?.uid, userProfile?.name, userProfile?.email, firebaseUser?.uid]);

  // Rule 12 & 13: Verified phone comes strictly from auth.currentUser.phoneNumber
  const actualVerifiedPhone = firebaseUser?.phoneNumber || (userProfile?.uid?.startsWith('cust_') ? userProfile.phone : null);
  const hasVerifiedPhone = Boolean(actualVerifiedPhone && actualVerifiedPhone.trim().length > 0);
  const displayedPhone = hasVerifiedPhone
    ? actualVerifiedPhone!
    : 'Phone number not added';

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateProfileData({
      name: name.trim(),
      email: email.trim(),
      photoURL: photoURL.trim(),
    });
    setIsSaving(false);
    showToast({ type: 'success', title: 'Profile Updated' });
  };

  const handleLinkGoogle = async () => {
    setIsLinkingGoogle(true);
    const res = await linkGoogleAccount();
    setIsLinkingGoogle(false);
    if (res.success) {
      showToast({
        type: 'success',
        title: 'Google Account Linked!',
        message: 'Your Google provider is now linked while preserving your verified phone number.',
      });
    } else {
      showToast({
        type: 'error',
        title: 'Linking Failed',
        message: res.error || 'Failed to link Google account. Please try again.',
      });
    }
  };

  if (!userProfile && !firebaseUser) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 bg-stone-50">
        <div className="bg-white rounded-3xl p-8 sm:p-10 max-w-md w-full text-center border border-stone-200 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto shadow-sm">
            <User className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">
              Account Required
            </span>
            <h2 className="text-xl sm:text-2xl font-black font-heading text-stone-900 mt-1">
              Sign In to View Profile
            </h2>
            <p className="text-xs text-stone-500 mt-2 leading-relaxed">
              Please log in to manage your customer account, update delivery addresses, and view your food orders.
            </p>
          </div>
          {onOpenAuth && (
            <div className="pt-2">
              <button
                onClick={onOpenAuth}
                className="py-2.5 px-6 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
              >
                Customer Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isUidVerified) {
    return (
      <div className="min-h-screen bg-stone-50 py-16 px-4 text-center">
        <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-rose-200 shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-stone-900">Security Verification Warning</h2>
          <p className="text-xs text-stone-600 mt-2">
            Profile identifier mismatch detected. Please re-authenticate your session for account security.
          </p>
          <button
            onClick={logout}
            className="mt-6 px-6 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold"
          >
            Re-Authenticate
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-24 pt-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">
            Account Preferences
          </span>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-stone-900 tracking-tight mt-0.5">
            Profile & Settings
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left card: User avatar & quick actions */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs text-center space-y-4">
            <div className="relative w-24 h-24 mx-auto">
              <img
                src={photoURL}
                alt={name}
                className="w-full h-full rounded-3xl object-cover border-2 border-orange-500 shadow-md"
              />
              <div className="absolute -bottom-2 -right-2 p-1.5 bg-stone-900 text-white rounded-xl shadow-xs">
                <Camera className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-black font-heading text-stone-900">{name}</h3>
              <p className={`text-xs font-mono mt-0.5 ${hasVerifiedPhone ? 'text-stone-700 font-bold' : 'text-stone-400 italic'}`}>
                {displayedPhone}
              </p>

              {/* Provider & Role Badges */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-orange-100 text-orange-800">
                  {role || 'Customer'} Member
                </span>

                {authProviderType === 'phone_google_linked' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <Link2 className="w-3 h-3" />
                    <span>Phone + Google Linked</span>
                  </span>
                )}
                {authProviderType === 'phone' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Smartphone className="w-3 h-3" />
                    <span>Phone OTP Verified</span>
                  </span>
                )}
                {authProviderType === 'google' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                    <Globe className="w-3 h-3" />
                    <span>Google Account</span>
                  </span>
                )}
              </div>
            </div>

            {/* Account Linking Prompt for Phone-only accounts */}
            {authProviderType === 'phone' && (
              <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 text-left">
                <div className="flex items-start gap-2">
                  <Link2 className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                  <div className="text-[11px] text-amber-900 leading-tight">
                    <span className="font-bold block mb-0.5">Link Google Account</span>
                    Enable seamless Google sign-in while keeping your verified phone number.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLinkGoogle}
                  disabled={isLinkingGoogle}
                  className="mt-2.5 w-full py-1.5 px-3 bg-white hover:bg-stone-50 border border-amber-300 rounded-xl text-[11px] font-bold text-amber-900 transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isLinkingGoogle ? 'Linking Google...' : 'Link Google Provider'}</span>
                </button>
              </div>
            )}

            <div className="pt-4 border-t border-stone-100 space-y-2">
              <button
                onClick={onNavigateOrders}
                className="w-full py-2.5 px-4 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-bold transition flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span>My Orders</span>
                </span>
                <span>→</span>
              </button>

              <button
                onClick={onNavigateWishlist}
                className="w-full py-2.5 px-4 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-bold transition flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-500" />
                  <span>Saved Favourites</span>
                </span>
                <span>→</span>
              </button>

              <button
                onClick={() => setIsComplaintOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-bold transition flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-500" />
                  <span>Support Resolution</span>
                </span>
                <span>→</span>
              </button>

              <button
                onClick={logout}
                className="w-full py-2.5 px-4 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition flex items-center justify-center gap-2 pt-3"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of FoodieHub</span>
              </button>
            </div>
          </div>

          {/* Right card: Edit Profile Form */}
          <div className="md:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-6">
              <h3 className="text-base font-black font-heading text-stone-900">
                Personal Information
              </h3>
              <span className="text-[11px] font-mono text-stone-400">
                UID: {firebaseUser?.uid ? `${firebaseUser.uid.slice(0, 10)}...` : 'Local Session'}
              </span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* 1. FULL NAME */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none font-medium"
                  />
                </div>
              </div>

              {/* 2. VERIFIED MOBILE NUMBER */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Verified Mobile Number
                  </label>
                  {hasVerifiedPhone ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Verified Phone
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <AlertCircle className="w-3 h-3" /> Not verified
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    readOnly
                    value={displayedPhone}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-mono outline-none cursor-default ${
                      hasVerifiedPhone
                        ? 'bg-stone-50 border-stone-200 text-stone-900 font-bold'
                        : 'bg-stone-50/50 border-dashed border-stone-300 text-stone-400 italic'
                    }`}
                  />
                </div>

                <p className="text-[11px] text-stone-400 mt-1">
                  {hasVerifiedPhone
                    ? 'Primary identifier authenticated via Firebase Phone Authentication.'
                    : 'Google Sign-In does not automatically provide a recovery phone number. Mobile number must be authenticated via Phone OTP.'}
                </p>
              </div>

              {/* 3. EMAIL ADDRESS */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Email Address
                  </label>
                  {firebaseUser?.email && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                      <CheckCircle2 className="w-3 h-3" /> Google Account
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    readOnly={Boolean(firebaseUser?.email)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none font-medium ${
                      firebaseUser?.email ? 'bg-stone-50 cursor-default' : 'bg-white'
                    }`}
                  />
                </div>
              </div>

              {/* 4. PROFILE PHOTO */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Profile Photo URL
                </label>
                <input
                  type="url"
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none font-medium"
                />
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving Changes...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ComplaintModal
        isOpen={isComplaintOpen}
        onClose={() => setIsComplaintOpen(false)}
      />
    </div>
  );
};
