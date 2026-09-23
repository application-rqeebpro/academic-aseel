import React, { useState } from 'react';
import { StudentProfile } from '../types';
import { 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Loader2, 
  MessageCircle,
  Phone,
  Sparkles
} from 'lucide-react';

interface ActivationCodeViewProps {
  onActivationSuccess: (activatedStudent: StudentProfile) => void;
  onBack?: () => void;
  whatsappNumber?: string;
}

export const ActivationCodeView: React.FC<ActivationCodeViewProps> = ({
  onActivationSuccess,
  onBack,
  whatsappNumber = '785502919',
}) => {
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [showPhoneField, setShowPhoneField] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError('يرجى إدخال كود التفعيل.');
      return;
    }

    setLoading(true);
    try {
      const existingToken = localStorage.getItem('mct_auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (existingToken) {
        headers['Authorization'] = `Bearer ${existingToken}`;
      }

      const res = await fetch('/api/activate-code', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          code: cleanCode,
          phone: phone.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requirePhone) {
          setShowPhoneField(true);
        }
        throw new Error(data.error || 'كود التفعيل غير صحيح.');
      }

      setSuccessMsg(data.message || 'تم تفعيل الاشتراك بنجاح!');

      // Save returned token to authenticate user immediately
      if (data.token) {
        localStorage.setItem('mct_auth_token', data.token);
      }

      const activatedStudent: StudentProfile = data.student
        ? {
            ...data.student,
            completedLessons: data.student.completedLessons || [],
            quizScores: data.student.quizScores || {},
          }
        : {
            id: data.user?.id || `student-${Date.now()}`,
            name: data.user?.name || 'طالب الأكاديمية',
            phone: data.user?.phone || phone.trim(),
            university: data.user?.university || 'الجامعة الإماراتية الدولية – صنعاء',
            studyLevel: data.user?.studyLevel || 'السنة الأولى',
            major: data.user?.major || 'هندسة الميكاترونكس',
            role: data.user?.role || 'student',
            subscriptionPlan: data.subscription?.plan || 'monthly',
            subscriptionStatus: 'active',
            subscriptionStartDate: data.subscription?.startDate,
            subscriptionEndDate: data.subscription?.expiryDate,
            remainingDays: data.subscription?.remainingDays || 30,
            isActivated: true,
            isExpired: false,
            completedLessons: [],
            quizScores: {},
          };

      localStorage.setItem('mct_student', JSON.stringify(activatedStudent));

      setTimeout(() => {
        onActivationSuccess(activatedStudent);
      }, 1000);

    } catch (err: any) {
      setError(err.message || 'كود التفعيل غير صحيح.');
    } finally {
      setLoading(false);
    }
  };

  const handleContactSupport = () => {
    const cleanNumber = whatsappNumber.startsWith('967') ? whatsappNumber : `967${whatsappNumber.replace(/^0+/, '')}`;
    const msg = `السلام عليكم إدارة أكاديمية الميكاترونكس، قمت بتحويل الرسوم وأريد الحصول على كود التفعيل أو تفعيل حسابي.`;
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4 sm:px-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        
        {/* Header Icon */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <KeyRound className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            تفعيل الاشتراك
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            أدخل كود التفعيل المستلم من الإدارة عبر واتساب لتفعيل اشتراكك وبدء التصفح مباشرة
          </p>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="font-bold">{successMsg}</div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <div className="font-bold">{error}</div>
          </div>
        )}

        {/* Activation Form */}
        <form onSubmit={handleActivate} className="space-y-4">
          {/* Activation Code Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 text-right">
              كود التفعيل (رمز الاشتراك المعتمد) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError('');
                }}
                placeholder="أدخل كود التفعيل"
                dir="ltr"
                autoFocus
                className="w-full text-center tracking-widest text-lg sm:text-xl font-mono font-black py-4 px-4 rounded-2xl bg-blue-50/50 dark:bg-slate-800/80 border-2 border-blue-400 dark:border-blue-600 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all uppercase"
              />
            </div>
            <p className="text-[11px] text-slate-400 text-right">
              يتم التحقق من صحة الكود وتفعيل الحساب مباشرة على خادم الأكاديمية.
            </p>
          </div>

          {/* Optional Phone Input or if requested */}
          {(showPhoneField || !localStorage.getItem('mct_auth_token')) && (
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 text-right">
                رقم الهاتف المسجل <span className="text-[10px] text-slate-400 font-normal">(لتأكيد الربط بحسابك)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setError('');
                  }}
                  placeholder="أدخل رقم الهاتف المسجل"
                  dir="ltr"
                  className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all text-sm text-right"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-base shadow-lg shadow-blue-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري التحقق وتفعيل الحساب...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>تفعيل الاشتراك والتصفح الآن</span>
              </>
            )}
          </button>
        </form>

        {/* Contact Help */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            لم تستلم كود التفعيل بعد سداد الرسوم؟
          </p>
          <button
            type="button"
            onClick={handleContactSupport}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 font-bold text-xs transition-all cursor-pointer border border-emerald-200 dark:border-emerald-800"
          >
            <MessageCircle className="w-4 h-4" />
            <span>تواصل مع الإدارة عبر واتساب ({whatsappNumber})</span>
          </button>

          {onBack && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onBack}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
              >
                العودة للخلف
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
