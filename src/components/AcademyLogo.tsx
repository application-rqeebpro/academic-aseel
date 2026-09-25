import React from 'react';

interface AcademyLogoProps {
  variant?: 'full' | 'icon' | 'badge';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  onClick?: () => void;
}

export const AcademyLogo: React.FC<AcademyLogoProps> = ({
  variant = 'full',
  size = 'md',
  showSubtitle = true,
  className = '',
  onClick,
}) => {
  // Size mappings
  const iconSizeClasses = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24 sm:w-28 sm:h-28',
  };

  const titleSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base sm:text-lg',
    lg: 'text-xl sm:text-2xl',
    xl: 'text-2xl sm:text-4xl',
  };

  if (variant === 'icon') {
    return (
      <div 
        onClick={onClick}
        className={`relative flex items-center justify-center shrink-0 ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''} ${className}`}
      >
        <img 
          src="/logo.svg" 
          alt="أكاديمية الميكاترونكس اليمنية" 
          className={`${iconSizeClasses[size]} object-contain drop-shadow-md`}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div 
        onClick={onClick}
        className={`flex flex-col items-center justify-center text-center p-4 rounded-3xl bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900/60 shadow-lg shadow-blue-500/10 ${onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''} ${className}`}
      >
        <img 
          src="/logo.svg" 
          alt="أكاديمية الميكاترونكس اليمنية" 
          className={`${iconSizeClasses[size]} object-contain mb-3 drop-shadow-md`}
          referrerPolicy="no-referrer"
        />
        <span className={`font-black text-slate-900 dark:text-white tracking-tight ${titleSizeClasses[size]}`}>
          أكاديمية <span className="text-blue-600 dark:text-blue-400">الميكاترونكس</span> اليمنية
        </span>
        {showSubtitle && (
          <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            تعلم الميكاترونكس بطريقة أسهل
          </span>
        )}
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-2 sm:gap-3 select-none shrink-0 min-w-0 ${onClick ? 'cursor-pointer group' : ''} ${className}`}
    >
      <div className="relative shrink-0">
        <img 
          src="/logo.svg" 
          alt="أكاديمية الميكاترونكس اليمنية" 
          className={`${iconSizeClasses[size]} object-contain transition-transform group-hover:scale-105 drop-shadow-md`}
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className={`font-black text-slate-900 dark:text-white tracking-tight leading-tight whitespace-nowrap ${titleSizeClasses[size]}`}>
            أكاديمية <span className="text-blue-600 dark:text-blue-400">الميكاترونكس</span>
            <span className="hidden xs:inline"> اليمنية</span>
          </span>
          <span className="hidden md:inline-flex px-2 py-0.5 text-[11px] font-extrabold rounded-md bg-blue-100 dark:bg-blue-950/90 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
            السنة الأولى
          </span>
        </div>
        {showSubtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold hidden sm:block mt-0.5 whitespace-nowrap">
            تعلم الميكاترونكس بطريقة أسهل
          </p>
        )}
      </div>
    </div>
  );
};
