import React, { useState } from 'react';
import { AcademyLogo } from './AcademyLogo';
import { 
  User, 
  Phone, 
  School, 
  Cpu, 
  ArrowLeft, 
  AlertCircle, 
  Lock, 
  Mail, 
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { StudyLevel } from '../types';

interface RegistrationViewProps {
  onProceedToPlans: (data: {
    name: string;
    phone: string;
    university: string;
    studyLevel: StudyLevel;
    major: string;
    email?: string;
    password?: string;
  }) => void;
  onBack: () => void;
  onOpenLogin?: () => void;
}

const UNIVERSITIES = [
  'الجامعة الإماراتية الدولية – صنعاء',
  'جامعة صنعاء',
  'جامعة العلوم والتكنولوجيا',
  'الجامعة اليمنية',
  'جامعة المستقبل',
  'جامعة الملكة أروى',
  'جامعة ذمار',
  'جامعة تعز',
  'جامعة إب',
  'جامعة عدن',
  'جامعة أخرى',
] as const;

type UniversityOption = typeof UNIVERSITIES[number];

const STUDY_LEVELS: StudyLevel[] = [
  'السنة الأولى',
  'السنة الثانية',
  'السنة الثالثة',
  'السنة الرابعة',
  'السنة الخامسة',
];

export const RegistrationView: React.FC<RegistrationViewProps> = ({
  onProceedToPlans,
  onBack,
  onOpenLogin,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedUni, setSelectedUni] = useState<UniversityOption>('الجامعة الإماراتية الدولية – صنعاء');
  const [customUni, setCustomUni] = useState('');
  const [studyLevel, setStudyLevel] = useState<StudyLevel>('السنة الأولى');
  const [major, setMajor] = useState('هندسة الميكاترونكس');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('يرجى إدخال اسم الطالب الكامل.');
      return;
    }

    if (!phone.trim()) {
      setError('يرجى إدخال رقم الهاتف للتواصل وتفعيل الاشتراك.');
      return;
    }

    if (!password || password.length < 4) {
      setError('يرجى إدخال كلمة مرور مكونة من 4 أحرف أو أرقام على الأقل لتسجيل الدخول.');
      return;
    }

    const finalUniversity = selectedUni === 'جامعة أخرى' ? (customUni.trim() || 'جامعة يمنية') : selectedUni;

    setLoading(true);
    try {
      // Register student in backend
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          password: password,
          university: finalUniversity,
          studyLevel,
          major: major.trim() || 'هندسة الميكاترونكس',
          plan: 'monthly',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        // If already registered, still proceed or warn
        if (data.error && data.error.includes('مستخدم مسبقًا')) {
          setError(data.error);
          setLoading(false);
          return;
        }
        throw new Error(data.error || 'حدث خطأ أثناء تسجيل الحساب');
      }

      if (data.token) {
        localStorage.setItem('mct_auth_token', data.token);
      }

      onProceedToPlans({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        password: password,
        university: finalUniversity,
        studyLevel,
        major: major.trim() || 'هندسة الميكاترونكس',
      });
    } catch (err: any) {
      // If server unreachable, proceed locally so student flow isn't blocked
      onProceedToPlans({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        password: password,
        university: finalUniversity,
        studyLevel,
        major: major.trim() || 'هندسة الميكاترونكس',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4 sm:px-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        
        {/* Title */}
        <div className="text-center space-y-2">
          <AcademyLogo variant="icon" size="lg" className="mx-auto" />
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            تسجيل بيانات الطالب
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            أدخل بياناتك للانتقال إلى اختيار خطة الاشتراك وتفعيل حسابك
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs sm:text-sm border border-rose-200 dark:border-rose-900">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* 1. اسم الطالب الكامل */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              اسم الطالب الكامل <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: أحمد عبدالكريم الصبري"
                className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>
          </div>

          {/* 2. رقم الهاتف */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              رقم الهاتف (واتساب) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="مثال: 771234567"
                className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                dir="ltr"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              يُستخدم لتسجيل الدخول والتواصل مع إدارة الأكاديمية عبر واتساب
            </p>
          </div>

          {/* 3. كلمة المرور */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              كلمة المرور للحساب <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                dir="ltr"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              احفظ كلمة المرور لاستخدامها عند تسجيل الدخول في أي وقت
            </p>
          </div>

          {/* 4. البريد الإلكتروني (إن أمكن) */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              البريد الإلكتروني <span className="text-xs text-slate-400 font-normal">(اختياري)</span>
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                dir="ltr"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>
          </div>

          {/* 5. اسم الجامعة */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              اسم الجامعة <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={selectedUni}
                onChange={(e) => setSelectedUni(e.target.value as UniversityOption)}
                className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                {UNIVERSITIES.map((uni) => (
                  <option key={uni} value={uni}>
                    {uni}
                  </option>
                ))}
              </select>
              <School className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
            </div>

            {selectedUni === 'جامعة أخرى' && (
              <div className="mt-2">
                <input
                  type="text"
                  value={customUni}
                  onChange={(e) => setCustomUni(e.target.value)}
                  placeholder="اكتب اسم جامعتك يدويًا هنا..."
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* 6. المستوى الدراسي */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              المستوى الدراسي <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STUDY_LEVELS.map((level) => (
                <button
                  type="button"
                  key={level}
                  onClick={() => setStudyLevel(level)}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    studyLevel === level
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* 7. التخصص */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              التخصص <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="هندسة الميكاترونكس"
                className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Cpu className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              رجوع
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري تسجيل الحساب...</span>
                </>
              ) : (
                <>
                  <span>متابعة لاختيار الخطة</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {onOpenLogin && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onOpenLogin}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                لديك حساب بالفعل؟ تسجيل الدخول
              </button>
            </div>
          )}

        </form>

      </div>
    </div>
  );
};
