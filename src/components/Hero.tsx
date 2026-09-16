import React from 'react';
import { Play, Zap, Users, Monitor } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface HeroProps {
  onExploreClick: () => void;
  onQuickDemoClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreClick, onQuickDemoClick }) => {
  return (
    <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24 border-b border-slate-800/60">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-amber-500/15 via-rose-500/10 to-transparent blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 right-10 w-[300px] h-[300px] bg-emerald-500/10 blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.2] max-w-4xl mx-auto font-display">
          مو بس لعبة…{' '}
          <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">
            جمعة.
          </span>
          <br />
          <span className="text-slate-200 text-3xl sm:text-4xl md:text-5xl mt-2 block font-extrabold">
            خلّ اللعب يبدأ!
          </span>
        </h1>

        {/* Description */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
          ألعاب جماعية تفاعلية مصممة لجمعات الأهل والاستراحات والطلعات.
          <br className="hidden sm:inline" />
          <strong className="text-amber-300 font-semibold"> اختار لعبتك، اشترها، واجمع جماعتك حول نفس الجهاز!</strong>
        </p>

        {/* Primary CTAs */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 max-w-md mx-auto">
          <button
            id="hero-explore-btn"
            onClick={() => {
              soundEngine.playClick();
              onExploreClick();
            }}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-base transition-all shadow-xl shadow-orange-500/25 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer font-display"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>استكشف الألعاب</span>
          </button>

          <button
            id="hero-demo-btn"
            onClick={() => {
              soundEngine.playClick();
              onQuickDemoClick();
            }}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 font-bold text-sm sm:text-base transition-all hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>جرّب جولة مجانية الآن</span>
          </button>
        </div>

        {/* Core Pillars (No rooms, instant play, single device) */}
        <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 max-w-3xl mx-auto text-right">
          
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Monitor className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white font-display">شاشة وجهاز واحد</h4>
              <p className="text-xs text-slate-400 mt-1 leading-snug">
                اجمع أصحابك حول جوال أو آيباد أو لابتوب أو ارمها على شاشة التلفزيون.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white font-display">ابدأ اللعب بثواني</h4>
              <p className="text-xs text-slate-400 mt-1 leading-snug">
                لا تحميل ملفات ولا برامج. اشترِ اللعبة وتفتح فوراً داخل المتصفح.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white font-display">صفر غرف.. صفر تعقيد</h4>
              <p className="text-xs text-slate-400 mt-1 leading-snug">
                لا كود غرفة ولا تسجيل دخول لكل لاعب. اللعب حقيقي وتفاعلي في المكان!
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
