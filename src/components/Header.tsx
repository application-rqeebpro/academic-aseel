import React, { useState } from 'react';
import { StudentProfile } from '../types';
import { AcademyLogo } from './AcademyLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { 
  Moon, 
  Sun, 
  ShieldCheck, 
  LogOut, 
  Clock, 
  LogIn, 
  UserPlus, 
  Sparkles, 
  User, 
  KeyRound,
  Menu,
  X,
  Camera,
  GraduationCap,
  Bot,
  Smartphone,
  Compass
} from 'lucide-react';

interface HeaderProps {
  student: StudentProfile | null;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenAdmin: () => void;
  onOpenAiModal: () => void;
  onOpenExplainLesson?: () => void;
  onOpenAssignments?: () => void;
  onOpenArduino?: () => void;
  onOpenLearningPath?: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenActivation?: () => void;
  onOpenProfile?: () => void;
  onLogout: () => void;
  onNavigateHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  student,
  darkMode,
  onToggleDarkMode,
  onOpenAdmin,
  onOpenAiModal,
  onOpenExplainLesson,
  onOpenAssignments,
  onOpenArduino,
  onOpenLearningPath,
  onOpenLogin,
  onOpenRegister,
  onOpenActivation,
  onOpenProfile,
  onLogout,
  onNavigateHome,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Logo & Branding - Protected from collapsing */}
          <div className="shrink-0 min-w-0">
            <AcademyLogo onClick={onNavigateHome} size="md" />
          </div>

          {/* ========================================================= */}
          {/* DESKTOP NAVIGATION (MD & UP) */}
          {/* ========================================================= */}
          <div className="hidden md:flex items-center gap-2 sm:gap-2.5">
            
            {/* PWA Install Button */}
            <PWAInstallButton variant="button" />

            {/* If Student is Logged in */}
            {student ? (
              <>
                {/* Explain Today's Lesson Quick Trigger */}
                {student.isActivated && onOpenExplainLesson && (
                  <button
                    onClick={onOpenExplainLesson}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                    title="اشرح لي درس اليوم"
                  >
                    <span>📷 اشرح درسي</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                  </button>
                )}

                {/* Assignment Generator Quick Trigger */}
                {onOpenAssignments && (
                  <button
                    onClick={onOpenAssignments}
                    className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                    title="منشئ التكليفات الهندسية"
                  >
                    <span>🎓 منشئ التكليفات</span>
                  </button>
                )}

                {/* Arduino Simulator Quick Trigger */}
                {onOpenArduino && (
                  <button
                    onClick={onOpenArduino}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/80 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                    title="محاكي Arduino والدوائر الإلكترونية"
                  >
                    <span>🤖 محاكي Arduino</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
                  </button>
                )}

                {/* Personalized Learning Path Quick Trigger */}
                {onOpenLearningPath && (
                  <button
                    onClick={onOpenLearningPath}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
                    title="مسار التعلم الشخصي واقتراحات الدروس"
                  >
                    <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>مسار التعلم 🧭</span>
                  </button>
                )}

                {/* AI Assistant Quick Trigger */}
                <button
                  onClick={onOpenAiModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold shadow-sm shadow-indigo-500/20 transition-all cursor-pointer"
                  title="مساعد الميكاترونكس الذكي"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>مساعد الميكاترونكس</span>
                </button>

                {/* Activate subscription quick button if pending */}
                {!student.isActivated && onOpenActivation && (
                  <button
                    onClick={onOpenActivation}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 text-xs font-bold hover:bg-amber-200 transition-all cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>تفعيل الاشتراك</span>
                  </button>
                )}

                {/* Active Student Profile Trigger */}
                <button
                  onClick={onOpenProfile}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs transition-colors cursor-pointer"
                  title="عرض وتعديل الملف الشخصي"
                >
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-bold">
                    <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{student.name.split(' ')[0]}</span>
                    <span className={`w-2 h-2 rounded-full ${student.isActivated ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  </div>
                  <div className="w-px h-3.5 bg-slate-300 dark:bg-slate-700" />
                  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{student.isActivated ? `${student.remainingDays} يوم` : 'تفعيل'}</span>
                  </div>
                </button>

                {/* Admin role badge */}
                {student.role === 'admin' && (
                  <button
                    onClick={onOpenAdmin}
                    className="p-2 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                    title="لوحة الإدارة"
                  >
                    <ShieldCheck className="w-5 h-5" />
                  </button>
                )}

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              /* Visitor view for Desktop */
              <>
                {onOpenActivation && (
                  <button
                    onClick={onOpenActivation}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 font-bold text-xs sm:text-sm transition-all cursor-pointer"
                    title="تفعيل الاشتراك بكود التفعيل المعتمد"
                  >
                    <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>تفعيل الاشتراك بكود</span>
                  </button>
                )}

                <button
                  onClick={onOpenLogin}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs sm:text-sm transition-all cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>تسجيل الدخول</span>
                </button>

                <button
                  onClick={onOpenRegister}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs sm:text-sm shadow-sm shadow-blue-500/25 hover:scale-[1.02] transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>اشترك الآن</span>
                </button>

                {/* Owner / Admin Control Panel Icon Button */}
                <button
                  onClick={onOpenAdmin}
                  className="p-2 rounded-xl text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer"
                  title="لوحة تحكم المالك / الإدارة"
                >
                  <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </button>
              </>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={darkMode ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي'}
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600" />
              )}
            </button>

          </div>

          {/* ========================================================= */}
          {/* MOBILE HEADER BAR (UNDER MD) */}
          {/* ========================================================= */}
          <div className="flex md:hidden items-center gap-1.5">
            
            {/* Quick Primary Button on Mobile */}
            {student ? (
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span className="truncate max-w-[70px]">{student.name.split(' ')[0]}</span>
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>دخول</span>
              </button>
            )}

            {/* Dark Mode Toggle Button */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={darkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
              aria-label="القائمة الرئيسية"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-rose-500" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>
      </div>

      {/* ========================================================= */}
      {/* MOBILE EXPANDED MENU DRAWER (UNDER MD) */}
      {/* ========================================================= */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl shadow-2xl animate-fade-in">
          <div className="px-4 py-4 space-y-3 max-h-[80vh] overflow-y-auto">
            
            {/* If Student is Logged in */}
            {student ? (
              <>
                {/* Student Mini Profile Summary */}
                <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/60 dark:to-indigo-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">{student.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{student.phone}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black ${
                      student.isActivated ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {student.isActivated ? `متبقي ${student.remainingDays} يوم` : 'غير مفعّل'}
                    </span>
                  </div>
                </div>

                {/* AI Assistant */}
                <button
                  onClick={() => {
                    closeMenu();
                    onOpenAiModal();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-sm shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <span>مساعد الميكاترونكس الذكي</span>
                  </div>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-lg">AI</span>
                </button>

                {/* Personalized Learning Path */}
                {onOpenLearningPath && (
                  <button
                    onClick={() => {
                      closeMenu();
                      onOpenLearningPath();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-sm border border-blue-200 dark:border-blue-800/60 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Compass className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span>مسار التعلم الشخصي واقتراحات الدروس</span>
                    </div>
                    <span className="text-xs bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-lg">جديد</span>
                  </button>
                )}

                {/* Explain Lesson */}
                {onOpenExplainLesson && (
                  <button
                    onClick={() => {
                      closeMenu();
                      onOpenExplainLesson();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-sm border border-blue-200 dark:border-blue-800/60 cursor-pointer"
                  >
                    <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span>اشرح لي درس اليوم (صورة أو نص)</span>
                  </button>
                )}

                {/* Arduino Simulator */}
                {onOpenArduino && (
                  <button
                    onClick={() => {
                      closeMenu();
                      onOpenArduino();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-cyan-50/80 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 font-bold text-sm border border-cyan-200 dark:border-cyan-800/60 cursor-pointer"
                  >
                    <Bot className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    <span>محاكي Arduino والدوائر الإلكترونية</span>
                  </button>
                )}

                {/* Assignment Generator */}
                {onOpenAssignments && (
                  <button
                    onClick={() => {
                      closeMenu();
                      onOpenAssignments();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-sm border border-emerald-200 dark:border-emerald-800/60 cursor-pointer"
                  >
                    <GraduationCap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>منشئ التكليفات الهندسية المعتمد</span>
                  </button>
                )}

                {/* PWA Install */}
                <div className="pt-1">
                  <PWAInstallButton variant="button" className="w-full justify-center py-3 rounded-2xl text-sm" />
                </div>

                {/* Profile Edit */}
                {onOpenProfile && (
                  <button
                    onClick={() => {
                      closeMenu();
                      onOpenProfile();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-sm cursor-pointer"
                  >
                    <User className="w-5 h-5 text-slate-500" />
                    <span>تعديل الملف الشخصي وكلمة المرور</span>
                  </button>
                )}

                {/* Admin Panel (if admin) */}
                {student.role === 'admin' && (
                  <button
                    onClick={() => {
                      closeMenu();
                      onOpenAdmin();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-sm border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                  >
                    <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span>لوحة تحكم المالك والإدارة</span>
                  </button>
                )}

                {/* Logout */}
                <button
                  onClick={() => {
                    closeMenu();
                    onLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-sm border border-rose-200 dark:border-rose-900 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>تسجيل الخروج من الحساب</span>
                </button>
              </>
            ) : (
              /* Visitor Mobile Menu */
              <>
                {/* Primary Register CTA */}
                <button
                  onClick={() => {
                    closeMenu();
                    onOpenRegister();
                  }}
                  className="w-full flex items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-black text-sm shadow-lg shadow-blue-500/25 cursor-pointer"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>اشترك الآن - الوصول الكامل</span>
                </button>

                {/* Login */}
                <button
                  onClick={() => {
                    closeMenu();
                    onOpenLogin();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-800 dark:text-white border-2 border-slate-200 dark:border-slate-700 font-extrabold text-sm cursor-pointer shadow-xs"
                >
                  <LogIn className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>تسجيل الدخول</span>
                </button>

                {/* Activate Code */}
                {onOpenActivation && (
                  <button
                    onClick={() => {
                      closeMenu();
                      onOpenActivation();
                    }}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-200 border-2 border-amber-300 dark:border-amber-700 font-extrabold text-sm cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>تفعيل كود الاشتراك</span>
                  </button>
                )}

                {/* PWA Direct Install */}
                <div className="pt-1">
                  <PWAInstallButton variant="button" className="w-full justify-center py-3 rounded-2xl text-sm" />
                </div>

                {/* Owner / Admin Control Panel */}
                <button
                  onClick={() => {
                    closeMenu();
                    onOpenAdmin();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>لوحة تحكم المالك / الإدارة</span>
                </button>
              </>
            )}

          </div>
        </div>
      )}

    </header>
  );
};
