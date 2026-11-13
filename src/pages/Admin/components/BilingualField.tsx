import React, { useState } from 'react';
import { Languages, Loader2 } from 'lucide-react';
import { encodeBilingual, parseBilingual } from '../../../utils/bilingual';
import { translateKoToEn } from '../../../utils/autoTranslate';
import { useLanguage } from '../../../context/LanguageContext';

interface BilingualFieldProps {
  label?: string;
  required?: boolean;
  value: string;
  onChange: (encoded: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholderKo?: string;
  placeholderEn?: string;
  inputClassName?: string;
  compact?: boolean;
}

/**
 * Dual-language (KOR / ENG) input control storing `"ko ||| en"` in existing DB text fields,
 * with a one-click KO->EN auto-translate trigger.
 */
export const BilingualField: React.FC<BilingualFieldProps> = ({
  label,
  required = false,
  value,
  onChange,
  multiline = false,
  rows = 3,
  placeholderKo = '',
  placeholderEn = 'English (auto-translated on save if blank)',
  inputClassName = 'w-full border border-gray-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-postech outline-none bg-white text-gray-900',
  compact = false,
}) => {
  const { t } = useLanguage();
  const [translating, setTranslating] = useState(false);
  const { ko, en } = parseBilingual(value);

  const handleAutoTranslate = async () => {
    if (!ko.trim() || translating) return;
    setTranslating(true);
    try {
      const translated = await translateKoToEn(ko);
      onChange(encodeBilingual(ko, translated));
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
      <div className="flex items-center justify-between gap-2">
        {label ? (
          <label className="text-[11px] font-bold text-gray-700 block">
            {label} {required && '*'}
          </label>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={handleAutoTranslate}
          disabled={!ko.trim() || translating}
          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 disabled:opacity-40 cursor-pointer shrink-0 transition-colors"
          title={t('admin.autoTranslateBtn')}
        >
          {translating ? (
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
          ) : (
            <Languages className="w-2.5 h-2.5" />
          )}
          <span>{translating ? t('admin.translating') : t('admin.autoTranslateBtn')}</span>
        </button>
      </div>

      <div className={compact ? 'grid grid-cols-1 sm:grid-cols-2 gap-1.5' : 'space-y-1.5'}>
        <div className="relative">
          <span className="inline-block text-[9px] font-black text-slate-500 bg-slate-100 border border-slate-200 px-1 rounded mb-0.5">
            {t('admin.bilingualKo')}
          </span>
          {multiline ? (
            <textarea
              rows={rows}
              value={ko}
              onChange={(e) => onChange(encodeBilingual(e.target.value, en))}
              placeholder={placeholderKo}
              className={inputClassName}
            />
          ) : (
            <input
              type="text"
              value={ko}
              onChange={(e) => onChange(encodeBilingual(e.target.value, en))}
              placeholder={placeholderKo}
              className={inputClassName}
            />
          )}
        </div>

        <div className="relative">
          <span className="inline-block text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-200 px-1 rounded mb-0.5">
            {t('admin.bilingualEn')}
          </span>
          {multiline ? (
            <textarea
              rows={rows}
              value={en}
              onChange={(e) => onChange(encodeBilingual(ko, e.target.value))}
              placeholder={placeholderEn}
              className={inputClassName}
            />
          ) : (
            <input
              type="text"
              value={en}
              onChange={(e) => onChange(encodeBilingual(ko, e.target.value))}
              placeholder={placeholderEn}
              className={inputClassName}
            />
          )}
        </div>
      </div>
    </div>
  );
};

