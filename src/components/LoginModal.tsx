import React, { useState } from 'react';
import { 
  LogIn, 
  X, 
  Phone, 
  Lock, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  UserPlus, 
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { StudentProfile } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (student: StudentProfile, token: string) => void;
  onOpenRegister: () => void;
  whatsappNumber?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onOpenRegister,
  whatsappNumber = '785502919',
}) => {
  const [view, setView] = useState<'login' | 'forgot-request' | 'forgot-reset'>('login');
  
  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Forgot password form state
  const [resetPhone, setResetPhone] = useState('');
  const [receivedCode, setReceivedCode] = useState('');
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!identifier.trim()) {
      setError('يرجى إدخال رقم الهاتف أو البريد الإلكتروني.');
      return;
    }

    if (!password) {
      setError('يرجى إدخال كلمة المرور.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل تسجيل الدخول. يرجى التحقق من البيانات.');
      }

      // Store JWT token
      localStorage.setItem('mct_auth_token', data.token);

      const studentData: StudentProfile = {
        id: data.user.id,
        name: data.user.name,
        phone: data.user.phone,
        email: data.user.email,
        university: data.user.university,
        studyLevel: data.user.studyLevel,
        major: data.user.major,
        role: data.user.role,
        subscriptionPlan: data.subscription?.plan || 'monthly',
        subscriptionStatus: data.subscription?.status || 'pending',
        subscriptionStartDate: data.subscription?.startDate,
        subscriptionEndDate: data.subscription?.expiryDate,
        remainingDays: data.subscription?.remainingDays || 0,
        isActivated: data.subscription?.isActivated || false,
        isExpired: data.subscription?.isExpired || false,
        completedLessons: [],
        quizScores: {},
      };

      onLoginSuccess(studentData, data.token);
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تسجيل الدخول.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!resetPhone.trim()) {
      setError('يرجى إدخال رقم الهاتف المسجل في حسابك.');
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: resetPhone.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'لم نتمكن من العثور على الحساب.');
      }

      setReceivedCode(data.recoveryCode || '');
      setResetCodeInput(data.recoveryCode || '');
      setView('forgot-reset');
      setSuccessMsg('تم إنشاء رمز التحقق بنجاح! يرجى إدخال كلمة المرور الجديدة أدناه.');
    } catch (err: any) {
      setError(err.message || 'تعذر استعادة الحساب.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!resetCodeInput.trim() || !newPassword) {
      setError('يرجى إدخال رمز التحقق وكلمة المرور الجديدة.');
      return;
    }

    if (newPassword.length < 4) {
      setError('يجب أن تتكون كلمة المرور الجديدة من 4 خانات على الأقل.');
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: resetPhone.trim(),
          recoveryCode: resetCodeInput.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل إعادة تعيين كلمة المرور.');
      }

      setSuccessMsg('تم تحديث كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.');
      setIdentifier(resetPhone);
      setPassword(newPassword);
      setView('login');
    } catch (err: any) {
      setError(err.message || 'فشل تغيير كلمة المرور.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm">
            {view === 'login' ? <LogIn className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {view === 'login' && 'تسجيل دخول الطالب'}
            {view === 'forgot-request' && 'استعادة كلمة المرور'}
            {view === 'forgot-reset' && 'تعيين كلمة مرور جديدة'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {view === 'login' && 'أدخل رقم هاتفك وكلمة المرور للوصول إلى دروسك ومحاكياتك'}
            {view === 'forgot-request' && 'أدخل رقم هاتفك المسجل وسنرسل لك رمز استعادة الحساب'}
            {view === 'forgot-reset' && 'أدخل رمز التحقق وكلمة المرور الجديدة لإكمال الاستعادة'}
          </p>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs sm:text-sm border border-rose-200 dark:border-rose-900">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* VIEW 1: Standard Login Form */}
        {view === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Identifier Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 text-right">
                رقم الهاتف أو البريد الإلكتروني
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="مثال: 771234567"
                  dir="ltr"
                  className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all text-sm text-right"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setSuccessMsg('');
                    setResetPhone(identifier.replace(/[^0-9]/g, ''));
                    setView('forgot-request');
                  }}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  نسيت كلمة المرور؟
                </button>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 text-right">
                  كلمة المرور
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all text-sm text-left"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري التحقق وتسجيل الدخول...</span>
                </>
              ) : (
                <>
                  <span>تسجيل الدخول</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* VIEW 2: Forgot Password - Request Code */}
        {view === 'forgot-request' && (
          <form onSubmit={handleRequestResetCode} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 text-right">
                رقم الهاتف المسجل
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={resetPhone}
                  onChange={(e) => setResetPhone(e.target.value)}
                  placeholder="مثال: 771234567"
                  dir="ltr"
                  className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all text-sm text-right"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                أدخل نفس رقم الهاتف الذي أنشأت به حسابك في الأكاديمية.
              </p>
            </div>

            <button
              type="submit"
              disabled={resetLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {resetLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري إرسال الطلب...</span>
                </>
              ) : (
                <>
                  <span>متابعة استعادة الحساب</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setView('login');
                }}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
              >
                العودة إلى شاشة تسجيل الدخول
              </button>
            </div>
          </form>
        )}

        {/* VIEW 3: Forgot Password - Reset with Code */}
        {view === 'forgot-reset' && (
          <form onSubmit={handleConfirmReset} className="space-y-4">
            {receivedCode && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-2xl text-center space-y-1">
                <span className="text-xs text-blue-700 dark:text-blue-300 font-bold block">
                  رمز التحقق الخاص بحسابك:
                </span>
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-widest font-mono">
                  {receivedCode}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  صالح لمدة 15 دقيقة فقط
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 text-right">
                رمز التحقق (6 أرقام)
              </label>
              <input
                type="text"
                value={resetCodeInput}
                onChange={(e) => setResetCodeInput(e.target.value)}
                placeholder="123456"
                dir="ltr"
                maxLength={6}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold text-center tracking-widest text-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 text-right">
                كلمة المرور الجديدة
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="أدخل كلمة مرور جديدة"
                  dir="ltr"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={resetLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {resetLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>تأكيد وتعيين كلمة المرور</span>
                </>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setView('login');
                }}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
              >
                العودة إلى شاشة تسجيل الدخول
              </button>
            </div>
          </form>
        )}

        {/* Switch to Register */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ليس لديك حساب طالب حتى الآن؟
          </p>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenRegister();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>إنشاء حساب جديد والاشتراك</span>
          </button>
        </div>

      </div>
    </div>
  );
};
