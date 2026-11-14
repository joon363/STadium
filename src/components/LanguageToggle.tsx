import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export type LanguageToggleVariant = 'light' | 'school' | 'glass' | 'dark';

interface LanguageToggleProps {
  variant?: LanguageToggleVariant;
  className?: string;
}

const VARIANT_CLASSES: Record<LanguageToggleVariant, string> = {
  light:
    'px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-[11px] font-extrabold shadow-2xs',
  school:
    'px-2 py-1 rounded-full bg-white/20 border border-white/40 text-white hover:bg-white/30 text-[11px] font-extrabold shadow-2xs',
  glass:
    'px-2.5 py-1.5 rounded-full bg-white/90 border border-white/80 text-gray-900 hover:bg-white text-xs font-extrabold shadow-md backdrop-blur-md',
  dark:
    'px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-extrabold',
};

/**
 * Shared KOR / ENG language switcher button rendered across headers and full-bleed subpages.
 */
export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  variant = 'light',
  className = '',
}) => {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      title={language === 'ko' ? 'Switch to English' : '한국어로 전환'}
      aria-label="Language Toggle"
      className={`inline-flex items-center gap-1 shrink-0 transition-all cursor-pointer select-none ${VARIANT_CLASSES[variant]} ${className}`}
    >
      <Globe className={`w-3.5 h-3.5 ${variant === 'dark' ? 'text-slate-400' : ''}`} />
      <span>{t('header.langToggle')}</span>
    </button>
  );
};

