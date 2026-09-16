import React, { useState } from 'react';
import { 
  X, Users, Clock, Flame, CheckCircle, ShieldCheck, 
  ShoppingCart, Play, Star, ChevronLeft, Sparkles, Zap, Tv, HelpCircle
} from 'lucide-react';
import { GameItem } from '../types';
import { soundEngine } from '../utils/audio';

interface GameDetailsModalProps {
  game: GameItem | null;
  isOpen: boolean;
  onClose: () => void;
  isOwned: boolean;
  onBuy: (game: GameItem) => void;
  onPlay: (game: GameItem) => void;
}

export const GameDetailsModal: React.FC<GameDetailsModalProps> = ({
  game,
  isOpen,
  onClose,
  isOwned,
  onBuy,
  onPlay
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'how-to-play'>('overview');

  if (!isOpen || !game) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-[#0e131f] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl text-right my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="close-details-modal-btn"
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="absolute top-4 left-4 z-20 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Visual Banner Header */}
        <div className={`relative p-6 sm:p-8 bg-gradient-to-br ${game.gradient} text-white overflow-hidden`}>
          <div className="absolute inset-0 bg-black/25 backdrop-brightness-90" />
          <div className="relative z-10">
            
            <div className="flex items-center gap-2 mb-3">
              {game.badge && (
                <span className="px-3 py-1 rounded-full bg-slate-950/80 text-amber-300 text-xs font-black">
                  {game.badge}
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold backdrop-blur-sm">
                {game.difficulty}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black font-display text-white">
              {game.title}
            </h2>
            <p className="text-sm sm:text-base text-white/90 font-medium mt-1">
              {game.tagline}
            </p>

            {/* Quick Metrics */}
            <div className="mt-5 grid grid-cols-3 gap-2.5 max-w-md bg-black/30 p-3 rounded-2xl backdrop-blur-sm text-center">
              <div>
                <span className="text-[11px] text-white/70 block">اللاعبين</span>
                <span className="text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-1 mt-0.5">
                  <Users className="w-3.5 h-3.5 text-amber-300" />
                  {game.players}
                </span>
              </div>
              <div className="border-x border-white/10">
                <span className="text-[11px] text-white/70 block">المدة</span>
                <span className="text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-amber-300" />
                  {game.duration}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-white/70 block">التقييم</span>
                <span className="text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-1 mt-0.5">
                  <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  {game.rating} ({game.ratingCount})
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center border-b border-slate-800 bg-slate-900/50 px-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            نظرة عامة وماذا تحتوي
          </button>
          <button
            onClick={() => setActiveTab('how-to-play')}
            className={`py-3 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'how-to-play'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            طريقة اللعب وقوانين الجلسة
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[55vh] overflow-y-auto">
          {activeTab === 'overview' ? (
            <>
              {/* Description */}
              <div>
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">عن اللعبة</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {game.description}
                </p>
              </div>

              {/* What you get */}
              <div>
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">ماذا ستحصل في جلستكم؟</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {game.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-200 leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Pack Showcase for Trivia Clash */}
              {game.id === 'trivia-clash' && (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-2.5 text-right">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>3 باقات مخصصة لتناسب وقت جلستكم:</span>
                    </span>
                    <span className="text-[10px] text-slate-400">سعر مستقل لكل باقة</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                      <span className="text-xs font-black text-white block">باقة 10 أسئلة ⚡</span>
                      <span className="text-sm font-black text-emerald-400 font-display">14 ر.س</span>
                      <span className="block text-[10px] text-slate-400">تحدي سريع</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/50 text-center ring-1 ring-emerald-500/30">
                      <span className="text-xs font-black text-white block">باقة 15 سؤالاً 🔥</span>
                      <span className="text-sm font-black text-emerald-400 font-display">19 ر.س</span>
                      <span className="block text-[10px] text-emerald-300 font-bold">الأكثر طلباً</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                      <span className="text-xs font-black text-white block">باقة 20 سؤالاً 🏆</span>
                      <span className="text-sm font-black text-emerald-400 font-display">24 ر.س</span>
                      <span className="block text-[10px] text-slate-400">ماراثون السهرة</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Hardware / Gathering Vibe */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                <Tv className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-amber-300">كيف تجتمعون؟</h5>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    افتح اللعبة على جوال أو آيباد أو لابتوب، أو ارمها على شاشة التلفزيون (AirPlay / Chromecast) واجلسوا كلكم حول نفس الشاشة. شخص واحد يتحكم أو تبادلوا الأدوار!
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">خطوات اللعب في الجلسة</h4>
              <div className="space-y-3">
                {game.howToPlay.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Purchase Action */}
        <div className="p-5 sm:p-6 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-4">
            {isOwned ? (
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                <CheckCircle className="w-5 h-5" />
                <span>أنت تملك هذه اللعبة بالفعل!</span>
              </div>
            ) : game.id === 'trivia-clash' ? (
              <div>
                <span className="text-xs text-slate-400 block">3 باقات مستقلة (10 / 15 / 20 سؤالاً)</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-slate-400">تبدأ من</span>
                  <span className="text-3xl font-black text-white font-display">
                    14
                  </span>
                  <span className="text-sm font-bold text-emerald-400">ريال سعودي</span>
                </div>
              </div>
            ) : (
              <div>
                <span className="text-xs text-slate-400 block">السعر لمرة واحدة (ملكك للأبد)</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white font-display">
                    {game.price}
                  </span>
                  <span className="text-sm font-bold text-amber-400">ريال سعودي</span>
                  {game.originalPrice && (
                    <span className="text-sm text-slate-500 line-through">
                      {game.originalPrice} ر.س
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="w-full sm:w-auto flex items-center gap-2.5">
            {isOwned ? (
              <button
                id="modal-play-btn"
                onClick={() => {
                  soundEngine.playClick();
                  onPlay(game);
                }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer font-display"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>ابدأ اللعب الآن</span>
              </button>
            ) : (
              <>
                <button
                  id="modal-demo-btn"
                  onClick={() => {
                    soundEngine.playClick();
                    onPlay(game);
                  }}
                  className="w-1/2 sm:w-auto px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>تجربة سريعة</span>
                </button>

                <button
                  id="modal-buy-now-btn"
                  onClick={() => {
                    soundEngine.playClick();
                    onBuy(game);
                  }}
                  className="w-1/2 sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer font-display"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>{game.id === 'trivia-clash' ? 'اختيار باقة الأسئلة 📦' : 'اشترِ والعب فوراً'}</span>
                </button>
              </>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
