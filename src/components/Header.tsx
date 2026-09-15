import React from 'react';
import { StudentProfile } from '../types';
import { 
  Cpu, 
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
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenActivation?: () => void;
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
  onOpenLogin,
  onOpenRegister,
  onOpenActivation,
  onLogout,
  onNavigateHome,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Branding */}
          <div 
            onClick={onNavigateHome}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Cpu className="w-6 h-6 animate-pulse" />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
                  أكاديمية الميكاترونكس اليمنية
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 text-xs font-semibold rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  السنة الأولى
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden xs:block">
                افهم الميكاترونكس بطريقة سهلة
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
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

                {/* Active Student Pill */}
                <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                    <span className={`w-2 h-2 rounded-full ${student.isActivated ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                    <span>{student.name.split(' ')[0]}</span>
                  </div>
                  <div className="w-px h-3.5 bg-slate-300 dark:bg-slate-700" />
                  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{student.isActivated ? `${student.remainingDays} يوم` : 'بانتظار التفعيل'}</span>
                  </div>
                </div>

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
              /* Visitor view: strictly "تسجيل الدخول" and "اشترك الآن" */
              <>
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
