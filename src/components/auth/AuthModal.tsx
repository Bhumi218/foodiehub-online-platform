import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ConfirmationResult } from 'firebase/auth';
import {
  X,
  Phone,
  ShieldCheck,
  Store,
  User,
  ArrowRight,
  ArrowLeft,
  Lock,
  Building,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Mail,
  KeyRound,
  MessageSquare,
  Smartphone,
  Eye,
  EyeOff,
} from 'lucide-react';

export type AuthModalMode = 'customer' | 'seller' | 'admin';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: AuthModalMode;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  mode = 'customer',
}) => {
  const {
    loginAdminWithGoogle,
    loginCustomerWithGoogle,
    loginAdminDirectly,
    sendResetPasswordEmail,
    registerCustomerWithPin,
    loginCustomerWithPin,
    registerSellerWithPin,
    loginSellerWithPin,
  } = useAuth();
  const { showToast } = useToast();

  // Active Role Tab (allows switching between Customer, Seller, and Admin)
  const [activeTab, setActiveTab] = useState<AuthModalMode>(mode);

  // Customer sub-tab (login vs register)
  const [customerMode, setCustomerMode] = useState<'login' | 'register'>('login');
  const [customerPin, setCustomerPin] = useState('');
  const [sellerPin, setSellerPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Forgot Password View state
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Form states
  const [phone, setPhone] = useState('');
  const [customerName, setCustomerName] = useState('');

  // Seller registration details
  const [sellerMode, setSellerMode] = useState<'login' | 'register'>('login');
  const [sellerName, setSellerName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantAddress, setRestaurantAddress] = useState('');
  const [restaurantDescription, setRestaurantDescription] = useState('');
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(['Biryani', 'Indian']);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync mode when modal opens or mode prop changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(mode);
      setErrorMsg('');
      setIsForgotPassword(false);
      setResetEmail('');
      setResetEmailSent(false);
      setCustomerPin('');
      setSellerPin('');
      setShowPin(false);
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleTabChange = (newTab: AuthModalMode) => {
    setActiveTab(newTab);
    setErrorMsg('');
    setIsForgotPassword(false);
    setResetEmail('');
    setResetEmailSent(false);
    setPhone('');
    setCustomerPin('');
    setSellerPin('');
    setShowPin(false);
  };

  // =========================================================================
  // 1. FORGOT PASSWORD HANDLER (FIREBASE AUTHENTICATION)
  // =========================================================================
  const handleSendPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = resetEmail.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    const res = await sendResetPasswordEmail(cleanEmail);
    setLoading(false);

    if (res.success) {
      setResetEmailSent(true);
      showToast({
        type: 'success',
        title: 'Reset Email Dispatched',
        message: `Password reset link sent to ${cleanEmail}. Check your inbox.`,
      });
    } else {
      setErrorMsg(res.error || 'Failed to dispatch password reset email. Please try again.');
    }
  };

  // =========================================================================
  // 2. CUSTOMER AUTHENTICATION HANDLERS (SECURE 4-DIGIT PIN AUTH)
  // =========================================================================
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhoneDigits = phone.trim().replace(/\D/g, '');
    if (cleanPhoneDigits.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    const cleanPin = customerPin.trim();
    if (!cleanPin || cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) {
      setErrorMsg('Please enter a 4-digit numeric Security PIN.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    if (customerMode === 'register') {
      if (!customerName || !customerName.trim()) {
        setErrorMsg('Please enter your full name.');
        setLoading(false);
        return;
      }
      const res = await registerCustomerWithPin(customerName, phone, cleanPin);
      setLoading(false);
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Welcome to FoodieHub!',
          message: 'Account created & secured with your 4-digit PIN.',
        });
        onClose();
      } else {
        setErrorMsg(res.error || 'Registration could not be completed.');
      }
    } else {
      const res = await loginCustomerWithPin(phone, cleanPin);
      setLoading(false);
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Welcome Back!',
          message: 'Signed in securely to your customer account.',
        });
        onClose();
      } else {
        setErrorMsg(res.error || 'Login failed. Please verify phone number and PIN.');
      }
    }
  };

  const handleCustomerGoogleLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    const res = await loginCustomerWithGoogle();
    setLoading(false);

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Welcome to FoodieHub!',
        message: 'Signed in successfully with Google account.',
      });
      onClose();
    } else {
      setErrorMsg(res.error || 'Google sign-in could not be completed.');
    }
  };

  // =========================================================================
  // 3. SELLER AUTHENTICATION HANDLERS (SECURE PARTNER PIN AUTH)
  // =========================================================================
  const handleSellerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhoneDigits = phone.trim().replace(/\D/g, '');
    if (cleanPhoneDigits.length < 10) {
      setErrorMsg('Please enter a valid 10-digit partner mobile number.');
      return;
    }
    const cleanPin = sellerPin.trim();
    if (!cleanPin || cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) {
      setErrorMsg('Please enter a 4-digit Partner Security PIN.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    if (sellerMode === 'register') {
      if (!sellerName.trim() || !restaurantName.trim()) {
        setErrorMsg('Please enter owner name and restaurant name.');
        setLoading(false);
        return;
      }
      const res = await registerSellerWithPin(
        {
          name: sellerName.trim(),
          restaurantName: restaurantName.trim(),
          cuisine: selectedCuisines,
          address: restaurantAddress.trim(),
          description: restaurantDescription.trim(),
        },
        phone,
        cleanPin
      );
      setLoading(false);
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Restaurant Registered!',
          message: 'Your kitchen partner portal is now active.',
        });
        onClose();
      } else {
        setErrorMsg(res.error || 'Partner registration failed.');
      }
    } else {
      const res = await loginSellerWithPin(phone, cleanPin);
      setLoading(false);
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Partner Portal Access',
          message: 'Welcome back to your Restaurant Dashboard.',
        });
        onClose();
      } else {
        setErrorMsg(res.error || 'Login failed. Please verify partner number and PIN.');
      }
    }
  };

  // =========================================================================
  // 4. ADMIN GOOGLE SIGN-IN HANDLER
  // =========================================================================
  const handleAdminGoogleLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    const res = await loginAdminWithGoogle();
    setLoading(false);

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Admin Access Granted',
        message: 'Welcome, Administrator.',
      });
      onClose();
    } else {
      setErrorMsg(res.error || 'Access denied. This Google account is not authorized.');
    }
  };

  const handleAdminDirectLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    const res = await loginAdminDirectly();
    setLoading(false);

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Admin Access Granted',
        message: 'Welcome, Administrator.',
      });
      onClose();
    } else {
      setErrorMsg(res.error || 'Admin verification failed.');
    }
  };

  const toggleCuisine = (c: string) => {
    if (selectedCuisines.includes(c)) {
      setSelectedCuisines(selectedCuisines.filter((item) => item !== c));
    } else {
      setSelectedCuisines([...selectedCuisines, c]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden my-8 animate-fade-in">
        {/* Header Banner */}
        <div
          className={`p-6 text-white relative transition-colors duration-300 ${
            isForgotPassword
              ? 'bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 border-b border-stone-700'
              : activeTab === 'admin'
              ? 'bg-gradient-to-r from-stone-900 via-purple-950 to-stone-900 border-b border-purple-800/40'
              : activeTab === 'seller'
              ? 'bg-gradient-to-r from-amber-700 via-stone-900 to-amber-800'
              : 'bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700'
          }`}
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {isForgotPassword ? (
            <div>
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setErrorMsg('');
                  setResetEmailSent(false);
                }}
                className="inline-flex items-center gap-1.5 text-xs text-orange-300 hover:text-white mb-2 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Sign In</span>
              </button>

              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-400/30 flex items-center justify-center text-orange-300">
                  <KeyRound className="w-4 h-4" />
                </div>
                <span className="text-[11px] uppercase tracking-widest font-black text-orange-200">
                  Account Recovery
                </span>
              </div>

              <h2 className="text-2xl font-black font-heading tracking-tight">
                Reset Password
              </h2>
              <p className="text-xs text-stone-200 mt-1">
                Send a secure password reset link to your registered email address.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-1">
                {activeTab === 'admin' ? (
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
                    <Lock className="w-4 h-4" />
                  </div>
                ) : activeTab === 'seller' ? (
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                    <Store className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white">
                    <User className="w-4 h-4" />
                  </div>
                )}
                <span className="text-[11px] uppercase tracking-widest font-black text-amber-200">
                  FoodieHub Secure Access
                </span>
              </div>

              <h2 className="text-2xl font-black font-heading tracking-tight">
                {activeTab === 'customer'
                  ? 'Customer Sign-In'
                  : activeTab === 'seller'
                  ? 'Restaurant Partner Access'
                  : 'ADMIN ACCESS'}
              </h2>

              <p className="text-xs text-stone-200 mt-1">
                {activeTab === 'customer'
                  ? 'Sign in or register with verified mobile number.'
                  : activeTab === 'seller'
                  ? 'Manage restaurant menu, live orders, and kitchen sales.'
                  : 'Authorized administrator access only.'}
              </p>

              {/* Role Switcher Tabs */}
              <div className="mt-4 pt-3 border-t border-white/15 flex items-center gap-1.5 bg-black/20 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => handleTabChange('customer')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'customer'
                      ? 'bg-white text-stone-900 shadow-md'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Customer</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('seller')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'seller'
                      ? 'bg-white text-stone-900 shadow-md'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Seller / Partner</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('admin')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'admin'
                      ? 'bg-white text-stone-900 shadow-md'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-rose-900 text-xs animate-shake">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">
                  <p className="font-bold text-rose-950">Authentication Notice</p>
                  <p>{errorMsg}</p>
                </div>
              </div>
              {(errorMsg.includes('Firebase Console') || errorMsg.includes('operation-not-allowed')) && (
                <div className="mt-2.5 pt-2.5 border-t border-rose-200/70 bg-white/80 p-3 rounded-xl space-y-2 text-[11px] text-stone-700">
                  <p className="font-bold text-stone-900 flex items-center gap-1.5">
                    <span>💡 Enable Real Phone SMS in Firebase:</span>
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-stone-600 leading-normal pl-1">
                    <li>
                      Visit Firebase Console: <a href="https://console.firebase.google.com/project/copper-shell-0v8b6/authentication/providers" target="_blank" rel="noopener noreferrer" className="font-mono text-orange-600 underline font-bold">Authentication &gt; Sign-in method</a>
                    </li>
                    <li>Click <strong>Phone</strong> provider and turn the toggle to <strong>Enable</strong>.</li>
                    <li>Click <strong>Save</strong> to activate real SMS dispatch on your Firebase project.</li>
                  </ol>
                  <div className="pt-1 border-t border-stone-200 text-stone-600 flex items-center justify-between">
                    <span>Or use instant access:</span>
                    <button
                      type="button"
                      onClick={handleCustomerGoogleLogin}
                      className="text-orange-600 hover:text-orange-700 font-bold underline cursor-pointer"
                    >
                      Sign In with Google Now
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* FORGOT PASSWORD VIEW                                                      */}
          {/* ========================================================================= */}
          {isForgotPassword ? (
            <div className="space-y-4">
              {!resetEmailSent ? (
                <form onSubmit={handleSendPasswordReset} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      Registered Email Address <span className="text-orange-600">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="email"
                        placeholder="name@example.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                        autoFocus
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition font-medium"
                      />
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1.5">
                      Firebase Authentication will send a secure password reset link directly to your inbox.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !resetEmail.trim()}
                    className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-600/20 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{loading ? 'Dispatching Reset Link...' : 'Send Password Reset Email'}</span>
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(false);
                        setErrorMsg('');
                      }}
                      className="text-xs font-semibold text-stone-500 hover:text-stone-800 transition cursor-pointer"
                    >
                      Remember your password? <span className="text-orange-600 font-bold hover:underline">Sign In</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 text-center py-2 animate-fade-in">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-stone-900">
                      Password Reset Email Dispatched!
                    </h3>
                    <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
                      We have sent a secure password reset link to{' '}
                      <span className="font-bold text-stone-800 font-mono">{resetEmail}</span>.
                    </p>
                  </div>

                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-left text-[11px] text-stone-600 space-y-1">
                    <p className="font-semibold text-stone-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Next steps:
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 pl-1">
                      <li>Click the link inside the Firebase email to choose a new password.</li>
                      <li>If you do not see the email within 2 minutes, check your spam or junk folder.</li>
                    </ul>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(false);
                        setResetEmailSent(false);
                        setResetEmail('');
                      }}
                      className="w-full py-3 bg-stone-900 hover:bg-black text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
                    >
                      Return to Sign In
                    </button>

                    <button
                      type="button"
                      onClick={handleSendPasswordReset}
                      disabled={loading}
                      className="text-xs text-stone-500 hover:text-orange-600 font-semibold transition py-1 cursor-pointer"
                    >
                      Didn't receive email? Resend reset link
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* ========================================================================= */}
              {/* 1. CUSTOMER FLOW: Mobile / Google -> Customer Account                     */}
              {/* ========================================================================= */}
              {activeTab === 'customer' && (
                <div className="space-y-4">
                  {/* Real Google Sign-in for Customer */}
                  <button
                    type="button"
                    onClick={handleCustomerGoogleLogin}
                    disabled={loading}
                    className="w-full py-3.5 px-4 bg-white hover:bg-stone-50 border-2 border-stone-200 hover:border-orange-400 text-stone-800 font-bold rounded-2xl shadow-sm transition flex items-center justify-center gap-3 text-sm disabled:opacity-50 cursor-pointer"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                    <span>{loading ? 'Connecting Google...' : 'Continue with Google'}</span>
                  </button>

                  <div className="relative flex items-center justify-center my-2">
                    <div className="border-t border-stone-200 w-full"></div>
                    <span className="bg-white px-3 text-[10px] uppercase tracking-widest font-black text-stone-400 absolute">
                      or sign in with mobile
                    </span>
                  </div>

                  {/* Customer Sign-In vs Register Toggle */}
                  <div className="flex bg-stone-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerMode('login');
                        setErrorMsg('');
                      }}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                        customerMode === 'login'
                          ? 'bg-white text-stone-900 shadow-sm'
                          : 'text-stone-500 hover:text-stone-900'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerMode('register');
                        setErrorMsg('');
                      }}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                        customerMode === 'register'
                          ? 'bg-white text-stone-900 shadow-sm'
                          : 'text-stone-500 hover:text-stone-900'
                      }`}
                    >
                      Create Account
                    </button>
                  </div>

                  <form onSubmit={handleCustomerSubmit} className="space-y-4">
                    {customerMode === 'register' && (
                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                          Your Full Name <span className="text-orange-600">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Aarav Sharma"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition font-medium"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                        Mobile Phone Number <span className="text-orange-600">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500">
                          +91
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="Enter 10-digit mobile"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                          required
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition font-medium font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                          {customerMode === 'register' ? 'Set 4-Digit Security PIN' : '4-Digit Security PIN'}{' '}
                          <span className="text-orange-600">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowPin(!showPin)}
                          className="text-[11px] font-bold text-stone-500 hover:text-stone-800 cursor-pointer flex items-center gap-1"
                        >
                          {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>{showPin ? 'Hide' : 'Show'}</span>
                        </button>
                      </div>
                      <input
                        type={showPin ? 'text' : 'password'}
                        maxLength={4}
                        placeholder="••••"
                        value={customerPin}
                        onChange={(e) => setCustomerPin(e.target.value.replace(/\D/g, ''))}
                        required
                        className="w-full text-center tracking-[0.5em] font-mono font-black text-2xl py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                      />
                      <p className="text-[11px] text-stone-500 mt-1.5">
                        {customerMode === 'register'
                          ? '🔒 Secret PIN: Protects your account so nobody else can log into your number.'
                          : 'Enter your 4-digit secret PIN to log in securely.'}
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || phone.length < 10 || customerPin.length !== 4}
                      className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-600/20 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? (
                        'Verifying...'
                      ) : customerMode === 'register' ? (
                        <>
                          <span>Create Account & Sign In</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          <span>Sign In Securely</span>
                          <ShieldCheck className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between text-xs pt-1 px-1">
                      {customerMode === 'login' ? (
                        <p className="text-stone-600">
                          New to FoodieHub?{' '}
                          <button
                            type="button"
                            onClick={() => {
                              setCustomerMode('register');
                              setErrorMsg('');
                            }}
                            className="text-orange-600 font-bold hover:underline cursor-pointer"
                          >
                            Create an Account
                          </button>
                        </p>
                      ) : (
                        <p className="text-stone-600">
                          Already have an account?{' '}
                          <button
                            type="button"
                            onClick={() => {
                              setCustomerMode('login');
                              setErrorMsg('');
                            }}
                            className="text-orange-600 font-bold hover:underline cursor-pointer"
                          >
                            Sign In with PIN
                          </button>
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setErrorMsg('');
                        }}
                        className="text-stone-500 hover:text-orange-600 font-medium transition cursor-pointer flex items-center gap-1"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-stone-400" />
                        <span>Forgot PIN?</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ========================================================================= */}
              {/* 2. SELLER FLOW: Partner Sign-In / Register New Restaurant                  */}
              {/* ========================================================================= */}
              {activeTab === 'seller' && (
                <div className="space-y-4">
                  <div className="flex bg-stone-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setSellerMode('login');
                        setErrorMsg('');
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                        sellerMode === 'login'
                          ? 'bg-white text-stone-900 shadow-xs'
                          : 'text-stone-500 hover:text-stone-900'
                      }`}
                    >
                      Partner Sign-In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSellerMode('register');
                        setErrorMsg('');
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                        sellerMode === 'register'
                          ? 'bg-white text-stone-900 shadow-xs'
                          : 'text-stone-500 hover:text-stone-900'
                      }`}
                    >
                      Register New Restaurant
                    </button>
                  </div>

                  <form onSubmit={handleSellerSubmit} className="space-y-3.5">
                    {sellerMode === 'register' && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                              Owner Name
                            </label>
                            <input
                              type="text"
                              placeholder="Masterchef"
                              value={sellerName}
                              onChange={(e) => setSellerName(e.target.value)}
                              required
                              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                              Restaurant Name <span className="text-orange-600">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Royal Kitchen"
                              value={restaurantName}
                              onChange={(e) => setRestaurantName(e.target.value)}
                              required
                              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                            Address & Area <span className="text-orange-600">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 42 Nizam Heritage Enclave"
                            value={restaurantAddress}
                            onChange={(e) => setRestaurantAddress(e.target.value)}
                            required
                            className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                            Primary Cuisines
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {['Biryani', 'Pizza', 'Burger', 'Indian', 'Chinese', 'South Indian', 'Desserts', 'Fast Food'].map(
                              (c) => (
                                <button
                                  type="button"
                                  key={c}
                                  onClick={() => toggleCuisine(c)}
                                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                    selectedCuisines.includes(c)
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                  }`}
                                >
                                  {c}
                                </button>
                              )
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                            Short Kitchen Description
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Authentic recipes, signature dishes..."
                            value={restaurantDescription}
                            onChange={(e) => setRestaurantDescription(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none resize-none"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                        Partner Mobile Phone Number <span className="text-orange-600">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500">
                          +91
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="Enter 10-digit mobile"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                          required
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                          {sellerMode === 'register' ? 'Set 4-Digit Partner PIN' : '4-Digit Partner PIN'}{' '}
                          <span className="text-orange-600">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowPin(!showPin)}
                          className="text-[11px] font-bold text-stone-500 hover:text-stone-800 cursor-pointer flex items-center gap-1"
                        >
                          {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>{showPin ? 'Hide' : 'Show'}</span>
                        </button>
                      </div>
                      <input
                        type={showPin ? 'text' : 'password'}
                        maxLength={4}
                        placeholder="••••"
                        value={sellerPin}
                        onChange={(e) => setSellerPin(e.target.value.replace(/\D/g, ''))}
                        required
                        className="w-full text-center tracking-[0.5em] font-mono font-black text-2xl py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || phone.length < 10 || sellerPin.length !== 4}
                      className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-lg transition text-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? (
                        'Processing...'
                      ) : sellerMode === 'register' ? (
                        <>
                          <span>Submit Restaurant Application & Access Portal</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          <span>Sign In to Partner Portal</span>
                          <Building className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* ========================================================================= */}
              {/* 3. ADMIN FLOW: Google Sign-In -> Secure Administrator Verification         */}
              {/* Strict Security: Admin email NEVER exposed in UI, cards, or messages!      */}
              {/* Header: ADMIN ACCESS, Subtext: "Authorized administrator access only."     */}
              {/* Button: [ Continue with Google ]                                         */}
              {/* Fallback button: [ Authorized Administrator Instant Access ]              */}
              {/* ========================================================================= */}
              {activeTab === 'admin' && (
                <div className="space-y-4">
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-center space-y-1">
                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-2">
                      <Lock className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-stone-900">
                      Authorized Administrator Access Only
                    </h3>
                    <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
                      Sign in with your authorized administrator identity to govern restaurants, foods, orders, and platform operations.
                    </p>
                  </div>

                  {/* Real Google Sign-in */}
                  <button
                    type="button"
                    onClick={handleAdminGoogleLogin}
                    disabled={loading}
                    className="w-full py-3.5 px-4 bg-white hover:bg-stone-50 border border-stone-300 hover:border-stone-400 text-stone-800 font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-3 text-sm disabled:opacity-50 cursor-pointer"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                    <span>{loading ? 'Authenticating...' : 'Continue with Google'}</span>
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1 px-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setErrorMsg('');
                      }}
                      className="text-stone-500 hover:text-purple-700 font-medium transition cursor-pointer flex items-center gap-1"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-stone-400" />
                      <span>Administrator Account Recovery / Reset</span>
                    </button>
                  </div>

                  {/* Direct Authorized Access Button (Guarantees zero-blockage in iframe/preview container) */}
                  <div className="pt-2 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={handleAdminDirectLogin}
                      disabled={loading}
                      className="w-full py-3 bg-purple-950 hover:bg-stone-900 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs cursor-pointer border border-purple-800/40"
                    >
                      <ShieldCheck className="w-4 h-4 text-purple-400" />
                      <span>Authorized Administrator Instant Access</span>
                    </button>
                    <p className="text-[10px] text-stone-400 text-center mt-1.5">
                      Platform credential check: Grants access exclusively to the authorized platform administrator.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
