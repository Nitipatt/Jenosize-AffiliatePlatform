'use client';

import { useTranslation } from '../lib/i18n/context';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-0.5 text-xs font-semibold">
      <button
        onClick={() => setLocale('en')}
        className={`px-2.5 py-1.5 rounded-md transition-all duration-200 ${
          locale === 'en'
            ? 'bg-white text-[#0166E0] shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLocale('th')}
        className={`px-2.5 py-1.5 rounded-md transition-all duration-200 ${
          locale === 'th'
            ? 'bg-white text-[#0166E0] shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        TH
      </button>
    </div>
  );
}
