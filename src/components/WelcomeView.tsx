import React from 'react';
import { 
  Cpu, 
  Sparkles, 
  ArrowLeft, 
  LogIn,
  UserPlus,
  BookOpen, 
  Zap, 
  CheckCircle2, 
  GraduationCap, 
  Scale, 
  Calculator,
  Activity,
  Layers,
  FileText,
  ShieldCheck,
  Check,
  HelpCircle,
  Bot
} from 'lucide-react';
import { Subject } from '../types';

interface WelcomeViewProps {
  onRegister: () => void;
  onLogin: () => void;
  subjects?: Subject[];
  monthlyPriceUSD?: number;
  yearlyPriceUSD?: number;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({
  onRegister,
  onLogin,
  subjects = [],
  monthlyPriceUSD = 20,
  yearlyPriceUSD = 200,
}) => {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 space-y-16 max-w-6xl mx-auto">
      
      {/* ========================================== */}
      {/* HERO SECTION */}
      {/* ========================================== */}
      <section className="text-center space-y-8 pt-4 sm:pt-8">
        {/* Academic Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-semibold shadow-xs">
          <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>منصة تعليمية متخصصة لطلاب السنة الأولى هندسة ميكاترونكس في اليمن</span>
        </div>

        {/* Hero Logo & Title */}
        <div className="space-y-4">
          <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/25">
            <Cpu className="w-12 h-12 sm:w-14 sm:h-14 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-slate-900">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            أكاديمية الميكاترونكس اليمنية
          </h1>

          <div className="inline-block px-4 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-extrabold text-lg sm:text-xl border border-blue-200 dark:border-blue-900">
            افهم الميكاترونكس بطريقة سهلة
          </div>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            المنصة الأولى المتكاملة لمساعدة طالب الميكاترونكس على فهم مواد السنة الأولى خطوة بخطوة، مصممة وفق مفردات الجامعة الإماراتية الدولية بصنعاء وبقية الجامعات اليمنية.
          </p>
        </div>

        {/* Educational Philosophy */}
        <div className="max-w-xl mx-auto p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-cyan-500/10 border border-blue-200/60 dark:border-blue-800/60">
          <p className="text-sm sm:text-base font-extrabold text-blue-900 dark:text-blue-200">
            فلسفتنا التعليمية: <span className="underline decoration-amber-400 decoration-2">"لا تحفظ القانون، افهمه."</span>
          </p>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            نشرح كل قانون من الصفر: ما معناه؟ ما وحداته؟ ما أبعاده؟ متى تستخدمه ومتى لا تستخدمه؟ مع خطوات الحل الدقيقة.
          </p>
        </div>

        {/* Primary Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            onClick={onRegister}
            className="w-full sm:w-auto min-w-[200px] flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-base sm:text-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <UserPlus className="w-5 h-5" />
            <span>اشترك الآن</span>
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            onClick={onLogin}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 font-bold text-base transition-all cursor-pointer shadow-xs"
          >
            <LogIn className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>تسجيل الدخول</span>
          </button>
        </div>
      </section>

      {/* ========================================== */}
      {/* 1. المواد التعليمية (CURRICULUM) */}
      {/* ========================================== */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>المقررات الأكاديمية</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            المواد التعليمية للسنة الأولى
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            محتوى منظم ومكتوب خصيصًا ليغطي كامل متطلبات ومفردات الفصلين الأول والثاني.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              name: 'الفيزياء الهندسية',
              english: 'Engineering Physics',
              code: 'PHYS101',
              desc: 'الميكانيكا الكلاسيكية، قوانين نيوتن، المتجهات، الشغل والطاقة، وتحليل الأبعاد.',
              color: 'from-blue-600 to-indigo-600',
              icon: BookOpen,
            },
            {
              name: 'الدوائر الكهربائية 1',
              english: 'Electric Circuits I',
              code: 'EE101',
              desc: 'قانون أوم، كيرشوف KCL/KVL، مجزئ الجهد والتيار، والتوالي والتوازي.',
              color: 'from-amber-500 to-orange-600',
              icon: Zap,
            },
            {
              name: 'الرياضيات الهندسية 1',
              english: 'Engineering Mathematics I',
              code: 'MATH101',
              desc: 'التفاضل والتكامل، النهايات، المصفوفات، والدوال الرياضية الهندسية.',
              color: 'from-emerald-600 to-teal-600',
              icon: Calculator,
            },
            {
              name: 'برمجة الحاسوب C/C++',
              english: 'Computer Programming',
              code: 'CS101',
              desc: 'أساسيات البرمجة للمتحكمات الدقيقة، الخوارزميات، وتراكيب التحكم.',
              color: 'from-purple-600 to-violet-600',
              icon: Layers,
            },
            {
              name: 'مقدمة في هندسة الميكاترونكس',
              english: 'Intro to Mechatronics',
              code: 'MCT100',
              desc: 'تكامل الأنظمة الميكانيكية والإلكترونية والبرمجية والحساسات والمشغلات.',
              color: 'from-cyan-600 to-blue-600',
              icon: Cpu,
            },
            {
              name: 'الرسم الهندسي الميكانيكي',
              english: 'Engineering Drawing',
              code: 'ME101',
              desc: 'الإسقاط المتعامد، القطاعات، الأبعاد القياسية، والمجسمات ثلاثية الأبعاد.',
              color: 'from-rose-600 to-pink-600',
              icon: Activity,
            },
          ].map((subj, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {subj.code}
                  </span>
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${subj.color} flex items-center justify-center text-white shadow-xs`}>
                    <subj.icon className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    {subj.name}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium block">
                    {subj.english}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {subj.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================== */}
      {/* 2. مختبر المهندس والمحاكيات (LAB & SIMULATORS) */}
      {/* ========================================== */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 text-xs font-bold">
            <Zap className="w-3.5 h-3.5" />
            <span>مختبر المهندس والمحاكيات</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            مختبر المهندس التفاعلي
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            جرّب الدوائر الكهربائية، واختبر قوانين الحركة، وحاكي الروبوتات في بيئة افتراضية تفاعلية.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>محاكي Arduino التفاعلي</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500 text-black font-bold">جديد</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              مختبر إلكترونيات كامل: تركيب لوحة Arduino و Breadboard، توصيل الأسلاك باللمس، فحص الأخطاء والقصر، وتشغيل الكود مع Serial Monitor.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              محاكي الدوائر وقانون أوم
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              تحكم بالجهد والتيار والمقاومة لحظيًا، وشاهد كيف يتغير سريان الشحنات ودرجة حرارة المقاومة مع رسم بياني تفاعلي.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              محاكي المقذوفات والحركة
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              محاكاة فيزيائية حقيقية لحركة الأجسام في بعدين، زاوية الإطلاق، المدى الأفقي، وأقصى ارتفاع بالمعادلات اللحظية.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              محلل ذراع الروبوت (2-DOF)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              تحريك ذراع الروبوت وحساب الموقع (Forward Kinematics) وزوايا المفاصل، وتوضيح تطبيق العزم في الميكاترونكس.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* 3. الحاسبات الهندسية (CALCULATORS) */}
      {/* ========================================== */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <Calculator className="w-3.5 h-3.5" />
            <span>الحاسبات الهندسية</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            حاسبات وأدوات المهندس
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            أدوات حسابية متطورة توضح لك خطوات التعويض، الوحدات، والأبعاد الفيزيائية.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <Scale className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">محلل الأبعاد [M, L, T]</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              التحقق من صحة القوانين وتوازن الأبعاد للطرفين.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <Calculator className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">محول الوحدات الهندسي</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              تحويلات الطول، الكتلة، القوة، الضغط، والطاقة مع معامل التحويل.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <Zap className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">حاسبة التوالي والتوازي</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              حساب المقاومة والمكثف المكافئ مع توزيع الجهد والتيار.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">حاسبة المتجهات والمثلثات</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              تحليل القوى والضرب القياسي والاتجاهي والمحصلة.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* 4. ميزة اشرح لي درس اليوم (EXPLAIN LESSON) */}
      {/* ========================================== */}
      <section className="p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-950 text-white shadow-xl space-y-6">
        <div className="max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>ميزة الذكاء الاصطناعي الأكاديمي</span>
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            ميزة "اشرح لي درس اليوم"
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            التقط صورة لدفتر المحاضرة أو ارفع ملف PDF لأي محاضرة أعطاها لك الدكتور في الجامعة، وسيقوم النظام فورًا بتحليلها وشرحها:
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
          {[
            'اسم الدرس والفكرة الأساسية',
            'شرح مبسط بلغة هندسية واضحة',
            'جدول المصطلحات والقوانين',
            'الوحدات والأبعاد الفيزيائية',
            'أمثلة محلولة واختبارات قصيرة',
          ].map((feat, i) => (
            <div key={i} className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{feat}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================== */}
      {/* 4.1 منشئ التكليفات الهندسية (ASSIGNMENTS GENERATOR) */}
      {/* ========================================== */}
      <section className="p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 text-white shadow-xl space-y-6 border border-emerald-800/40">
        <div className="max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
            <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
            <span>خدمة التكليفات والأبحاث الهندسية</span>
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            🎓 منشئ التكليفات والتقارير الهندسية
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            أنشئ تقارير المختبرات، ومشاريع Arduino والـ PLC، وبحوث الميكاترونكس بنقرة واحدة، مع غلاف أكاديمي رسمي وتصدير PDF متقن للطباعة والتسليم:
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
          {[
            'غلاف جامعي رسمي مع الشعار',
            'نماذج مخصصة للمختبر والمشاريع',
            'محرر تفاعلي لتعديل كل قسم',
            'أدوات صياغة وتلخيص هندسي',
            'تصدير PDF جاهز للطباعة',
          ].map((feat, i) => (
            <div key={i} className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{feat}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================== */}
      {/* 5. الاشتراكات (PRICING & PLANS) */}
      {/* ========================================== */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>خطط الاشتراك</span>
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
            اختر خطة الاشتراك المناسبة لك
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            استثمار في مستقبلك الهندسي مع وصول غير محدود لكافة المقررات والمحاكيات والمساعد الذكي.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Monthly Plan */}
          <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
                  مرن وسهل التجربة
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  30 يومًا
                </span>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  الاشتراك الشهري
                </h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-black text-blue-600 dark:text-blue-400">
                    {monthlyPriceUSD}$
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">/ شهر</span>
                </div>
              </div>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>الوصول لكافة شروحات مواد السنة الأولى</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>محلل القوانين والتحويلات الهندسية خطوة بخطوة</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>مختبر المحاكيات والحاسبات الهندسية</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>مساعد الميكاترونكس الذكي</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onRegister}
              className="w-full py-3.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-sm transition-all cursor-pointer text-center"
            >
              اشترك في الخطة الشهرية
            </button>
          </div>

          {/* Yearly Plan */}
          <div className="relative rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 border-2 border-blue-600 dark:border-blue-500 shadow-xl shadow-blue-500/10 flex flex-col justify-between space-y-6">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 font-extrabold text-xs shadow-md flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>الخيار الأكثر توفيرًا وطلبًا</span>
            </div>

            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                  سنة كاملة (365 يومًا)
                </span>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                  توفير 40$
                </span>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  الاشتراك السنوي
                </h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-black text-blue-600 dark:text-blue-400">
                    {yearlyPriceUSD}$
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">/ سنة كاملة</span>
                </div>
              </div>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>كل مميزات المنصة لمدة 365 يومًا</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>تغطية كاملة للفصلين الأول والثاني</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>نماذج وحلول اختبارات جامعية سابقة</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>أولوية الإجابة في مساعد الميكاترونكس الذكي</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>دعم واستشارات أكاديمية مستمرة</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onRegister}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer text-center"
            >
              اشترك في الخطة السنوية
            </button>
          </div>
        </div>
      </section>

      {/* Covered Universities Footer */}
      <section className="pt-8 border-t border-slate-200 dark:border-slate-800 text-center space-y-3">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          مناهج مصممة خصيصًا لطلاب هندسة الميكاترونكس في:
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            'الجامعة الإماراتية الدولية – صنعاء',
            'جامعة صنعاء',
            'جامعة العلوم والتكنولوجيا',
            'الجامعة اليمنية',
            'جامعة المستقبل',
            'جامعة الملكة أروى',
            'كافة كليات الهندسة باليمن',
          ].map((uni, idx) => (
            <span
              key={idx}
              className="px-3 py-1 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
            >
              {uni}
            </span>
          ))}
        </div>
      </section>

    </div>
  );
};
