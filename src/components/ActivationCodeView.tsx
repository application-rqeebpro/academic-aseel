import React, { useState } from 'react';
import { StudentProfile } from '../types';
import { 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ArrowLeft, 
  Loader2, 
  Sparkles,
  MessageCircle
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
      const token = localStorage.getItem('mct_auth_token');
      const res = await fetch('/api/activate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ code: cleanCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'كود التفعيل غير صحيح.');
      }

      setSuccessMsg(data.message || 'تم تفعيل الاشتراك بنجاح!');

      // Fetch latest profile or construct updated student
      setTimeout(async () => {
        try {
          const meRes = await fetch('/api/auth/me', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (meRes.ok) {
            const meData = await meRes.json();
            const updatedStudent: StudentProfile = {
              id: meData.user.id,
              name: meData.user.name,
              phone: meData.user.phone,
              email: meData.user.email,
              university: meData.user.university,
              studyLevel: meData.user.studyLevel,
              major: meData.user.major,
              role: meData.user.role,
              subscriptionPlan: meData.subscription?.plan || 'monthly',
              subscriptionStatus: 'active',
              subscriptionStartDate: meData.subscription?.startDate,
              subscriptionEndDate: meData.subscription?.expiryDate,
              remainingDays: meData.subscription?.remainingDays || 30,
              isActivated: true,
              isExpired: false,
              completedLessons: meData.progress?.completedLessons || [],
              quizScores: meData.progress?.quizScores || {},
            };
            onActivationSuccess(updatedStudent);
            return;
          }
        } catch (e) {
          // fallback
        }

        // Fallback update
        const fallbackStudent: StudentProfile = {
          id: `student-${Date.now()}`,
          name: 'طالب الأكاديمية',
          phone: '',
          university: 'الجامعة الإماراتية الدولية – صنعاء',
          studyLevel: 'السنة الأولى',
          major: 'هندسة الميكاترونكس',
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
        onActivationSuccess(fallbackStudent);
      }, 1200);

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
            أدخل كود التفعيل الذي استلمته من إدارة الأكاديمية بعد تأكيد الدفع
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
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 text-right">
              أدخل كود التفعيل
            </label>
            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError('');
                }}
                placeholder="مثال: MCT-Y1234 أو كود الأكاديمية"
                dir="ltr"
                className="w-full text-center tracking-widest text-lg sm:text-xl font-mono font-black py-4 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-400 text-right">
              يتم التحقق من صحة الكود وصلاحيته مباشرة على خادم الأكاديمية.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-base shadow-lg shadow-blue-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري التحقق والتفعيل...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>تفعيل الاشتراك</span>
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
