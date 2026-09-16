import React, { useState, useEffect } from 'react';
import { X, Check, Zap, Flame, Trophy, ShieldCheck, Sparkles, Play, ShoppingCart, Clock, Users, RefreshCw, BarChart2 } from 'lucide-react';
import { GameItem, TriviaPackOption } from '../types';
import { TRIVIA_PACK_OPTIONS, TRIVIA_QUESTIONS } from '../data/games';
import { soundEngine } from '../utils/audio';

interface TriviaPacksModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: GameItem;
  isOwned: boolean;
  onSelectPackAndBuy: (game: GameItem, pack: TriviaPackOption) => void;
  onSelectPackAndPlay: (game: GameItem, pack: TriviaPackOption) => void;
}

export const TriviaPacksModal: React.FC<TriviaPacksModalProps> = ({
  isOpen,
  onClose,
  game,
  isOwned,
  onSelectPackAndBuy,
  onSelectPackAndPlay,
}) => {
  const [selectedPackId, setSelectedPackId] = useState<'pack_10' | 'pack_15' | 'pack_20'>('pack_15');
  const [playedCount, setPlayedCount] = useState<number>(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('niddak_trivia_played_ids');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setPlayedCount(parsed.length);
        }
      }
    } catch {}
  }, [isOpen]);

  if (!isOpen) return null;

  const totalQuestions = TRIVIA_QUESTIONS.length;
  const remainingQuestions = Math.max(0, totalQuestions - playedCount);
  const selectedPack = TRIVIA_PACK_OPTIONS.find((p) => p.id === selectedPackId) || TRIVIA_PACK_OPTIONS[1];
  const packsRemaining = Math.max(1, Math.floor(remainingQuestions / selectedPack.count));

  const handleResetHistory = () => {
    soundEngine.playClick();
    try {
      localStorage.removeItem('niddak_trivia_played_ids');
    } catch {}
    setPlayedCount(0);
  };

  const handleSelect = (id: 'pack_10' | 'pack_15' | 'pack_20') => {
    soundEngine.playClick();
    setSelectedPackId(id);
  };

  const handleConfirmAction = () => {
    soundEngine.playClick();
    if (isOwned) {
      onSelectPackAndPlay(game, selectedPack);
    } else {
      onSelectPackAndBuy(game, selectedPack);
    }
  };

  const handleQuickDemo = () => {
    soundEngine.playClick();
    onSelectPackAndPlay(game, selectedPack);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in text-right">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/30 inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>خيارات باقات حرب المعلومات 📦</span>
              </span>
              <span className="text-xs text-slate-400 font-bold hidden sm:inline-block">
                مخزون يتجاوز 200 سؤال
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-display">
              {game.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              اختر حجم الباقة المناسبة لجلستكم، كل باقة محتواها متجدد بالكامل وبدون أي تكرار وكل باقة بسعر مستقل:
            </p>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Stock Status and The 3 Pack Options */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Real-time Inventory & Remaining Rounds Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <BarChart2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white">
                    كم باقي جولة / سؤال في اللعبة؟
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                    متبقي {remainingQuestions} سؤالاً لم تُلعب بعد 🎯
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  إجمالي المخزون: <span className="font-bold text-white">{totalQuestions} سؤالاً</span> • تم لعب: <span className="font-bold text-amber-300">{playedCount}</span> • يكفي لـ <span className="font-bold text-emerald-400">{packsRemaining} باقات جديدة</span> كلياً بدون أي تكرار!
                </p>
              </div>
            </div>

            {playedCount > 0 && (
              <button
                type="button"
                onClick={handleResetHistory}
                className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer shrink-0"
                title="إعادة تصفير الأسئلة التي لعبت للبدء من جديد"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>إعادة تصفير السجل ({playedCount})</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {TRIVIA_PACK_OPTIONS.map((pack) => {
              const isSelected = selectedPackId === pack.id;
              const is10 = pack.count === 10;
              const is15 = pack.count === 15;
              const is20 = pack.count === 20;

              return (
                <div
                  key={pack.id}
                  onClick={() => handleSelect(pack.id)}
                  className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between text-right ${
                    isSelected
                      ? 'bg-gradient-to-b from-emerald-500/15 to-teal-500/10 border-emerald-400 shadow-xl shadow-emerald-500/10 scale-[1.02]'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  {/* Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
                        isSelected
                          ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {pack.badge}
                    </span>

                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                          : 'border-slate-700 bg-slate-900'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  {/* Icon & Title */}
                  <div className="space-y-1.5 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-xl border border-slate-800 mb-2">
                      {is10 && <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />}
                      {is15 && <Flame className="w-5 h-5 text-orange-400 fill-orange-400" />}
                      {is20 && <Trophy className="w-5 h-5 text-emerald-400 fill-emerald-400" />}
                    </div>

                    <h3 className="text-base font-black text-white font-display">
                      {pack.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      {pack.description}
                    </p>
                  </div>

                  {/* Duration, rounds & players */}
                  <div className="space-y-1.5 mb-4 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>{pack.count} جولة / سؤال</span>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        تكفي {Math.max(1, Math.floor(remainingQuestions / pack.count))} باقات
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{pack.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-500" />
                        <span>فريقين</span>
                      </div>
                    </div>
                  </div>

                  {/* Price Tag */}
                  <div className="pt-2 border-t border-slate-800 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-slate-500 line-through ml-1.5">
                        {pack.originalPrice} ر.س
                      </span>
                      <span className="text-xl font-black text-white font-display">
                        {pack.price}
                      </span>
                      <span className="text-xs font-bold text-emerald-400 mr-1">ريال</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">
                      باقة كاملة
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Value Highlights Box */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>محتوى الأسئلة بدون تكرار في كل باقة يتم شحنها أو شراؤها</span>
            </div>
            <span className="text-emerald-400 font-bold">
              الباقة المختارة: {selectedPack.title} ({selectedPack.price} ر.س)
            </span>
          </div>
        </div>

        {/* Modal Footer CTA */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-baseline gap-2 self-start sm:self-auto">
            <span className="text-xs text-slate-400">الإجمالي للباقة المختارة:</span>
            <span className="text-2xl font-black text-white font-display">
              {selectedPack.price}
            </span>
            <span className="text-xs font-bold text-emerald-400">ريال سعودي</span>
          </div>

          <div className="w-full sm:w-auto flex items-center gap-2.5">
            {!isOwned && (
              <button
                type="button"
                onClick={handleQuickDemo}
                className="w-1/2 sm:w-auto px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>تجربة سريعة</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleConfirmAction}
              className="flex-1 sm:flex-initial px-6 sm:px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer font-display"
            >
              {isOwned ? (
                <>
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>ابدأ باقة الـ {selectedPack.count} أسئلة فوراً</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>شراء وتفعيل {selectedPack.title} ({selectedPack.price} ر.س)</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
