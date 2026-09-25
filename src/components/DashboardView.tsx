import React, { useState, useEffect, useMemo } from 'react';
import { StudentProfile, Subject, Lesson, ExplainLessonResult } from '../types';
import { calculatePersonalizedPath } from '../services/learningPathService';
import { 
  GraduationCap, 
  School, 
  Calendar, 
  Clock, 
  Cpu, 
  BookOpen, 
  Scale, 
  Ruler, 
  Binary, 
  Zap, 
  Sparkles, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ShieldCheck, 
  Award,
  ChevronLeft,
  Bookmark,
  Camera,
  Layers,
  HelpCircle,
  KeyRound,
  MessageCircle,
  Lock,
  User,
  FileText,
  Bot,
  Edit3,
  Trash2,
  Compass,
  TrendingUp,
  Target,
  RotateCcw,
  Lightbulb,
  ArrowRight
} from 'lucide-react';

interface DashboardViewProps {
  student: StudentProfile;
  subjects: Subject[];
  lessons?: Lesson[];
  onNavigateToTab: (tab: any) => void;
  onSelectSubject: (subjectId: string) => void;
  onSelectLesson?: (lessonId: string) => void;
  onRenewSubscription: () => void;
  onOpenActivation?: () => void;
  onOpenSavedLesson?: (lesson) => void;
  onOpenProfile?: () => void;
  whatsappNumber?: string;
  onOpenExam?: (subject?: Subject, lesson?: Lesson) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  student,
  subjects,
  lessons = [],
  onNavigateToTab,
  onSelectSubject,
  onSelectLesson,
  onRenewSubscription,
  onOpenActivation,
  onOpenSavedLesson,
  onOpenProfile,
  whatsappNumber = '785502919',
  onOpenExam,
}) => {
  const isPending = !student.isActivated || student.subscriptionStatus === 'pending';
  const isExpired = student.isExpired || (student.remainingDays !== undefined && student.remainingDays <= 0);

  // Load saved explained lessons & personal notes for this student
  const [savedLessons, setSavedLessons] = useState<ExplainLessonResult[]>([]);
  const [studentNotes, setStudentNotes] = useState<Record<string, { text: string; lessonTitle?: string; updatedAt: string }>>({});

  useEffect(() => {
    try {
      const localKey = `mct_explained_lessons_${student.id}`;
      const saved = localStorage.getItem(localKey);
      if (saved) {
        setSavedLessons(JSON.parse(saved));
      }
    } catch (e) {
      // ignore
    }

    // Fetch personal notes from database
    const fetchNotes = async () => {
      try {
        const token = localStorage.getItem('mct_auth_token');
        const res = await fetch(`/api/student/notes?studentId=${student.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (data.notes) {
            setStudentNotes(data.notes);
          }
        }
      } catch (err) {
        console.warn('Failed to load notes from API:', err);
      }
    };

    fetchNotes();
  }, [student.id]);

  const handleContactWhatsApp = () => {
    const cleanNumber = whatsappNumber.startsWith('967') ? whatsappNumber : `967${whatsappNumber.replace(/^0+/, '')}`;
    const msg = `السلام عليكم إدارة الأكاديمية، أنا الطالب ${student.name}، أريد تأكيد الدفع وتفعيل حسابي.`;
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleToolClick = (tabName: string) => {
    if (isPending) {
      alert('حسابك في انتظار التفعيل بعد تأكيد الدفع من الإدارة. يرجى إدخال كود التفعيل أو التواصل معنا لتفعيل الحساب.');
      return;
    }
    if (isExpired) {
      alert('انتهت صلاحية اشتراكك. يرجى تجديد الاشتراك للوصول إلى المحتوى والأدوات.');
      return;
    }
    onNavigateToTab(tabName);
  };

  const handleSubjectClick = (subjectId: string) => {
    if (isPending) {
      alert('حسابك في انتظار التفعيل. المقررات التعليمية متاحة فور تفعيل الاشتراك.');
      return;
    }
    if (isExpired) {
      alert('انتهت صلاحية اشتراكك. يرجى التجديد لمتابعة الدروس.');
      return;
    }
    onSelectSubject(subjectId);
  };

  // Calculate overall completed lessons
  const totalCompleted = student.completedLessons?.length || 0;
  const totalLessonsEstimate = 24;
  const overallProgress = Math.min(100, Math.round((totalCompleted / totalLessonsEstimate) * 100));

  // Calculate dynamic personalized learning path data
  const pathData = useMemo(() => {
    return calculatePersonalizedPath(student, subjects, lessons);
  }, [student, subjects, lessons]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Pending Subscription Notice Banner */}
      {isPending && (
        <div className="p-5 sm:p-6 rounded-3xl bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg animate-fade-in">
          <div className="flex items-center gap-3.5 text-center md:text-right">
            <div className="w-12 h-12 rounded-2xl bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg">
                حسابك في انتظار التفعيل بعد تأكيد الدفع من الإدارة.
              </h3>
              <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 mt-0.5">
                تواصل مع الإدارة عبر واتساب لإرسال إشعار السداد أو أدخل كود التفعيل إذا استلمته.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={handleContactWhatsApp}
              className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>تأكيد الدفع عبر واتساب</span>
            </button>

            {onOpenActivation && (
              <button
                onClick={onOpenActivation}
                className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <KeyRound className="w-4 h-4" />
                <span>إدخال كود التفعيل</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Expiry Warning Notice if expired */}
      {!isPending && isExpired && (
        <div className="p-5 sm:p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3 text-center sm:text-right">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900 flex items-center justify-center text-rose-600 shrink-0">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                انتهى اشتراكك، يرجى التجديد للوصول إلى المحتوى.
              </h3>
              <p className="text-xs sm:text-sm text-rose-600 dark:text-rose-300 mt-0.5">
                تواصل مع الإدارة لتجديد الاشتراك ومتابعة مسيرتك التعليمية.
              </p>
            </div>
          </div>
          <button
            onClick={onRenewSubscription}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>تجديد الاشتراك عبر واتساب</span>
          </button>
        </div>
      )}

      {/* 3. Welcome & Student Overview Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white p-6 sm:p-8 shadow-xl shadow-blue-900/10">
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-blue-100">
              <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
              <span>مرحبًا بك في لوحة تحكم الطالب</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              أهلاً بك يا مهندس {student.name} 🎓
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 max-w-xl">
              "لا تحفظ القانون، افهمه." جاهز اليوم لمواصلة فهم المفاهيم الفيزيائية والكهربائية وحل المسائل؟
            </p>
            {onOpenProfile && (
              <div className="pt-1">
                <button
                  onClick={onOpenProfile}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all cursor-pointer backdrop-blur-xs border border-white/20 shadow-xs"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>تعديل بياناتي وكلمة المرور</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Subscription Status Pill */}
          <div className="w-full lg:w-auto p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-between lg:justify-start gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-black">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-blue-200 block">حالة الاشتراك</span>
                <span className="text-lg font-black text-white">
                  {isPending ? 'بانتظار التفعيل' : isExpired ? 'منتهي' : `${student.remainingDays} يومًا متبقيًا`}
                </span>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
              isPending 
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
            }`}>
              {student.subscriptionPlan === 'yearly' ? 'اشتراك سنوي' : 'اشتراك شهري'}
            </span>
          </div>

        </div>

        {/* Decorative background vectors */}
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 3.5. Personalized Learning Path & Recommendation Card (مسار التعلم المخصص) */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border-2 border-blue-600/80 dark:border-blue-500 shadow-xl p-5 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-600/25 shrink-0">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  مسار التعلم الشخصي الذكي
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${pathData.readinessColor}`}>
                  {pathData.readinessLabel}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
                خارطة طريقك الأكاديمية المقترحة 🧭
              </h2>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('learning-path')}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 self-start sm:self-auto"
          >
            <span>استعراض الخارطة الكاملة</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Recommendation Box */}
        {pathData.primaryRecommendation && (
          <div className={`p-4 sm:p-5 rounded-2xl border space-y-3.5 ${
            pathData.primaryRecommendation.recommendationType === 'remediation_review'
              ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
              : 'bg-gradient-to-br from-blue-50/60 to-indigo-50/60 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800/60'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold mb-1">
                  <span className={`px-2 py-0.5 rounded-md ${
                    pathData.primaryRecommendation.recommendationType === 'remediation_review'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-blue-600 text-white'
                  }`}>
                    {pathData.primaryRecommendation.recommendationType === 'remediation_review' ? '⚠️ تدارك وتثبيت' : 'الدرس التالي الموصى به 🎯'}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {pathData.primaryRecommendation.subject.name}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{pathData.primaryRecommendation.estimatedMinutes} دقيقة</span>
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {pathData.primaryRecommendation.title}
                </h3>
              </div>

              {onSelectLesson && (
                <button
                  onClick={() => onSelectLesson(pathData.primaryRecommendation!.lesson.id)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 shrink-0"
                >
                  <span>{pathData.primaryRecommendation.recommendationType === 'remediation_review' ? 'مراجعة الدرس وإعادة الاختبار' : 'ابدأ دراسة هذا الدرس الآن'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-white/70 dark:bg-slate-900/70 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
              💡 <strong>سبب الاقتراح:</strong> {pathData.primaryRecommendation.reason}
            </p>
          </div>
        )}

        {/* Path Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-400 block text-[10px] mb-0.5 font-bold">المنهاج المنجز</span>
            <span className="text-base font-black text-slate-900 dark:text-white">
              {pathData.completionRate}%
            </span>
            <span className="text-[10px] text-slate-500 block">({pathData.completedCount} من {pathData.totalLessons} دروس)</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-400 block text-[10px] mb-0.5 font-bold">معدل الاختبارات</span>
            <span className="text-base font-black text-slate-900 dark:text-white">
              {pathData.averageQuizScore > 0 ? `${pathData.averageQuizScore}%` : '-'}
            </span>
            <span className="text-[10px] text-slate-500 block">{pathData.averageQuizScore >= 80 ? 'إتقان مرتفع 🌟' : 'استيعاب متوسط'}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-400 block text-[10px] mb-0.5 font-bold">المستوى الدراسي</span>
            <span className="text-base font-black text-slate-900 dark:text-white line-clamp-1">
              {student.studyLevel}
            </span>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 block">{student.major}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-400 block text-[10px] mb-0.5 font-bold">الهدف الأسبوعي</span>
            <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
              {pathData.weeklyTarget.recommendedLessons} دروس
            </span>
            <span className="text-[10px] text-slate-500 block">خلال هذا الأسبوع</span>
          </div>
        </div>

      </div>

      {/* 4. Hero Feature Banner for "اشرح لي درس اليوم" */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 border border-blue-700/40 p-6 sm:p-8 text-white shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-bold text-cyan-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
              <span>ميزة رئيسية لطلاب السنة الأولى</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>اشرح لي درس اليوم</span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                جديد 🚀
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              🎓 <strong>ماذا درست اليوم في الجامعة؟</strong> ارفع صورة السبورة، أو دفترك، أو ملزمتك، أو ملف PDF، أو اكتب استفسارك، وسيشرحه لك المدرس الذكي خطوة بخطوة بطريقة سهلة ومختصرة مع ورقة مذاكرة جاهزة للاختبارات!
            </p>
          </div>

          <button
            onClick={() => handleToolClick('explain')}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-black text-sm sm:text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2.5 cursor-pointer shrink-0 transition-transform hover:scale-105"
          >
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span>ابدأ شرح درس اليوم 🚀</span>
          </button>
        </div>

        {/* Supported formats pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-blue-800/40 text-xs text-blue-200">
          <span className="text-slate-400 font-bold">طرق الإرسال:</span>
          <span className="px-2.5 py-0.5 rounded-md bg-white/10">📷 صور السبورة والدفتر</span>
          <span className="px-2.5 py-0.5 rounded-md bg-white/10">📄 ملفات PDF والملازم</span>
          <span className="px-2.5 py-0.5 rounded-md bg-white/10">📝 كتابة أو لصق المسائل</span>
          <span className="px-2.5 py-0.5 rounded-md bg-white/10">⚡ تحليل الدوائر الكهربائية</span>
        </div>
      </div>

      {/* 4.1 Engineering Assignment Creator Feature Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 border border-emerald-700/40 p-6 sm:p-8 text-white shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-xs font-bold text-emerald-300">
              <GraduationCap className="w-4 h-4 text-amber-300" />
              <span>خدمة متكاملة لطلاب الهندسة والميكاترونكس</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>🎓 منشئ التكليفات الهندسية</span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500 text-white font-black shadow-xs">
                جديد متاح مجانًا
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              أنشئ <strong>تقارير المختبرات، واجبات الدوائر والرياضيات، مشاريع Arduino و PLC والـ Robotics</strong> بضغطة زر مع غلاف أكاديمي رسمي، ومحرر كامل لتعديل كل التفاصيل وتصدير ملف <strong>PDF احترافي جاهز للطباعة</strong> والتسليم لجامعتك!
            </p>
          </div>

          <button
            onClick={() => handleToolClick('assignments')}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2.5 cursor-pointer shrink-0 transition-transform hover:scale-105"
          >
            <FileText className="w-5 h-5 text-amber-300" />
            <span>فتح منشئ التكليفات 🎓</span>
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-800/40 text-xs text-emerald-200">
          <span className="text-slate-400 font-bold">النماذج المدعومة:</span>
          <span className="px-2.5 py-0.5 rounded-md bg-white/10">🧪 تقارير تجارب المختبر</span>
          <span className="px-2.5 py-0.5 rounded-md bg-white/10">🔌 مشاريع Arduino</span>
          <span className="px-2.5 py-0.5 rounded-md bg-white/10">⚙️ أنظمة PLC</span>
          <span className="px-2.5 py-0.5 rounded-md bg-white/10">🔢 حل مسائل وقوانين</span>
          <span className="px-2.5 py-0.5 rounded-md bg-white/10">📄 تصدير PDF متعدد الصفحات</span>
        </div>
      </div>

      {/* 4.2 Official Expected Exam Papers Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950 via-slate-900 to-orange-950 border border-amber-500/40 p-6 sm:p-8 text-white shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-xs font-bold text-amber-300">
              <Award className="w-4 h-4 text-amber-400" />
              <span>نماذج اختبارات رسمية معتمدة لجامعات اليمن</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>📑 نماذج الاختبارات المتوقعة</span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black shadow-xs">
                تصدير PDF أو صورة PNG
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed">
              احصل على <strong>نماذج امتحانات نهائية، ونصفية، واختبارات تقييمية للدروس والمواد</strong> مطابقة للمواصفات الأكاديمية الرسمية! تشمل <strong>أسئلة الاختيار من متعدد، الصواب والخطأ، المسائل الحسابية، ونموذج الإجابة وسلم الدرجات الكامل</strong> مع إمكانية التنزيل كملف PDF عالي الجودة للطباعة أو كصورة فورية للمشاركة على واتساب.
            </p>
          </div>

          {onOpenExam && (
            <button
              onClick={() => onOpenExam(subjects[0])}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm sm:text-base shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2.5 cursor-pointer shrink-0 transition-transform hover:scale-105"
            >
              <FileText className="w-5 h-5 text-slate-950" />
              <span>استعراض نماذج الامتحانات (PDF / صورة) 📑</span>
            </button>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-800/40 text-xs text-amber-200">
          <span className="text-slate-400 font-bold">النماذج المتاحة:</span>
          <span className="px-2.5 py-0.5 rounded-md bg-white/10">🎓 امتحانات نهائية (100 درجة)</span>
          <span className="px-2.5 py-0.5 rounded-md bg-white/10">📋 امتحانات نصفية (50 درجة)</span>
          <span className="px-2.5 py-0.5 rounded-md bg-white/10">⏱️ كويزات فصيلة واختبارات دروس</span>
          <span className="px-2.5 py-0.5 rounded-md bg-white/10">✅ سلم الدرجات والحلول النموذجية</span>
          <span className="px-2.5 py-0.5 rounded-md bg-white/10">🖼️ تنزيل فوري كصورة PNG أو PDF</span>
        </div>
      </div>

      {/* 5. Student Profile Information Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>معلومات الطالب والاشتراك الأكاديمي</span>
          </h2>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
            isPending 
              ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300' 
              : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
          }`}>
            الحالة: {isPending ? 'بانتظار التفعيل' : isExpired ? 'منتهي' : 'نشط ومفعل'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs sm:text-sm">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-400 dark:text-slate-500 block text-[11px] mb-1">الجامعة</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1" title={student.university}>
              {student.university}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-400 dark:text-slate-500 block text-[11px] mb-1">المستوى</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {student.studyLevel}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-400 dark:text-slate-500 block text-[11px] mb-1">التخصص</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {student.major}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-400 dark:text-slate-500 block text-[11px] mb-1">تاريخ البدء</span>
            <span className="font-bold text-slate-800 dark:text-slate-200" dir="ltr">
              {student.subscriptionStartDate ? new Date(student.subscriptionStartDate).toLocaleDateString('en-GB') : '-'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-400 dark:text-slate-500 block text-[11px] mb-1">تاريخ الانتهاء</span>
            <span className="font-bold text-slate-800 dark:text-slate-200" dir="ltr">
              {student.subscriptionEndDate ? new Date(student.subscriptionEndDate).toLocaleDateString('en-GB') : '-'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-400 dark:text-slate-500 block text-[11px] mb-1">الأيام المتبقية</span>
            <span className={`font-extrabold flex items-center gap-1 ${isPending ? 'text-amber-600' : isExpired ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'}`}>
              <span className={`w-2 h-2 rounded-full ${isPending ? 'bg-amber-500' : isExpired ? 'bg-rose-500' : 'bg-emerald-500'}`} />
              <span>{isPending ? 'بانتظار التفعيل' : `${student.remainingDays || 0} يوم`}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 6. Quick Access Tools Grid */}
      <div className="space-y-3">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>الأدوات الهندسية والوصول السريع</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          
          <button
            onClick={() => handleToolClick('subjects')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 text-right space-y-2 group transition-all cursor-pointer shadow-xs relative"
          >
            {isPending && <Lock className="w-3.5 h-3.5 absolute top-3 left-3 text-slate-400" />}
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">المواد الدراسية</div>
              <div className="text-[11px] text-slate-500">مناهج السنة الأولى</div>
            </div>
          </button>

          <button
            onClick={() => handleToolClick('formulas')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 text-right space-y-2 group transition-all cursor-pointer shadow-xs relative"
          >
            {isPending && <Lock className="w-3.5 h-3.5 absolute top-3 left-3 text-slate-400" />}
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">محلل القوانين</div>
              <div className="text-[11px] text-slate-500">تحليل الأبعاد والرموز</div>
            </div>
          </button>

          <button
            onClick={() => handleToolClick('units')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 text-right space-y-2 group transition-all cursor-pointer shadow-xs relative"
          >
            {isPending && <Lock className="w-3.5 h-3.5 absolute top-3 left-3 text-slate-400" />}
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">محلل الوحدات</div>
              <div className="text-[11px] text-slate-500">تحويلات خطوة بخطوة</div>
            </div>
          </button>

          <button
            onClick={() => handleToolClick('circuits')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500 dark:hover:border-cyan-500 text-right space-y-2 group transition-all cursor-pointer shadow-xs relative"
          >
            {isPending && <Lock className="w-3.5 h-3.5 absolute top-3 left-3 text-slate-400" />}
            <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">الدوائر الكهربائية 1</div>
              <div className="text-[11px] text-slate-500">أوم ومجزئ الجهد</div>
            </div>
          </button>

          <button
            onClick={() => handleToolClick('math')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 text-right space-y-2 group transition-all cursor-pointer shadow-xs relative"
          >
            {isPending && <Lock className="w-3.5 h-3.5 absolute top-3 left-3 text-slate-400" />}
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Binary className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">الرياضيات الهندسية</div>
              <div className="text-[11px] text-slate-500">معادلات ومتجهات</div>
            </div>
          </button>

          <button
            onClick={() => handleToolClick('explain')}
            className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/60 dark:to-indigo-950/60 border-2 border-blue-500/50 hover:border-blue-600 text-right space-y-2 group transition-all cursor-pointer shadow-xs relative"
          >
            {isPending && <Lock className="w-3.5 h-3.5 absolute top-3 left-3 text-slate-400" />}
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-xs sm:text-sm text-blue-900 dark:text-blue-200">اشرح لي درسي</div>
              <div className="text-[11px] text-blue-600 dark:text-blue-400">رفع صورة أو كتابة</div>
            </div>
          </button>

          <button
            onClick={() => handleToolClick('assignments')}
            className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/60 dark:to-teal-950/60 border-2 border-emerald-500/50 hover:border-emerald-600 text-right space-y-2 group transition-all cursor-pointer shadow-xs relative"
          >
            {isPending && <Lock className="w-3.5 h-3.5 absolute top-3 left-3 text-slate-400" />}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 flex items-center gap-1">
                <span>منشئ التكليفات</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500 text-white font-bold">جديد</span>
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400">تقارير، أبحاث وتصدير PDF</div>
            </div>
          </button>

          <button
            onClick={() => handleToolClick('arduino')}
            className="p-4 rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/60 dark:to-blue-950/60 border-2 border-cyan-500/50 hover:border-cyan-600 text-right space-y-2 group transition-all cursor-pointer shadow-xs relative"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-xs sm:text-sm text-cyan-900 dark:text-cyan-200 flex items-center gap-1">
                <span>محاكي Arduino</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500 text-black font-bold">تفاعلي</span>
              </div>
              <div className="text-[11px] text-cyan-600 dark:text-cyan-400">مختبر إلكترونيات وتوصيل أسلاك</div>
            </div>
          </button>

          {onOpenExam && (
            <button
              onClick={() => onOpenExam(subjects[0])}
              className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/60 dark:to-orange-950/60 border-2 border-amber-500/50 hover:border-amber-600 text-right space-y-2 group transition-all cursor-pointer shadow-xs relative"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm font-black">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-xs sm:text-sm text-amber-950 dark:text-amber-200 flex items-center gap-1">
                  <span>نماذج الاختبارات</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-bold">PDF / صورة</span>
                </div>
                <div className="text-[11px] text-amber-700 dark:text-amber-400">امتحانات متوقعة مع سلم الدرجات</div>
              </div>
            </button>
          )}

        </div>
      </div>

      {/* 6.5. دفتر ملاحظاتي الشخصية المخزنة */}
      {Object.keys(studentNotes).length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-500" />
              <span>دفتر ملاحظاتي الشخصية على الدروس ({Object.keys(studentNotes).length})</span>
            </h2>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              مخزنة بسيرفر الأكاديمية 💾
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(studentNotes).map(([lessonId, note]) => (
              <div
                key={lessonId}
                className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 space-y-2.5 shadow-xs hover:border-amber-400 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{note.lessonTitle || lessonId}</span>
                  </span>
                  {note.updatedAt && (
                    <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 font-mono">
                      {new Date(note.updatedAt).toLocaleDateString('ar-YE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-amber-100 dark:border-amber-900/40 line-clamp-3">
                  {note.text}
                </p>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => handleToolClick('subjects')}
                    className="text-xs font-bold text-amber-800 dark:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>فتح الدرس للتعديل</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Curriculum Subjects Overview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>المقررات الدراسية المتاحة (الفصل الأول)</span>
          </h2>
          <button
            onClick={() => handleToolClick('subjects')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>عرض كل المواد والدروس</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <div
              key={subject.id}
              onClick={() => handleSubjectClick(subject.id)}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/80 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3 relative"
            >
              {isPending && <Lock className="w-4 h-4 absolute top-4 left-4 text-slate-400" />}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {subject.code}
                </span>
                <span className="text-xs text-slate-400">{subject.semester}</span>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {subject.name}
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  {subject.englishName}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {subject.description}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
