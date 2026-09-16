import React from 'react';
import { Sparkles, Heart, Tv, ShieldCheck, Gamepad2, ArrowUpRight, Palette } from 'lucide-react';
import { soundEngine } from '../utils/audio';
import { BrandLogo, LogoDesignId } from './BrandLogo';

interface FooterProps {
  onBrowseGames: () => void;
  onOpenMyGames: () => void;
  selectedLogo?: LogoDesignId;
  onOpenLogoSelector?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ 
  onBrowseGames, 
  onOpenMyGames,
  selectedLogo = 'spark-noon',
  onOpenLogoSelector
}) => {
  return (
    <footer className="border-t border-slate-800 bg-[#080b12] text-right mt-20 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <BrandLogo designId={selectedLogo} size="md" />
            
            <p className="text-sm text-slate-300 leading-relaxed max-w-md">
              منصة الألعاب الجماعية الرقمية المخصصة لجمعات الأصدقاء، العائلة، الاستراحات، والكشتات.
              لا تحتاج تحميل ملفات أو إنشاء غرف؛ اشترِ لعبتك واجتمعوا حول نفس الشاشة وابدأوا اللعب مباشرة.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-amber-400 font-bold">
                <span>«مو بس لعبة… جمعة.»</span>
              </div>
              {onOpenLogoSelector && (
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    onOpenLogoSelector();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs text-amber-300 font-bold transition-colors cursor-pointer"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>تغيير تصميم الشعار 🎨</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white font-display">روابط سريعة</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    onBrowseGames();
                  }}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>استكشف جميع الألعاب</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    onOpenMyGames();
                  }}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>ألعابي المشتراة</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </li>
              <li>
                <span className="text-slate-500">طريقة اللعب على الشاشة الواحدة</span>
              </li>
            </ul>
          </div>

          {/* Slogans & Vibes */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white font-display">أجواء ندّك</h4>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">#جيب_جماعتك</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">#مين_قدّها؟</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">#خلّ_اللعب_يبدأ</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">#وش_جوّكم؟</span>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} منصة ندّك (Niddak). صُنعت بحب لأحلى جمعات وضحك بالمملكة 🇸🇦</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-400">
              <Tv className="w-3.5 h-3.5 text-emerald-400" />
              <span>جهاز واحد يجمعكم</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>ألعاب رقمية فورية</span>
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};
