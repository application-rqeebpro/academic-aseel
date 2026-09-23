import React from 'react';
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
  KeyRound
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
  onOpenLogin,
  onOpenRegister,
  onOpenActivation,
  onOpenProfile,
  onLogout,
  onNavigateHome,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Branding */}
          <AcademyLogo onClick={onNavigateHome} size="md" />

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* PWA Install Button */}
            <PWAInstallButton variant="button" />

            {/* If Student is Logged in */}
            {student ? (
              <>
                {/* Explain Today's Lesson Quick Trigger */}
                {student.isActivated && onOpenExplainLesson && (
                  <button
                    onClick={onOpenExplainLesson}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer"
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
                    className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer"
                    title="منشئ التكليفات الهندسية"
                  >
                    <span>🎓 منشئ التكليفات</span>
                  </button>
                )}

                {/* Arduino Simulator Quick Trigger */}
                {onOpenArduino && (
                  <button
                    onClick={onOpenArduino}
                    className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/80 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer"
                    title="محاكي Arduino والدوائر الإلكترونية"
                  >
                    <span>🤖 محاكي Arduino</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
                  </button>
                )}

                {/* AI Assistant Quick Trigger */}
                <button
                  onClick={onOpenAiModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-indigo-500/20 transition-all hover:shadow cursor-pointer"
                  title="مساعد الميكاترونكس الذكي"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span className="hidden md:inline">مساعد الميكاترونكس</span>
                  <span className="md:hidden">المساعد</span>
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

                {/* Active Student Pill / Profile Trigger */}
                <button
                  onClick={onOpenProfile}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-xs transition-colors cursor-pointer"
                  title="عرض وتعديل الملف الشخصي وكلمة المرور"
                >
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-bold">
                    <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{student.name.split(' ')[0]}</span>
                    <span className={`w-2 h-2 rounded-full ${student.isActivated ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  </div>
                  <div className="hidden sm:block w-px h-3.5 bg-slate-300 dark:bg-slate-700" />
                  <div className="hidden sm:flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
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
              /* Visitor view: Owner icon button, "تسجيل الدخول", and "اشترك الآن" */
              <>
                {/* Visitor view: Owner icon button, "تفعيل الكود", "تسجيل الدخول", and "اشترك الآن" */}
                {onOpenActivation && (
                  <button
                    onClick={onOpenActivation}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-2xs"
                    title="تفعيل الاشتراك بكود التفعيل المعتمد"
                  >
                    <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>تفعيل الاشتراك بكود</span>
                  </button>
                )}

                <button
                  onClick={onOpenLogin}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs sm:text-sm transition-all cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>تسجيل الدخول</span>
                </button>

                <button
                  onClick={onOpenRegister}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm shadow-blue-500/25 hover:scale-[1.02] transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>اشترك الآن</span>
                </button>

                {/* Owner / Admin Control Panel Icon Button */}
                <button
                  onClick={onOpenAdmin}
                  className="p-2 sm:p-2.5 rounded-xl text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                  title="لوحة تحكم المالك / الإدارة"
                  aria-label="Owner Admin Control Panel"
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
              aria-label="Toggle Theme"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600" />
              )}
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
