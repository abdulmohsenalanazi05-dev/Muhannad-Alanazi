import React from 'react';
import { ShieldAlert, EyeOff, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface TabooSecretCardViewProps {
  word: string;
  forbiddenWords: string[];
  categoryName?: string;
  hint?: string;
  onClose?: () => void;
}

export const TabooSecretCardView: React.FC<TabooSecretCardViewProps> = ({
  word,
  forbiddenWords,
  categoryName,
  hint,
  onClose
}) => {
  return (
    <div className="min-h-screen bg-[#080b12] text-slate-100 flex flex-col justify-between p-4 sm:p-6 text-right selection:bg-rose-500 selection:text-white" dir="rtl">
      
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-rose-500/20">
            🤐
          </div>
          <div>
            <h1 className="text-sm font-black text-white font-display">كرت الشارح السري • ندّك</h1>
            <span className="text-[11px] text-rose-400 font-bold flex items-center gap-1">
              <EyeOff className="w-3 h-3" />
              <span>خاص بك وبالمراقب فقط!</span>
            </span>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-bold hover:text-white"
          >
            الرئيسية
          </button>
        )}
      </div>

      {/* Main Secret Card */}
      <div className="my-auto py-6 space-y-6 max-w-md mx-auto w-full">
        
        {categoryName && (
          <div className="text-center">
            <span className="px-3.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold text-amber-400">
              قسم: {categoryName}
            </span>
          </div>
        )}

        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border-2 border-slate-800 text-center shadow-2xl space-y-6">
          
          {/* Target Word */}
          <div className="py-4 border-b border-slate-800">
            <span className="text-xs text-amber-400 font-bold block mb-1">الكلمة المطلوب منك تشرحها:</span>
            <h2 className="text-4xl sm:text-5xl font-black text-amber-300 font-display tracking-wide">
              {word}
            </h2>
          </div>

          {/* Forbidden Words */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 text-rose-400 text-xs font-black">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>الكلمات الممنوع تنطقها:</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {forbiddenWords.map((fw, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-rose-950/40 border border-rose-800/50 text-rose-200 text-base font-bold shadow-inner"
                >
                  {fw}
                </div>
              ))}
            </div>
          </div>

          {hint && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
              💡 <span className="text-slate-300 font-bold">تلميح مسموح:</span> {hint}
            </div>
          )}

        </div>

        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center text-xs text-amber-300 font-medium leading-relaxed">
          ⚡ خلي عينك على الشاشة الرئيسية عشان تشوف الثواني الباقية لفرقتك!
        </div>

      </div>

      {/* Footer Branding */}
      <div className="text-center text-[11px] text-slate-600 pt-3 border-t border-slate-900">
        منصة ندّك للألعاب الرقمية • لعبة لا تقولها
      </div>

    </div>
  );
};
