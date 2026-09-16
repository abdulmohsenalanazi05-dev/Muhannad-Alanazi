import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, RotateCcw, Check, ChevronLeft, 
  HelpCircle, Eye, Trophy, Sparkles, Lightbulb,
  CheckCircle2, CreditCard, Zap, RefreshCw
} from 'lucide-react';
import { GameItem, PictureRiddle } from '../../types';
import { PICTURE_RIDDLES } from '../../data/games';
import { soundEngine } from '../../utils/audio';
import { RechargeModal } from '../RechargeModal';

interface PictureGameProps {
  game: GameItem;
  onExit: () => void;
}

const RIDDLES_PER_PACK = 10;

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const PictureGame: React.FC<PictureGameProps> = ({ game, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [teamScores, setTeamScores] = useState({ teamA: 0, teamB: 0 });

  // Pack System State
  const [currentPackNumber, setCurrentPackNumber] = useState<number>(1);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState<boolean>(false);
  const [paymentSuccessToast, setPaymentSuccessToast] = useState<string | null>(null);
  const [shuffleSeed, setShuffleSeed] = useState(0);

  // Local storage for played riddles
  const [playedRiddleIds, setPlayedRiddleIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('niddak_picture_played_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('niddak_picture_played_ids', JSON.stringify(playedRiddleIds));
    } catch {}
  }, [playedRiddleIds]);

  const unplayedRiddles = useMemo(() => {
    return PICTURE_RIDDLES.filter((r) => !playedRiddleIds.includes(r.id));
  }, [playedRiddleIds]);

  const currentPackRiddles = useMemo(() => {
    const pool = unplayedRiddles.length >= RIDDLES_PER_PACK ? unplayedRiddles : PICTURE_RIDDLES;
    const shuffled = shuffleArray(pool);
    return shuffled.slice(0, Math.min(RIDDLES_PER_PACK, pool.length));
  }, [unplayedRiddles, shuffleSeed]);

  const playedCount = useMemo(() => {
    return PICTURE_RIDDLES.filter((r) => playedRiddleIds.includes(r.id)).length;
  }, [playedRiddleIds]);

  const remainingCount = Math.max(0, PICTURE_RIDDLES.length - playedCount);

  const currentRiddle: PictureRiddle = currentPackRiddles[currentIndex] || currentPackRiddles[0] || PICTURE_RIDDLES[0];

  const handleReveal = () => {
    setIsRevealed(true);
    soundEngine.playCorrect();
  };

  const handleNext = () => {
    soundEngine.playClick();
    if (currentIndex + 1 < currentPackRiddles.length) {
      setCurrentIndex((prev) => prev + 1);
      setShowHint(false);
      setIsRevealed(false);
    } else {
      setIsEnded(true);
      soundEngine.playVictory();
    }
  };

  const awardPoints = (team: 'A' | 'B') => {
    soundEngine.playCorrect();
    if (team === 'A') {
      setTeamScores((prev) => ({ ...prev, teamA: prev.teamA + 1 }));
    } else {
      setTeamScores((prev) => ({ ...prev, teamB: prev.teamB + 1 }));
    }
  };

  const restartCurrentPack = () => {
    setCurrentIndex(0);
    setShowHint(false);
    setIsRevealed(false);
    setIsEnded(false);
    setTeamScores({ teamA: 0, teamB: 0 });
    soundEngine.playClick();
  };

  const resetPlayedHistory = () => {
    soundEngine.playClick();
    setPlayedRiddleIds([]);
    setCurrentPackNumber(1);
    setShuffleSeed((prev) => prev + 1);
    setCurrentIndex(0);
    setShowHint(false);
    setIsRevealed(false);
    setIsEnded(false);
    setTeamScores({ teamA: 0, teamB: 0 });
    setPaymentSuccessToast('تم تصفير سجل الألغاز وبدء باقة جديدة بـ 10 ألغاز طازجة!');
    setTimeout(() => setPaymentSuccessToast(null), 3000);
  };

  const handleConfirmRecharge = () => {
    // Record current pack riddles as played
    const justPlayedIds = currentPackRiddles.map((r) => r.id);
    setPlayedRiddleIds((prev) => Array.from(new Set([...prev, ...justPlayedIds])));
    setCurrentPackNumber((prev) => prev + 1);
    setShuffleSeed((prev) => prev + 1);
    setCurrentIndex(0);
    setShowHint(false);
    setIsRevealed(false);
    setIsEnded(false);
    setTeamScores({ teamA: 0, teamB: 0 });

    setPaymentSuccessToast('تم تأكيد الدفع وتفعيل باقة الـ 10 ألغاز بنجاح! جاهزون للتخمين 🧠');
    setTimeout(() => setPaymentSuccessToast(null), 4000);
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-between max-w-4xl mx-auto p-4 sm:p-6 text-right">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <button
          onClick={onExit}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 rotate-180" />
          <span>خروج</span>
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5">
            <h2 className="text-base sm:text-lg font-black text-white font-display">تحدي الرموز والإيموجي 🎨</h2>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black border border-purple-500/30">
              باقة 10 ألغاز 📦
            </span>
          </div>
          {!isEnded && (
            <div className="flex items-center justify-center gap-2 mt-0.5">
              <span className="text-xs text-purple-400 font-bold">
                اللغز {currentIndex + 1} من {currentPackRiddles.length}
              </span>
              <span className="text-[10px] text-slate-400">
                (الباقة #{currentPackNumber})
              </span>
            </div>
          )}
        </div>

        {/* Live Score */}
        <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-xl border border-slate-800 text-xs font-bold">
          <span className="text-amber-400">فريق أ: {teamScores.teamA}</span>
          <span className="text-slate-600">|</span>
          <span className="text-rose-400">فريق ب: {teamScores.teamB}</span>
        </div>
      </div>

      {/* Payment Success Toast */}
      {paymentSuccessToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 text-sm">
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <span>{paymentSuccessToast}</span>
        </div>
      )}

      {isEnded ? (
        /* End Screen / Pack Completed Screen */
        <div className="my-auto py-8 text-center space-y-6 max-w-xl mx-auto">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-4xl shadow-xl shadow-purple-500/20">
            🎉
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-black border border-purple-500/30 inline-block">
              أكملتم باقة الـ 10 ألغاز 🔥
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white font-display">
              انتهت الباقة #{currentPackNumber}!
            </h2>
            <p className="text-sm text-slate-300">
              ذكاء وسرعة بديهة خرافية بالجلسة! مين كان الأسرع بالتخمين؟
            </p>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
            <div className={`p-4 rounded-2xl bg-slate-900 border ${teamScores.teamA >= teamScores.teamB ? 'border-amber-500 shadow-lg shadow-amber-500/10' : 'border-slate-800'}`}>
              <span className="text-xs text-amber-400 font-bold">فريق أ</span>
              <div className="text-3xl font-black text-white font-display mt-1">{teamScores.teamA}</div>
            </div>
            <div className={`p-4 rounded-2xl bg-slate-900 border ${teamScores.teamB >= teamScores.teamA ? 'border-rose-500 shadow-lg shadow-rose-500/10' : 'border-slate-800'}`}>
              <span className="text-xs text-rose-400 font-bold">فريق ب</span>
              <div className="text-3xl font-black text-white font-display mt-1">{teamScores.teamB}</div>
            </div>
          </div>

          {/* Recharge Call to Action Box */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-500/15 via-indigo-500/15 to-purple-500/15 border-2 border-purple-500/40 text-right space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400 fill-purple-400" />
                <span>تبون تكملون التخمين؟ اشحنوا 10 ألغاز جديدة!</span>
              </span>
              <span className="text-sm font-black text-purple-400 font-display">{game.price} ر.س</span>
            </div>
            <p className="text-xs text-slate-300">
              اشحن 10 ألغاز ورموز إيموجي جديدة كلياً بدون أي تكرار للألغاز السابقة! (المتبقي في المخزون: {remainingCount} لغز).
            </p>

            <button
              onClick={() => setIsRechargeModalOpen(true)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 hover:from-purple-400 hover:to-indigo-400 text-white font-black text-base shadow-xl shadow-purple-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer font-display flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              <span>شحن 10 ألغاز جديدة ({game.price} ر.س) 💳</span>
            </button>
          </div>

          {/* Secondary Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={restartCurrentPack}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              إعادة لعب نفس الباقة مجاناً 🔄
            </button>

            {playedCount > 0 && (
              <button
                onClick={resetPlayedHistory}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>تصفير السجل ({playedCount} لغز)</span>
              </button>
            )}

            <button
              onClick={onExit}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              العودة للقائمة
            </button>
          </div>
        </div>
      ) : (
        <div className="my-auto py-6 space-y-8">
          
          <div className="text-center space-y-1">
            <span className="px-3.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold inline-block">
              {currentRiddle.categoryName} • {currentRiddle.title}
            </span>
            <p className="text-xs text-slate-400">
              اللغز {currentIndex + 1} من 10 • ركّبوا الرموز وخمنوا المقصود بأسرع وقت!
            </p>
          </div>

          {/* Big Emoji Card */}
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-slate-800 text-center shadow-2xl space-y-6">
            <div className="text-5xl sm:text-7xl md:text-8xl tracking-widest py-6 animate-pulse select-none">
              {currentRiddle.emojisOrClue}
            </div>

            {/* Hint Box */}
            {showHint && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm text-amber-300 font-medium max-w-md mx-auto animate-in fade-in">
                💡 <span className="font-bold">تلميح مساعدة:</span> {currentRiddle.hint}
              </div>
            )}

            {/* Revealed Answer */}
            {isRevealed && (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-center space-y-2 animate-in zoom-in">
                <span className="text-xs text-emerald-400 font-bold block">الحل هو:</span>
                <h3 className="text-2xl sm:text-3xl font-black text-white font-display">
                  {currentRiddle.answer}
                </h3>
                {currentRiddle.explanation && (
                  <p className="text-xs text-slate-300 max-w-sm mx-auto">
                    {currentRiddle.explanation}
                  </p>
                )}

                {/* Award points to teams */}
                <div className="flex items-center justify-center gap-2 pt-3">
                  <span className="text-xs text-slate-400 ml-1">مين خمنها أول؟:</span>
                  <button
                    onClick={() => awardPoints('A')}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 transition-colors cursor-pointer"
                  >
                    +1 فريق أ
                  </button>
                  <button
                    onClick={() => awardPoints('B')}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold border border-rose-500/40 transition-colors cursor-pointer"
                  >
                    +1 فريق ب
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {!showHint && !isRevealed && (
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setShowHint(true);
                }}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs sm:text-sm font-bold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Lightbulb className="w-4 h-4" />
                <span>إظهار تلميح</span>
              </button>
            )}

            {!isRevealed ? (
              <button
                onClick={handleReveal}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-black text-base shadow-xl shadow-purple-500/25 transition-all cursor-pointer font-display flex items-center gap-2"
              >
                <Eye className="w-5 h-5" />
                <span>كشف الحل</span>
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-base shadow-xl shadow-emerald-500/25 transition-all cursor-pointer font-display flex items-center gap-2"
              >
                <span>{currentIndex + 1 < currentPackRiddles.length ? 'اللغز التالي' : 'إنهاء باقة الـ 10 ألغاز 🏆'}</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      )}

      {/* Recharge Modal */}
      <RechargeModal
        isOpen={isRechargeModalOpen}
        onClose={() => setIsRechargeModalOpen(false)}
        onConfirmRecharge={handleConfirmRecharge}
        gameTitle={game.title}
        gamePrice={game.price}
        packNumber={currentPackNumber + 1}
        itemLabel="ألغاز"
        remainingStockCount={remainingCount}
        categoryOrDetails="ألغاز ورموز إيموجي"
      />

    </div>
  );
};

