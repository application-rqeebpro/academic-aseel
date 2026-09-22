import React, { useState } from 'react';
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
  Bot,
  Terminal,
  Compass,
  Crown,
  Play,
  Sliders,
  Sparkle,
  Binary
} from 'lucide-react';
import { Subject } from '../types';

interface WelcomeViewProps {
  onRegister: () => void;
  onLogin: () => void;
  onOpenAdmin?: () => void;
  subjects?: Subject[];
  monthlyPriceUSD?: number;
  yearlyPriceUSD?: number;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({
  onRegister,
  onLogin,
  onOpenAdmin,
  subjects = [],
  monthlyPriceUSD = 20,
  yearlyPriceUSD = 200,
}) => {
  const [activePreviewTab, setActivePreviewTab] = useState<'arduino' | 'explain' | 'assignments' | 'calculators' | 'curriculum'>('arduino');

  return (
    <div className="py-6 px-3 sm:px-6 lg:px-8 space-y-12 sm:space-y-16 max-w-6xl mx-auto">
      
      {/* ========================================== */}
      {/* 1. HERO SECTION */}
      {/* ========================================== */}
      <section className="relative text-center space-y-6 sm:space-y-8 pt-2 sm:pt-6 overflow-hidden">
        
        {/* Background Glowing Orb Effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 sm:w-96 sm:h-96 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-2xl -z-10 pointer-events-none" />

        {/* Top Badges Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {/* Main Academic Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-bold shadow-xs backdrop-blur-md">
            <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>المنصة الأولى لطلاب السنة الأولى هندسة ميكاترونكس باليمن</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          </div>

          {/* Owner Quick Access Icon Button */}
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-100/80 dark:bg-indigo-950/80 border border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-200 transition-all cursor-pointer shadow-xs"
              title="لوحة تحكم المالك / الإدارة"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>لوحة المالك</span>
            </button>
          )}
        </div>

        {/* Hero Central Branding */}
        <div className="space-y-4 max-w-3xl mx-auto">
          {/* Futuristic Animated Icon */}
          <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/25 border border-white/20 hover:scale-105 transition-transform duration-300">
            <Cpu className="w-10 h-10 sm:w-12 sm:h-12 animate-pulse" />
            <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center text-slate-900 shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight sm:leading-none">
            أكاديمية <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">الميكاترونكس</span> اليمنية
          </h1>

          <div className="inline-block px-4 py-1.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/60 dark:to-indigo-950/60 text-blue-700 dark:text-blue-300 font-extrabold text-base sm:text-xl border border-blue-200/80 dark:border-blue-800/80 shadow-xs">
            ⚡ "افهم الميكاترونكس بطريقة سهلة"
          </div>

          <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            تغطية شاسعة وشاملة لكل ما يحتاجه طالب السنة الأولى: شروحات مبسطة، محاكيات تفاعلية للدوائر والروبوتات، حاسبات أبعاد وقوانين، ومساعد ذكاء اصطناعي أكاديمي مخصص لمنهج الجامعة الإماراتية الدولية وبقية الجامعات اليمنية.
          </p>
        </div>

        {/* Primary Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2 max-w-md mx-auto sm:max-w-none">
          <button
            onClick={onRegister}
            className="w-full sm:w-auto min-w-[220px] flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-base sm:text-lg shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group"
          >
            <UserPlus className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span>اشترك الآن</span>
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onLogin}
            className="w-full sm:w-auto min-w-[180px] flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-white border-2 border-slate-200 dark:border-slate-800 font-extrabold text-base transition-all cursor-pointer shadow-xs hover:border-blue-400 dark:hover:border-blue-600"
          >
            <LogIn className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>تسجيل الدخول</span>
          </button>
        </div>

        {/* Quick Stats Highlights */}
        <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
          {[
            { label: 'المقررات الهندسية', value: '6 مواد كاملة', icon: BookOpen, color: 'text-blue-600 dark:text-blue-400' },
            { label: 'المنااهج المعتمدة', value: 'الإماراتية الدولية', icon: ShieldCheck, color: 'text-indigo-600 dark:text-indigo-400' },
            { label: 'المختبر الافتراضي', value: 'Arduino & Circuits', icon: Bot, color: 'text-cyan-600 dark:text-cyan-400' },
            { label: 'الذكاء الاصطناعي', value: '24/7 مساعد طالب', icon: Sparkles, color: 'text-amber-500' },
          ].map((stat, i) => (
            <div key={i} className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md text-right space-y-1">
              <div className="flex items-center gap-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">{stat.label}</span>
              </div>
              <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white">{stat.value}</p>
            </div>
          ))}
        </div>

      </section>

      {/* ========================================== */}
      {/* 2. INTERACTIVE LIVE FEATURE PREVIEW SHOWCASE */}
      {/* ========================================== */}
      <section className="space-y-6 pt-4">
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800">
            <Compass className="w-3.5 h-3.5" />
            <span>استعراض مميزات المنصة</span>
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
            شاهد ما يقدمه لك موقع الأكاديمية
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            اضغط على أي أداة أدناه لاستعراض معانية حية وشرح تفاعلي لإمكانيات المنصة
          </p>
        </div>

        {/* Interactive Feature Tabs */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'arduino', label: '🤖 محاكي Arduino', color: 'border-cyan-500 text-cyan-600 dark:text-cyan-400' },
            { id: 'explain', label: '📷 اشرح لي درسي AI', color: 'border-blue-500 text-blue-600 dark:text-blue-400' },
            { id: 'assignments', label: '🎓 منشئ التكليفات', color: 'border-emerald-500 text-emerald-600 dark:text-emerald-400' },
            { id: 'calculators', label: '⚡ الحاسبات والأبعاد', color: 'border-amber-500 text-amber-600 dark:text-amber-400' },
            { id: 'curriculum', label: '📚 المقررات والمواضيع', color: 'border-purple-500 text-purple-600 dark:text-purple-400' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActivePreviewTab(tab.id as any)}
              className={`px-3.5 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer border ${
                activePreviewTab === tab.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md scale-105'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Feature Preview Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl transition-all">
          {activePreviewTab === 'arduino' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      مختبر Arduino والدوائر الإلكترونية التفاعلي
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500 text-black font-extrabold">مباشر</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      تركيب القطع، توصيل الأسلاك باللمس، كتابة الكود وفحصه دون الحاجة لشراء قطع مادية
                    </p>
                  </div>
                </div>
                <button
                  onClick={onRegister}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs transition-all cursor-pointer shadow-sm"
                >
                  تجربة المحاكي عند الاشتراك
                </button>
              </div>

              {/* Visual Simulated Canvas */}
              <div className="p-5 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs space-y-4 border border-slate-800 shadow-inner">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-slate-400">
                  <span className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span>Arduino UNO R3 Board Simulator</span>
                  </span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                    ONLINE • 5.0V SAFE
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <p className="text-slate-300 font-bold text-[11px]">القطع المتوفرة:</p>
                    <ul className="text-[10px] text-slate-400 space-y-1">
                      <li>✓ Arduino Uno + Breadboard</li>
                      <li>✓ L298N Motor Driver + DC Motors</li>
                      <li>✓ HC-SR04 Ultrasonic Sensor</li>
                      <li>✓ Resistors, LEDs, Push Buttons</li>
                    </ul>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <p className="text-slate-300 font-bold text-[11px]">فاحص القصر والأخطاء:</p>
                    <p className="text-[10px] text-emerald-400">
                      يقوم المحاكي بتنبيهك تلقائيًا إذا نسيّت المقاومة لحماية الـ LED أو إذا حدث Short Circuit في التوصيلات!
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <p className="text-slate-300 font-bold text-[11px]">شاشة العرض Serial Monitor:</p>
                    <p className="text-[10px] text-cyan-300">
                      [LOG]: Distance = 24.5 cm<br />
                      [LOG]: Motor Speed PWM = 180<br />
                      [LOG]: State: Obstacle Detected
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePreviewTab === 'explain' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      ميزة "اشرح لي درس اليوم" بالذكاء الاصطناعي
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-600 text-white font-extrabold">AI</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      صور دفتر المحاضرة أو ارفع ملف الـ PDF وسيتم تحليله واستخراج الشرح مع الأمثلة
                    </p>
                  </div>
                </div>
                <button
                  onClick={onRegister}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all cursor-pointer shadow-sm"
                >
                  تجربة الميزة عند الاشتراك
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-2">
                  <span className="font-extrabold text-blue-800 dark:text-blue-300 block">1. رفع الصور أو الـ PDF</span>
                  <p className="text-slate-600 dark:text-slate-400">
                    يدعم رفع صور الدفتر بخط اليد أو شرائح المحاضرة الأكاديمية مباشرة.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 space-y-2">
                  <span className="font-extrabold text-indigo-800 dark:text-indigo-300 block">2. تفكيك القوانين والأبعاد</span>
                  <p className="text-slate-600 dark:text-slate-400">
                    شرح كل قانون: ما هو، ما هي وحداته [SI]، وكيف تستخدمه في المسألة.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-900 space-y-2">
                  <span className="font-extrabold text-cyan-800 dark:text-cyan-300 block">3. ملخص ومسائل محلولة</span>
                  <p className="text-slate-600 dark:text-slate-400">
                    يعطيك ملخصًا جاهزًا للحفظ مع اختبار قصير لحفظ الأفكار وتثبيتها.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activePreviewTab === 'assignments' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      منشئ التكليفات والتقارير الهندسية الأكاديمية
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-600 text-white font-extrabold">PDF</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      صياغة تقارير المختبر، المشاريع الهندسية، وبحوث الميكاترونكس وغلاف رسمي جاهز للطباعة
                    </p>
                  </div>
                </div>
                <button
                  onClick={onRegister}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer shadow-sm"
                >
                  إنشاء تقريرك الأول
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold block text-slate-900 dark:text-white">غلاف جامعي رسمي</span>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">شعار الجامعة الإماراتية الدولية واسم الطالب والدكتور.</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold block text-slate-900 dark:text-white">تراكيب هندسية معتمدة</span>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">مقدمة، المكونات، خطوات التجربة، والنتائج بالحسابات.</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold block text-slate-900 dark:text-white">صياغة بذكاء اصطناعي</span>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">محرر تفاعلي لإعادة صياغة أي فقرة أسلوبيًا.</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold block text-slate-900 dark:text-white">تصدير PDF طباعة</span>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">تنزيل الملف بصيغة PDF منسقة ومجهزة للتسليم مباشرة.</p>
                </div>
              </div>
            </div>
          )}

          {activePreviewTab === 'calculators' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <Calculator className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      مختبر الحاسبات ومحلل الأبعاد الهندسية
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-slate-900 font-extrabold">أدوات</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      حاسبات متخصصة في تحليل الأبعاد [M, L, T] والتحويلات والدوائر والمتجهات
                    </p>
                  </div>
                </div>
                <button
                  onClick={onRegister}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all cursor-pointer shadow-sm"
                >
                  استخدام الحاسبات
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <Scale className="w-5 h-5 text-blue-600" />
                  <span className="font-bold text-slate-900 dark:text-white block">محلل الأبعاد [M, L, T]</span>
                  <p className="text-slate-500 dark:text-slate-400">فحص صحة أبعاد القوانين الفيزيائية واشتقاق وحداتها.</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <Calculator className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-slate-900 dark:text-white block">محول الوحدات الهندسي</span>
                  <p className="text-slate-500 dark:text-slate-400">تحويلات القوة، الشغل، الجهد، والضغط بلمسة واحدة.</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <Zap className="w-5 h-5 text-amber-600" />
                  <span className="font-bold text-slate-900 dark:text-white block">حاسبة التوالي والتوازي</span>
                  <p className="text-slate-500 dark:text-slate-400">حساب المقاومة المكثفة والمكافئة وتجزئة التيار والجهد.</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  <span className="font-bold text-slate-900 dark:text-white block">محلل المتجهات والقوى</span>
                  <p className="text-slate-500 dark:text-slate-400">تحليل المركبات السينية والصادية والضرب الاتجاهي والقياسي.</p>
                </div>
              </div>
            </div>
          )}

          {activePreviewTab === 'curriculum' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      مقررات السنة الأولى هندسة ميكاترونكس
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-600 text-white font-extrabold">6 مواد</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      محتوى منظم ومكتوب خصيصًا ليغطي كامل مفردات الفصلين الأول والثاني
                    </p>
                  </div>
                </div>
                <button
                  onClick={onRegister}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all cursor-pointer shadow-sm"
                >
                  استكشاف المنهج
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { name: 'الفيزياء الهندسية', code: 'PHYS101', desc: 'الميكانيكا، قوانين نيوتن، الشغل والطاقة، والأبعاد.' },
                  { name: 'الدوائر الكهربائية 1', code: 'EE101', desc: 'قانون أوم، KCL/KVL، مجزئ الجهد، والتوالي والتوازي.' },
                  { name: 'الرياضيات الهندسية 1', code: 'MATH101', desc: 'التفاضل والتكامل، النهايات، والمصفوفات.' },
                  { name: 'برمجة الحاسوب C/C++', code: 'CS101', desc: 'البرمجة الهيكلية للروبوتات وتراكيب التحكم.' },
                  { name: 'مقدمة الميكاترونكس', code: 'MCT100', desc: 'تكامل الميكانيك والإلكترونيك والبرمجة والحساسات.' },
                  { name: 'الرسم الهندسي', code: 'ME101', desc: 'الإسقاط المتعامد، القطاعات، والأبعاد القياسية.' },
                ].map((s, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">{s.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">{s.code}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================== */}
      {/* 3. PHILOSOPHY & WHY CHOOSE US */}
      {/* ========================================== */}
      <section className="p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-950 text-white shadow-xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-2xl space-y-3 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>فلسفة الأكاديمية التعليمية</span>
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            "لا تحفظ القانون... افهمه من جذوره"
          </h2>
          <p className="text-xs sm:text-base text-slate-300 leading-relaxed font-medium">
            نحن نعلم أن الهندسة ليست مجرد حفظ معادلات. شرحنا يبدأ من الأساس الفيزيائي للقانون: لماذا تم اختراعه؟ ما أبعاده ومكوناته؟ ومتى تطبقه في الحياة العملية والمختبر؟
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 relative z-10">
          {[
            { title: 'شرح مبسط من الصفر', desc: 'لغتنا هندسية سهلة ومباشرة دون تعقيد لفظي.' },
            { title: 'تحليل أبعاد الوحدات', desc: 'معرفة أبعاد كل كمية فيزيائية وطريقة اشتقاقها.' },
            { title: 'خطوات الحل الدقيقة', desc: 'منهجية مرتبة لحل أعقد مسائل امتحانات الجامعة.' },
            { title: 'ربط عملي بالروبوتات', desc: 'ربط النظرية بالتطبيق الميداني والمحاكاة.' },
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="font-extrabold text-xs text-white">{item.title}</span>
              </div>
              <p className="text-[11px] text-slate-300">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================== */}
      {/* 4. PRICING & SUBSCRIPTION PLANS */}
      {/* ========================================== */}
      <section className="space-y-8 pt-4">
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-800">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>خطط الاشتراك الطلابية</span>
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
            اختر الخطة المناسبة وابدأ التعلم فورًا
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            تفعيل فوري وسريع عبر واتساب أو أكواد التفعيل المعتمدة
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Monthly Plan */}
          <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6 hover:border-blue-300 transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
                  خطة مرنة 30 يومًا
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  تجربة شهرية
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
                  <span className="text-xs text-slate-500 dark:text-slate-400">/ شهر</span>
                </div>
              </div>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>الوصول الكامل لشروحات المقررات الهندسية</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>مختبر Arduino والمحاكيات التفاعلية</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>مساعد الميكاترونكس الذكي 24/7</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>منشئ التكليفات والتقارير الأكاديمية PDF</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onRegister}
              className="w-full py-3.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-extrabold text-sm transition-all cursor-pointer text-center"
            >
              التسجيل في الخطة الشهرية
            </button>
          </div>

          {/* Yearly Plan */}
          <div className="relative rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 border-2 border-blue-600 dark:border-blue-500 shadow-xl shadow-blue-500/10 flex flex-col justify-between space-y-6">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 font-extrabold text-xs shadow-md flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>الخيار الأوفر والأكثر إقبالاً</span>
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
                  الاشتراك السنوي الشامل
                </h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-black text-blue-600 dark:text-blue-400">
                    {yearlyPriceUSD}$
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">/ سنة كاملة</span>
                </div>
              </div>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>وصول غير محدود لكافة الأدوات والمحاكيات لمدة سنة</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>تغطية كاملة لدروس الفصل الأول والفصل الثاني</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>أولوية الاستجابة والتحليل في الذكاء الاصطناعي</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>حلول امتحانات سابقة ونماذج أبحاث جاهزة</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>دعم أكاديمي مباشر مع إدارة المنصة</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onRegister}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer text-center"
            >
              التسجيل في الخطة السنوية
            </button>
          </div>
        </div>
      </section>

      {/* Footer Universities Covered */}
      <section className="pt-8 border-t border-slate-200 dark:border-slate-800 text-center space-y-3">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
          مناهج مصممة خصيصًا لتلبية متطلبات هندسة الميكاترونكس في:
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            'الجامعة الإماراتية الدولية – صنعاء',
            'جامعة صنعاء',
            'جامعة العلوم والتكنولوجيا',
            'الجامعة اليمنية',
            'جامعة المستقبل',
            'جامعة الملكة أروى',
            'كافة الكليات الهندسية باليمن',
          ].map((uni, idx) => (
            <span
              key={idx}
              className="px-3 py-1 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200/50 dark:border-slate-700/50"
            >
              {uni}
            </span>
          ))}
        </div>
      </section>

    </div>
  );
};
