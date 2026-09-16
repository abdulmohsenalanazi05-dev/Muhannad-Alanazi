import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, Pause, RotateCcw, Clock, Sparkles, Check, ChevronLeft, 
  HelpCircle, Eye, Volume2, Trophy, ArrowRight, Flame, Layers, AlertCircle, Shuffle,
  UserCheck, Briefcase, Users, CreditCard, Lock, Zap, CheckCircle2, ShieldCheck, X, Copy, Loader2, RefreshCw
} from 'lucide-react';
import { GameItem, WhoAmIRound, WhoAmICategoryId, FootballSubFilter, ArabCelebsSubFilter } from '../../types';
import { WHO_AM_I_ROUNDS, WHO_AM_I_CATEGORIES } from '../../data/games';
import { soundEngine } from '../../utils/audio';

interface WhoAmIGameProps {
  game: GameItem;
  onExit: () => void;
}

// دالة خلط عشوائي Fisher-Yates
const shuffleArray = <T,>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// عدد الجولات لكل باقة/دفعة (10 جولات في كل مرة)
const ROUNDS_PER_PACK = 10;

export const WhoAmIGame: React.FC<WhoAmIGameProps> = ({ game, onExit }) => {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'revealed' | 'ended'>('intro');
  const [selectedCategory, setSelectedCategory] = useState<WhoAmICategoryId>('all');
  // خيار تصفية كرة القدم: 'players' (لاعبين فقط) | 'coaches' (مدربين فقط) | 'both' (لاعبين ومدربين معاً)
  const [footballSubFilter, setFootballSubFilter] = useState<FootballSubFilter>('players');
  // خيار تصفية الشخصيات العربية: 'social' (مشاهير تواصل) | 'mix' (مشاهير عامة مكس) | 'all' (الكل معاً)
  const [arabCelebSubFilter, setArabCelebSubFilter] = useState<ArabCelebsSubFilter>('all');
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [revealedClueIndex, setRevealedClueIndex] = useState(0); // 0 = Hint 1, 1 = Hint 2, 2 = Hint 3
  const [shuffleSeed, setShuffleSeed] = useState(0); // مفتاح إعادة الخلط العشوائي
  
  // تتبع الجولات التي تم لعبها لضمان عدم تكرار الشخصيات في الباقات اللاحقة
  const [playedRoundIds, setPlayedRoundIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('niddak_who_am_i_played_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('niddak_who_am_i_played_ids', JSON.stringify(playedRoundIds));
    } catch {}
  }, [playedRoundIds]);

  // رقم الباقة الحالية (الباقة 1، الباقة 2، الباقة 3...)
  const [currentPackNumber, setCurrentPackNumber] = useState<number>(1);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [paymentSuccessToast, setPaymentSuccessToast] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'apple' | 'mada' | 'card' | 'stc' | 'bank'>('apple');
  const [copiedIban, setCopiedIban] = useState<boolean>(false);

  // Tempo mode: 'fast' (رتم ناري سريع 30ث/20ث/10ث) or 'normal' (رتم قياسي 60ث/30ث/15ث)
  // Football and Arab Celebs default to 'fast'
  const [tempoMode, setTempoMode] = useState<'fast' | 'normal'>('fast');
  const [timeLeft, setTimeLeft] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [autoNotice, setAutoNotice] = useState<string | null>(null);
  const [teamScores, setTeamScores] = useState({ teamA: 0, teamB: 0 });

  // 1. المخزون الكامل للقسم المحدد
  const categoryPool = useMemo(() => {
    let rounds = selectedCategory === 'all' 
      ? WHO_AM_I_ROUNDS 
      : WHO_AM_I_ROUNDS.filter((r) => r.categoryId === selectedCategory);

    // إذا تم اختيار كرة القدم، تطبيق الفلتر الدقيق:
    // 1. players: لاعبين فقط (ممنوع دخول أي مدرب)
    // 2. coaches: مدربين فقط (22 مدرب)
    // 3. both: لاعبين ومدربين معاً
    if (selectedCategory === 'football') {
      if (footballSubFilter === 'players') {
        rounds = rounds.filter((r) => {
          const role = r.footballRole || (r.id.startsWith('fb_mgr_') ? 'coach' : 'player');
          return role === 'player';
        });
      } else if (footballSubFilter === 'coaches') {
        rounds = rounds.filter((r) => {
          const role = r.footballRole || (r.id.startsWith('fb_mgr_') ? 'coach' : 'player');
          return role === 'coach';
        });
      }
    }

    // إذا تم اختيار شخصيات عربية مشهورة، تطبيق الفلتر:
    // 1. social: مشاهير تواصل اجتماعي
    // 2. mix: مشاهير عامة مكس
    // 3. all: الكل معاً
    if (selectedCategory === 'arab_celebs') {
      if (arabCelebSubFilter === 'social') {
        rounds = rounds.filter((r) => r.celebType === 'social');
      } else if (arabCelebSubFilter === 'mix') {
        rounds = rounds.filter((r) => r.celebType === 'mix' || !r.celebType);
      }
    }

    return rounds;
  }, [selectedCategory, footballSubFilter, arabCelebSubFilter]);

  // 2. الجولات المتبقية في هذا القسم التي لم تُلعب بعد في هذا الجهاز
  const unplayedRoundsInCategory = useMemo(() => {
    return categoryPool.filter((r) => !playedRoundIds.includes(r.id));
  }, [categoryPool, playedRoundIds]);

  // 3. جولات باقة الـ 10 الحالية (تؤخذ حصراً من غير الملعوبة لضمان عدم التكرار)
  const currentPackRounds = useMemo(() => {
    // إذا ختم المستخدم كل الجولات المتوفرة، يعاد التدوير من المخزون الكامل
    const sourcePool = unplayedRoundsInCategory.length > 0 ? unplayedRoundsInCategory : categoryPool;
    const shuffled = shuffleArray(sourcePool);
    return shuffled.slice(0, Math.min(ROUNDS_PER_PACK, sourcePool.length));
  }, [categoryPool, unplayedRoundsInCategory, shuffleSeed]);

  // الجولة الحالية الفعالة
  const currentRound: WhoAmIRound = currentPackRounds[currentRoundIndex] || currentPackRounds[0] || WHO_AM_I_ROUNDS[0];

  // إحصائيات الجولات في هذا القسم
  const playedInThisCategoryCount = useMemo(() => {
    return categoryPool.filter((r) => playedRoundIds.includes(r.id)).length;
  }, [categoryPool, playedRoundIds]);

  const remainingInThisCategoryCount = Math.max(0, categoryPool.length - playedInThisCategoryCount);

  // Timer duration mapped to each hint based on tempo mode:
  // Fast / Intense: Hint 1 = 30s, Hint 2 = 20s, Hint 3 = 10s
  // Standard: Hint 1 = 60s, Hint 2 = 30s, Hint 3 = 15s
  const getHintDuration = (index: number) => {
    if (tempoMode === 'fast') {
      if (index === 0) return 30;
      if (index === 1) return 20;
      return 10;
    }
    if (index === 0) return 60;
    if (index === 1) return 30;
    return 15;
  };

  // Timer countdown and forced auto-reveal progression
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isTimerRunning && gameState === 'playing') {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Current hint time expired! Check if next hint exists to forcibly reveal it
            if (revealedClueIndex === 0) {
              soundEngine.playCorrect();
              setRevealedClueIndex(1);
              const nextTime = getHintDuration(1);
              setAutoNotice(`⚡ انتهى وقت التلميح الأول الصعب! انكشف التلميح الثاني [متوسط] وبدأت ${nextTime} ثانية!`);
              return nextTime;
            } else if (revealedClueIndex === 1) {
              soundEngine.playCorrect();
              setRevealedClueIndex(2);
              const nextTime = getHintDuration(2);
              setAutoNotice(`💡 انتهى وقت التلميح المتوسط! انكشف التلميح الثالث [سهل] وبدأت ${nextTime} ثانية!`);
              return nextTime;
            } else {
              // Hint 3 expired -> Full round time is up!
              soundEngine.playBuzzer();
              setIsTimerRunning(false);
              setAutoNotice('⌛ انتهى الوقت كاملاً! حان وقت كشف الإجابة ومعرفة الشخصية!');
              return 0;
            }
          }

          // Audio feedback
          if (prev <= 4) {
            soundEngine.playTick(true);
          } else if (prev % 10 === 0) {
            soundEngine.playTick(false);
          }

          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isTimerRunning, gameState, revealedClueIndex, tempoMode]);

  // Start round
  const startRound = (roundIdx: number) => {
    setCurrentRoundIndex(roundIdx);
    setRevealedClueIndex(0); // Starts with Hint 1
    const initialTime = getHintDuration(0);
    setTimeLeft(initialTime);
    setIsTimerRunning(true);
    setAutoNotice(null);
    setGameState('playing');
    soundEngine.playClick();
  };

  // Reveal next clue manually early (resets timer to that hint's required duration)
  const revealNextClueEarly = () => {
    if (revealedClueIndex < 2) {
      soundEngine.playCorrect();
      const nextIndex = revealedClueIndex + 1;
      setRevealedClueIndex(nextIndex);
      const nextTime = getHintDuration(nextIndex);
      setTimeLeft(nextTime);
      setAutoNotice(
        nextIndex === 1 
          ? `تم كشف التلميح الثاني [متوسط ⚡] (${nextTime} ثانية)` 
          : `تم كشف التلميح الثالث [سهل 💡] (${nextTime} ثانية)`
      );
    }
  };

  const toggleTimer = () => {
    soundEngine.playClick();
    setIsTimerRunning((prev) => !prev);
  };

  const handleRevealAnswer = () => {
    setIsTimerRunning(false);
    setGameState('revealed');
    soundEngine.playVictory();
  };

  // الانتقال للجولة التالية أو إنهاء باقة الـ 10 جولات
  const handleNextRound = () => {
    soundEngine.playClick();
    if (currentRoundIndex + 1 < currentPackRounds.length) {
      startRound(currentRoundIndex + 1);
    } else {
      // انتهت باقة الـ 10 جولات!
      // حفظ الجولات التي تم لعبها لمنع تكرارها في الباقة القادمة
      const currentPackIds = currentPackRounds.map((r) => r.id);
      setPlayedRoundIds((prev) => Array.from(new Set([...prev, ...currentPackIds])));
      setGameState('ended');
      soundEngine.playVictory();
    }
  };

  // عملية شحن باقة 10 جولات جديدة فورياً ومواصلة اللعب
  const handleProcessRecharge = async () => {
    setIsProcessingPayment(true);
    soundEngine.playClick();

    try {
      await fetch('/api/payment/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: 'who-am-i',
          gameTitle: `شحن 10 جولات إضافية - باقة #${currentPackNumber + 1}`,
          amount: game.price,
          paymentMethod: selectedPaymentMethod,
          customerName: 'لاعب من أنا'
        })
      });
    } catch {
      // Fallback
    }

    // حفظ الجولات المنتهية مسبقاً إذا لم تكن محفوظة
    const currentPackIds = currentPackRounds.map((r) => r.id);
    setPlayedRoundIds((prev) => Array.from(new Set([...prev, ...currentPackIds])));

    // تفعيل الباقة الجديدة
    setCurrentPackNumber((prev) => prev + 1);
    setShuffleSeed((prev) => prev + 1);
    setCurrentRoundIndex(0);
    setIsProcessingPayment(false);
    setIsRechargeModalOpen(false);

    soundEngine.playVictory();
    setPaymentSuccessToast(`🎉 تم شحن 10 جولات جديدة بنجاح! الباقة رقم #${currentPackNumber + 1} جاهزة الآن!`);
    
    // بدء الجولة الأولى من الـ 10 الجديدة
    setTimeout(() => {
      startRound(0);
    }, 300);
  };

  const awardPoints = (team: 'A' | 'B') => {
    const points = currentRound.clues[revealedClueIndex]?.points || 1;
    soundEngine.playCorrect();
    if (team === 'A') {
      setTeamScores((prev) => ({ ...prev, teamA: prev.teamA + points }));
    } else {
      setTeamScores((prev) => ({ ...prev, teamB: prev.teamB + points }));
    }
  };

  const restartCurrentPack = () => {
    setCurrentRoundIndex(0);
    setTeamScores({ teamA: 0, teamB: 0 });
    startRound(0);
  };

  // تصفير سجل الجولات الملعوبة في هذا القسم
  const resetPlayedHistory = () => {
    soundEngine.playClick();
    const catIdsToRemove = new Set(categoryPool.map((r) => r.id));
    setPlayedRoundIds((prev) => prev.filter((id) => !catIdsToRemove.has(id)));
    setCurrentPackNumber(1);
    setShuffleSeed((prev) => prev + 1);
    setCurrentRoundIndex(0);
    setAutoNotice('تم تصفير سجل جولات هذا القسم، وبدء باقة جديدة بـ 10 جولات طازجة!');
  };

  const handleSelectCategory = (catId: WhoAmICategoryId) => {
    soundEngine.playClick();
    setSelectedCategory(catId);
    setCurrentRoundIndex(0);
    // If football, arab celebs, foreign series, or khaleeji series selected, ensure fast tempo is activated
    if (catId === 'football' || catId === 'arab_celebs' || catId === 'foreign_series' || catId === 'khaleeji_series') {
      setTempoMode('fast');
    }
    setGameState('intro');
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-between max-w-4xl mx-auto p-4 sm:p-6 text-right font-sans">
      
      {/* Top Game Bar */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <button
          onClick={onExit}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 rotate-180" />
          <span>خروج</span>
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5">
            <h2 className="text-base sm:text-lg font-black text-white font-display">من أنا؟ 🔍</h2>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/30">
              باقة 10 جولات 📦
            </span>
          </div>
          {gameState === 'playing' || gameState === 'revealed' ? (
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              <span className="text-xs text-amber-400 font-bold">
                الجولة {currentRoundIndex + 1} من {currentPackRounds.length}
              </span>
              <span className="text-[10px] text-slate-400">
                (الباقة #{currentPackNumber})
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-400">10 جولات في كل دفعة بدون تكرار</span>
          )}
        </div>

        {/* Live Mini Scores */}
        <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-bold">
          <span className="text-amber-400">فريق أ: {teamScores.teamA}</span>
          <span className="text-slate-600">|</span>
          <span className="text-rose-400">فريق ب: {teamScores.teamB}</span>
        </div>
      </div>

      {/* Category Tabs Bar (Always accessible for quick switching) */}
      <div className="py-2 flex flex-col gap-2">
        <div className="overflow-x-auto scrollbar-none flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 shrink-0 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>الأقسام:</span>
          </span>
          {WHO_AM_I_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id as WhoAmICategoryId)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                    : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* شريط فرعي سريع خاص بكرة القدم للتبديل الفوري بين اللاعبين والمدربين أو كلاهما */}
        {selectedCategory === 'football' && (
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-amber-500/30 overflow-x-auto scrollbar-none">
            <span className="text-[11px] font-bold text-amber-300 shrink-0 px-1">
              ⚽ محتوى التحدي:
            </span>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setFootballSubFilter('players');
                setCurrentRoundIndex(0);
                setShuffleSeed((prev) => prev + 1);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                footballSubFilter === 'players'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>🏃‍♂️</span>
              <span>لاعبين فقط ({WHO_AM_I_ROUNDS.filter(r => r.categoryId === 'football' && (r.footballRole === 'player' || (!r.id.startsWith('fb_mgr_') && !r.footballRole))).length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setFootballSubFilter('coaches');
                setCurrentRoundIndex(0);
                setShuffleSeed((prev) => prev + 1);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                footballSubFilter === 'coaches'
                  ? 'bg-blue-500 text-white font-black shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>👔</span>
              <span>مدربين فقط ({WHO_AM_I_ROUNDS.filter(r => r.categoryId === 'football' && (r.footballRole === 'coach' || r.id.startsWith('fb_mgr_'))).length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setFootballSubFilter('both');
                setCurrentRoundIndex(0);
                setShuffleSeed((prev) => prev + 1);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                footballSubFilter === 'both'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>🔥</span>
              <span>لاعبين ومدربين معاً ({WHO_AM_I_ROUNDS.filter(r => r.categoryId === 'football').length})</span>
            </button>
          </div>
        )}
      </div>

      {/* ================= INTRO SCREEN ================= */}
      {gameState === 'intro' && (
        <div className="my-auto py-8 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-2xl shadow-orange-500/20 text-4xl">
            {WHO_AM_I_CATEGORIES.find((c) => c.id === selectedCategory)?.emoji || '🤔'}
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h1 className="text-3xl sm:text-5xl font-black text-white font-display">
              لعبة من أنا؟
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              اختر القسم، واستمع للتلميحات الثلاثة قبل انتهاء عداد الوقت الإجباري!
            </p>
          </div>

          {/* Category Cards Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-xl mx-auto text-right">
            {WHO_AM_I_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
              const count = WHO_AM_I_ROUNDS.filter((r) => r.categoryId === cat.id).length;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    soundEngine.playClick();
                    setSelectedCategory(cat.id as WhoAmICategoryId);
                    if (cat.id === 'football' || cat.id === 'arab_celebs' || cat.id === 'foreign_series' || cat.id === 'khaleeji_series') {
                      setTempoMode('fast');
                    }
                    setCurrentRoundIndex(0);
                    setShuffleSeed((prev) => prev + 1);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all text-right cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.emoji}</span>
                    <div>
                      <div className={`font-bold text-sm ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                        {cat.label}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {cat.description}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-bold shrink-0">
                    {count} جولات
                  </span>
                </button>
              );
            })}
          </div>

          {/* خيار تصفية فئة كرة القدم (لاعبين فقط | مدربين فقط | لاعبين ومدربين معاً) */}
          {selectedCategory === 'football' && (
            <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-2 border-amber-500/40 max-w-xl mx-auto text-right space-y-3 shadow-xl shadow-amber-500/5">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-black text-amber-300 flex items-center gap-1.5">
                  <span>⚽</span>
                  <span>تخصيص تحدي كرة القدم:</span>
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  حدد الشخصيات التي تريد مواجهتها
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* 1. لاعبين فقط */}
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setFootballSubFilter('players');
                    setCurrentRoundIndex(0);
                    setShuffleSeed((prev) => prev + 1);
                  }}
                  className={`p-3 rounded-xl border text-right transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center ${
                    footballSubFilter === 'players'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10 font-black ring-1 ring-amber-500/50'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-base">
                    🏃‍♂️
                  </div>
                  <span className="text-xs sm:text-sm font-black">
                    لاعبين فقط
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {WHO_AM_I_ROUNDS.filter(r => r.categoryId === 'football' && (r.footballRole === 'player' || (!r.id.startsWith('fb_mgr_') && !r.footballRole))).length} لاعب (بدون مدربين)
                  </span>
                </button>

                {/* 2. مدربين فقط */}
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setFootballSubFilter('coaches');
                    setCurrentRoundIndex(0);
                    setShuffleSeed((prev) => prev + 1);
                  }}
                  className={`p-3 rounded-xl border text-right transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center ${
                    footballSubFilter === 'coaches'
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-md shadow-blue-500/10 font-black ring-1 ring-blue-500/50'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-base">
                    👔
                  </div>
                  <span className="text-xs sm:text-sm font-black">
                    مدربين فقط
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {WHO_AM_I_ROUNDS.filter(r => r.categoryId === 'football' && (r.footballRole === 'coach' || r.id.startsWith('fb_mgr_'))).length} مدرب عبقري
                  </span>
                </button>

                {/* 3. لاعبين ومدربين معاً */}
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setFootballSubFilter('both');
                    setCurrentRoundIndex(0);
                    setShuffleSeed((prev) => prev + 1);
                  }}
                  className={`p-3 rounded-xl border text-right transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center ${
                    footballSubFilter === 'both'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10 font-black ring-1 ring-emerald-500/50'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-base">
                    🔥
                  </div>
                  <span className="text-xs sm:text-sm font-black">
                    لاعبين ومدربين
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {WHO_AM_I_ROUNDS.filter(r => r.categoryId === 'football').length} شخصية مكس
                  </span>
                </button>
              </div>

              <div className="text-[11px] text-center text-amber-200/80 bg-amber-500/10 py-1.5 px-2 rounded-lg border border-amber-500/20">
                {footballSubFilter === 'players' && '✔️ تم ضبط التحدي: لاعبين فقط بدون أي مدربين (كل الهنتات للاعبين)'}
                {footballSubFilter === 'coaches' && '✔️ تم ضبط التحدي: مدربين فقط (أسرار وبدايات ومواقف المدربين الكبار)'}
                {footballSubFilter === 'both' && '✔️ تم ضبط التحدي: خلطة نارية تشمل جميع أساطير اللاعبين والمدربين معاً'}
              </div>
            </div>
          )}

          {/* خيار تصفية فئة الشخصيات العربية المشهورة (مشاهير تواصل اجتماعي | مشاهير عامة مكس | الكل معاً) */}
          {selectedCategory === 'arab_celebs' && (
            <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-2 border-purple-500/40 max-w-xl mx-auto text-right space-y-3 shadow-xl shadow-purple-500/5">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-black text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>تخصيص الشخصيات العربية (ترتيب عشوائي):</span>
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  اختر الفئة المطلوبة
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* 1. مشاهير تواصل اجتماعي */}
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setArabCelebSubFilter('social');
                    setCurrentRoundIndex(0);
                    setShuffleSeed((prev) => prev + 1);
                  }}
                  className={`p-3 rounded-xl border text-right transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center ${
                    arabCelebSubFilter === 'social'
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-md shadow-purple-500/10 font-black ring-1 ring-purple-500/50'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-base">
                    📱
                  </div>
                  <span className="text-xs sm:text-sm font-black">
                    مشاهير تواصل
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {WHO_AM_I_ROUNDS.filter(r => r.categoryId === 'arab_celebs' && r.celebType === 'social').length} شخصية سوشال
                  </span>
                </button>

                {/* 2. مشاهير عامة مكس */}
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setArabCelebSubFilter('mix');
                    setCurrentRoundIndex(0);
                    setShuffleSeed((prev) => prev + 1);
                  }}
                  className={`p-3 rounded-xl border text-right transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center ${
                    arabCelebSubFilter === 'mix'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10 font-black ring-1 ring-amber-500/50'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-base">
                    🌟
                  </div>
                  <span className="text-xs sm:text-sm font-black">
                    مشاهير مكس
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {WHO_AM_I_ROUNDS.filter(r => r.categoryId === 'arab_celebs' && (r.celebType === 'mix' || !r.celebType)).length} فنانين ونجوم
                  </span>
                </button>

                {/* 3. الكل معاً */}
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setArabCelebSubFilter('all');
                    setCurrentRoundIndex(0);
                    setShuffleSeed((prev) => prev + 1);
                  }}
                  className={`p-3 rounded-xl border text-right transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center ${
                    arabCelebSubFilter === 'all'
                      ? 'bg-pink-500/20 border-pink-500 text-pink-300 shadow-md shadow-pink-500/10 font-black ring-1 ring-pink-500/50'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-base">
                    🎲
                  </div>
                  <span className="text-xs sm:text-sm font-black">
                    الكل عشوائي
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {WHO_AM_I_ROUNDS.filter(r => r.categoryId === 'arab_celebs').length} شخصية كاملة
                  </span>
                </button>
              </div>

              <div className="text-[11px] text-center text-purple-200/80 bg-purple-500/10 py-1.5 px-2 rounded-lg border border-purple-500/20">
                {arabCelebSubFilter === 'social' && '✔️ تم ضبط التحدي: مشاهير تواصل اجتماعي (أبو فلة، بندريتا، نارين، غيث، نور ستارز، الودعاني...) بترتيب عشوائي'}
                {arabCelebSubFilter === 'mix' && '✔️ تم ضبط التحدي: مشاهير عامة مكس (الجبير، محمد عبده، إبراهيم الحجاج، الشريان، رابح صقر...) بترتيب عشوائي'}
                {arabCelebSubFilter === 'all' && '✔️ تم ضبط التحدي: تشكيلة عشوائية كاملة تجمع مشاهير السوشال ميديا والمشاهير العامة معاً'}
              </div>
            </div>
          )}

          {/* خيار توضيحي لفئة المسلسلات الأجنبية (مكس شامل عشوائي لجميع المسلسلات في باقة واحدة) */}
          {selectedCategory === 'foreign_series' && (
            <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-2 border-indigo-500/40 max-w-xl mx-auto text-right space-y-2.5 shadow-xl shadow-indigo-500/5">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-black text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>كاتاقوري مكس شامل (ترتيب عشوائي كامل):</span>
                </span>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {WHO_AM_I_ROUNDS.filter(r => r.categoryId === 'foreign_series').length} شخصية مكس
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                تشكيلة موحدة تجمع شخصيات 8 مسلسلات أسطورية بترتيب عشوائي تماماً:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Stranger Things', 'Game of Thrones', 'Friends', 'The Office', 'House of the Dragon', 'Dexter', 'Breaking Bad', 'The Boys'].map((show) => (
                  <span key={show} className="px-2 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-500/30 text-[10px] font-bold text-indigo-200">
                    🎬 {show}
                  </span>
                ))}
              </div>
              <div className="text-[11px] text-center text-indigo-200/90 bg-indigo-500/10 py-1.5 px-2 rounded-lg border border-indigo-500/20 font-medium">
                ⚡ رتم الهنتات: الهنت 1 صعب جداً (30ث) • الهنت 2 متوسط/صعب (20ث) • الهنت 3 سهل ومباشر (10ث)
              </div>
            </div>
          )}

          {/* خيار توضيحي لفئة المسلسلات الخليجية (قائمة الشخصيات الـ 55 ملخبطة عشوائياً برتم ناري) */}
          {selectedCategory === 'khaleeji_series' && (
            <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-2 border-amber-500/40 max-w-xl mx-auto text-right space-y-2.5 shadow-xl shadow-amber-500/5">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-black text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>شخصيات مسلسلات خليجية (ترتيب عشوائي ملخبط كامل):</span>
                </span>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {WHO_AM_I_ROUNDS.filter(r => r.categoryId === 'khaleeji_series').length} شخصية ملخبطة
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                تشكيلة شاملة من أقوى المسلسلات الخليجية الكلاسيكية والحديثة بترتيب عشوائي غير متوقع:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['طاش ما طاش', 'أميمة في دار الأيتام', 'زوارة خميس', 'من شارع الأعشى', 'درب الزلق', 'الحيالة', 'من شارع الهرم إلى...', 'ساهر الليل', 'رمانة', 'محمد علي رود'].map((show) => (
                  <span key={show} className="px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-500/30 text-[10px] font-bold text-amber-200">
                    📺 {show}
                  </span>
                ))}
              </div>
              <div className="text-[11px] text-center text-amber-200/90 bg-amber-500/10 py-1.5 px-2 rounded-lg border border-amber-500/20 font-medium">
                ⚡ رتم ناري: الهنت 1 صعب جداً (30ث) • الهنت 2 متوسط/صعب (20ث) • الهنت 3 سهل ومباشر (10ث)
              </div>
            </div>
          )}

          {/* Tempo Selector Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 max-w-lg mx-auto text-right space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400" />
                <span>رتم وتوقيت التلميحات:</span>
              </span>
              {(selectedCategory === 'football' || selectedCategory === 'arab_celebs' || selectedCategory === 'foreign_series' || selectedCategory === 'khaleeji_series') && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  🔥 رتم سريع ومناسب جداً!
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTempoMode('fast')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  tempoMode === 'fast'
                    ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 border-orange-500 text-orange-300 shadow-md shadow-orange-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="flex items-center gap-1 text-sm font-black">
                  🔥 رتم سريع ومشدود
                </span>
                <span className="text-[10px] text-slate-400">
                  30ث صعب • 20ث متوسط • 10ث سهل
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTempoMode('normal')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  tempoMode === 'normal'
                    ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="flex items-center gap-1 text-sm font-black">
                  ⏱️ رتم هادئ وقياسي
                </span>
                <span className="text-[10px] text-slate-400">
                  60ث صعب • 30ث متوسط • 15ث سهل
                </span>
              </button>
            </div>
          </div>

          {/* Timing & Scoring Rules Box */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 max-w-lg mx-auto text-xs text-slate-300 text-right space-y-2 shadow-inner">
            <div className="font-bold text-amber-400 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>نظام الـ 3 تلميحات بالوقت الإجباري ومستويات الصعوبة:</span>
              </div>
              <span className="text-[11px] font-bold text-orange-400">
                {tempoMode === 'fast' ? '⚡ رتم سريع مفعل' : '⏱️ رتم قياسي'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-rose-500/30">
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 font-bold mb-1">صعب جداً 🔥</span>
                <span className="block text-[11px] text-slate-200 font-bold">التلميح الأول</span>
                <span className="text-base font-black text-amber-400">{getHintDuration(0)} ثانية</span>
                <span className="block text-[10px] text-slate-400">3 نقاط</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-amber-500/30">
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-bold mb-1">متوسط ⚡</span>
                <span className="block text-[11px] text-slate-200 font-bold">التلميح الثاني</span>
                <span className="text-base font-black text-amber-400">{getHintDuration(1)} ثانية</span>
                <span className="block text-[10px] text-slate-400">نقطتان</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-emerald-500/30">
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-bold mb-1">سهل 💡</span>
                <span className="block text-[11px] text-slate-200 font-bold">التلميح الثالث</span>
                <span className="text-base font-black text-amber-400">{getHintDuration(2)} ثانية</span>
                <span className="block text-[10px] text-slate-400">نقطة واحدة</span>
              </div>
            </div>
            {selectedCategory === 'football' && (
              <div className="pt-1 text-[11px] text-amber-300 font-semibold text-center bg-amber-500/10 rounded-lg p-1.5 border border-amber-500/20">
                ⚽ فئة الكورة: الهنت الأول مختصر وصعب (اسم أول مدرب + قصة حرجة أو تغيير مركز تاريخي بدون ذكر النادي!)
              </div>
            )}
          </div>

          {/* Pack System Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/10 border border-amber-500/30 max-w-lg mx-auto text-right space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>نظام الباقة: 10 جولات لكل دفعة 📦</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300">
                الباقة #{currentPackNumber}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedCategory === 'football' && footballSubFilter === 'coaches'
                ? `مخزون المدربين يحتوي على 22 مدرباً عالمياً! تتضمن باقتك الحالية 10 جولات حصرية بدون تكرار. بعد الانتهاء منها، يمكنك شحن 10 جولات تالية ومواصلة التحدي!`
                : selectedCategory === 'football' && footballSubFilter === 'players'
                ? `مخزون اللاعبين يحتوي على 64 لاعباً أسطورياً! تبدأ باقتك الحالية بـ 10 جولات بدون تكرار، مع إمكانية شحن 10 جولات جديدة فور الانتهاء.`
                : `تتضمن باقتك الحالية 10 جولات حصرية مختارة بدون تكرار من أصل ${categoryPool.length} جولة متوفرة. بعد إنهائها، يمكنك شحن 10 جولات تالية مباشرة!`
              }
            </p>

            <div className="flex items-center justify-between pt-1 text-[11px] border-t border-slate-800 text-slate-400">
              <span>
                الملعوب سابقاً: <strong className="text-amber-400">{playedInThisCategoryCount}</strong> من {categoryPool.length}
              </span>
              <span>
                المتبقي في المخزون: <strong className="text-emerald-400">{remainingInThisCategoryCount}</strong> جولة
              </span>
              {playedInThisCategoryCount > 0 && (
                <button
                  type="button"
                  onClick={resetPlayedHistory}
                  className="text-rose-400 hover:text-rose-300 underline font-bold cursor-pointer transition-colors"
                >
                  تصفير السجل
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="who-am-i-start-btn"
              onClick={() => {
                setShuffleSeed((prev) => prev + 1);
                startRound(0);
              }}
              className="px-10 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-lg shadow-2xl shadow-orange-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer font-display inline-flex items-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>ابدأ باقة الـ 10 جولات ({currentPackRounds.length} جولات 🎲)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setShuffleSeed((prev) => prev + 1);
              }}
              title="إعادة خلط وترتيب الجولات عشوائياً"
              className="px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <Shuffle className="w-4 h-4 text-amber-400" />
              <span>خلط الجولات عشوائياً</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= ACTIVE PLAYING / REVEALED SCREEN ================= */}
      {(gameState === 'playing' || gameState === 'revealed') && (
        <div className="my-auto py-4 space-y-4">
          
          {/* Header Info & Dynamic Timer */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                {currentRound.categoryName}
              </span>
              {currentRound.categoryId === 'football' && (
                <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                  (currentRound.footballRole === 'coach' || currentRound.id.startsWith('fb_mgr_'))
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}>
                  {(currentRound.footballRole === 'coach' || currentRound.id.startsWith('fb_mgr_'))
                    ? '👔 مدرب'
                    : '🏃‍♂️ لاعب'}
                </span>
              )}
              {currentRound.categoryId === 'arab_celebs' && (
                <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                  currentRound.celebType === 'social'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {currentRound.celebType === 'social' ? '📱 مشاهير تواصل' : '🌟 مشاهير مكس'}
                </span>
              )}
              <span className="px-3 py-1 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium">
                {currentRound.tag}
              </span>
              <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                tempoMode === 'fast' 
                  ? 'bg-orange-500/15 text-orange-300 border-orange-500/30' 
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {tempoMode === 'fast' ? '🔥 رتم سريع' : '⏱️ رتم قياسي'}
              </span>
            </div>

            {/* Timer Controls & Counter */}
            <div className="flex items-center gap-2">
              {gameState === 'playing' && (
                <button
                  onClick={toggleTimer}
                  title={isTimerRunning ? 'إيقاف مؤقت' : 'استئناف العداد'}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current text-amber-400" />}
                </button>
              )}

              <div className={`flex items-center gap-2 px-3.5 py-1 rounded-full border font-black text-sm transition-all ${
                timeLeft <= 5 && isTimerRunning
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse scale-105' 
                  : 'bg-slate-950 text-amber-400 border-slate-800'
              }`}>
                <Clock className="w-4 h-4 text-amber-400" />
                <span>
                  {timeLeft > 0 ? `${timeLeft} ثانية` : 'انتهى الوقت!'}
                </span>
              </div>
            </div>
          </div>

          {/* Auto Forced Notice Toast */}
          {autoNotice && (
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold text-center flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{autoNotice}</span>
            </div>
          )}

          {/* Hints Progression Indicator */}
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((idx) => {
              const isRevealed = idx <= revealedClueIndex;
              const isCurrent = idx === revealedClueIndex && gameState === 'playing';
              const label = idx === 0 ? 'صعب جداً 🔥' : idx === 1 ? 'متوسط ⚡' : 'سهل 💡';
              const time = `${getHintDuration(idx)}ث`;
              const points = idx === 0 ? '3 نقاط' : idx === 1 ? 'نقطتان' : 'نقطة واحدة';

              return (
                <div
                  key={idx}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    isCurrent
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10 scale-[1.02]'
                      : isRevealed
                      ? 'bg-slate-900 border-slate-700 text-slate-300'
                      : 'bg-slate-950/40 border-slate-900 text-slate-600'
                  }`}
                >
                  <div className="text-[11px] font-bold truncate">
                    التلميح {idx + 1}: {label}
                  </div>
                  <div className="text-[10px] mt-0.5 text-slate-400">
                    ⏱️ {time} • ⭐ {points}
                  </div>
                </div>
              );
            })}
          </div>

          {/* The 3 Clues Cards */}
          <div className="space-y-3">
            {currentRound.clues.map((clue, idx) => {
              const isRevealed = idx <= revealedClueIndex;
              const isCurrent = idx === revealedClueIndex && gameState === 'playing';
              const difficultyBadge = idx === 0 
                ? { text: 'صعب جداً وغموض عالي 🔥', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30' }
                : idx === 1 
                ? { text: 'متوسط ⚡', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' }
                : { text: 'سهل 💡', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };

              return (
                <div
                  key={idx}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 text-right ${
                    isCurrent
                      ? 'bg-slate-900 border-amber-500/60 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/30'
                      : isRevealed
                      ? 'bg-slate-900/90 border-slate-700 text-slate-300'
                      : 'bg-slate-950/40 border-slate-800/40 opacity-40 select-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                        isCurrent 
                          ? 'bg-amber-500 text-slate-950' 
                          : isRevealed 
                          ? 'bg-amber-500/20 text-amber-300' 
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        التلميح {idx + 1}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${difficultyBadge.bg}`}>
                        {difficultyBadge.text}
                      </span>
                      <span className="text-[11px] text-slate-400">المهلة: {getHintDuration(idx)}ث</span>
                    </div>

                    <span className="text-xs font-black px-2 py-0.5 rounded-full bg-slate-800 text-amber-400">
                      {clue.points} {clue.points === 1 ? 'نقطة' : clue.points === 2 ? 'نقطتان' : 'نقاط'}
                    </span>
                  </div>

                  <p className="text-base sm:text-lg font-bold text-slate-100 leading-relaxed">
                    {isRevealed ? clue.text : '••••••••••••••••••••••••••••••••••••••••••••••'}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Active Playing Action Controls */}
          {gameState === 'playing' ? (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {revealedClueIndex < 2 && (
                <button
                  id="who-next-clue-btn"
                  onClick={revealNextClueEarly}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs sm:text-sm border border-slate-700 transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  <span>
                    {revealedClueIndex === 0 
                      ? 'كشف التلميح الثاني [متوسط ⚡] الآن ⏭️' 
                      : 'كشف التلميح الثالث [سهل 💡] الآن ⏭️'}
                  </span>
                </button>
              )}

              <button
                id="who-reveal-answer-btn"
                onClick={handleRevealAnswer}
                className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm sm:text-base shadow-lg shadow-orange-500/20 transition-all cursor-pointer font-display flex items-center gap-2 hover:scale-105 active:scale-95"
              >
                <Eye className="w-5 h-5" />
                <span>كشف الإجابة والشخصية 👁️</span>
              </button>
            </div>
          ) : (
            /* Answer Revealed Card */
            <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/15 via-emerald-500/10 to-slate-900 border-2 border-emerald-500/40 text-center space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black">
                <Check className="w-4 h-4" />
                <span>الإجابة الصحيحة هي:</span>
              </div>

              <h3 className="text-3xl sm:text-5xl font-black text-white font-display">
                {currentRound.character}
              </h3>

              {currentRound.funFact && (
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5">
                  💡 {currentRound.funFact}
                </p>
              )}

              {/* Award Points Quick Bar */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs">
                <span className="text-slate-400">إضافة النقاط للفريق الفائز بالجولة:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => awardPoints('A')}
                    className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/30 transition-colors cursor-pointer"
                  >
                    + فريق أ ({currentRound.clues[revealedClueIndex]?.points || 1} نقاط)
                  </button>
                  <button
                    onClick={() => awardPoints('B')}
                    className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold border border-rose-500/30 transition-colors cursor-pointer"
                  >
                    + فريق ب ({currentRound.clues[revealedClueIndex]?.points || 1} نقاط)
                  </button>
                </div>
              </div>

              {/* Next Round Button */}
              <div className="pt-2">
                <button
                  id="who-next-round-btn"
                  onClick={handleNextRound}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base shadow-xl shadow-emerald-500/20 transition-all cursor-pointer font-display flex items-center justify-center gap-2 mx-auto hover:scale-105 active:scale-95"
                >
                  <span>الجولة التالية</span>
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ================= PACK COMPLETED / END GAME SCREEN ================= */}
      {gameState === 'ended' && (
        <div className="my-auto py-8 text-center space-y-6">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center shadow-2xl shadow-yellow-500/30 text-4xl">
            🏆
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black border border-amber-500/30">
              <span>📦</span>
              <span>أكملتم الباقة #{currentPackNumber} (10 جولات حماسية)</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white font-display">
              انتهت باقة الـ 10 جولات! 🔥
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              خضتم 10 جولات نارية في قسم {
                selectedCategory === 'football' 
                  ? (footballSubFilter === 'players' ? 'كرة قدم (لاعبين فقط)' : footballSubFilter === 'coaches' ? 'كرة قدم (مدربين فقط)' : 'كرة قدم (لاعبين ومدربين)')
                  : selectedCategory === 'arab_celebs'
                  ? (arabCelebSubFilter === 'social' ? 'شخصيات عربية (مشاهير تواصل اجتماعي)' : arabCelebSubFilter === 'mix' ? 'شخصيات عربية (مشاهير عامة مكس)' : 'شخصيات عربية (مشاهير مكس وسوشال)')
                  : WHO_AM_I_CATEGORIES.find((c) => c.id === selectedCategory)?.label
              }!
            </p>
          </div>

          {/* Category Progress Stats Box */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 max-w-md mx-auto text-right space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">
                📊 رصيد جولات هذا القسم:
              </span>
              <span className="text-amber-400 font-black">
                {playedInThisCategoryCount} من أصل {categoryPool.length} جولة
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((playedInThisCategoryCount / categoryPool.length) * 100))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>
                {selectedCategory === 'football' && footballSubFilter === 'coaches'
                  ? `متبقي ${remainingInThisCategoryCount} مدرباً لم تكتشفوهم بعد في المخزون!`
                  : `متبقي ${remainingInThisCategoryCount} جولة جديدة لم تكتشفوها بعد!`
                }
              </span>
              {playedInThisCategoryCount > 0 && (
                <button
                  type="button"
                  onClick={resetPlayedHistory}
                  className="text-rose-400 hover:text-rose-300 underline font-bold cursor-pointer transition-colors"
                >
                  تصفير السجل
                </button>
              )}
            </div>
          </div>

          {/* Result Cards */}
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/40">
              <span className="text-xs text-amber-400 font-bold block">فريق أ</span>
              <span className="text-3xl font-black text-white font-display">{teamScores.teamA}</span>
              <span className="text-xs text-slate-400 block mt-1">نقطة</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-rose-500/40">
              <span className="text-xs text-rose-400 font-bold block">فريق ب</span>
              <span className="text-3xl font-black text-white font-display">{teamScores.teamB}</span>
              <span className="text-xs text-slate-400 block mt-1">نقطة</span>
            </div>
          </div>

          {/* RECHARGE NEXT PACK CARD ("بعدها يدفع ثاني مره تجيه ١٠ وعلى هالحال") */}
          <div className="p-6 rounded-3xl bg-gradient-to-b from-amber-500/15 via-slate-900 to-slate-950 border-2 border-amber-500/50 max-w-md mx-auto text-right space-y-3.5 shadow-2xl shadow-amber-500/10">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs">
                باقة الـ 10 جولات التالية جاهزة ⚡
              </span>
              <span className="text-xs text-amber-300 font-bold">
                {remainingInThisCategoryCount > 0 
                  ? `متبقي ${remainingInThisCategoryCount} شخصية لم تكتشفوها!`
                  : 'ختمتم جميع شخصيات القسم!'}
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-black text-white font-display">
                شحن 10 جولات جديدة (10 جولات بـ {game.price} ر.س) 💳
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedCategory === 'football' && footballSubFilter === 'coaches'
                  ? `خضتم 10 مدربين حتى الآن.. اشحنوا الـ 10 التالية لمواجهة باقي المدربين بدون أي تكرار!`
                  : `تفتح لكم 10 جولات تالية مباشرة من باقي المخزون بدون أي تكرار للشخصيات السابقة!`
                }
              </p>
            </div>

            <button
              onClick={() => setIsRechargeModalOpen(true)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-base shadow-xl shadow-orange-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer font-display flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              <span>ادفع واشحن 10 جولات جديدة ({game.price} ر.س) 🚀</span>
            </button>

            <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400">
              <span>✨ 10 جولات جديدة بدون تكرار</span>
              <span>•</span>
              <span>⚡ تفعيل فوري بـ Apple Pay أو مدى</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={restartCurrentPack}
              className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة لعب نفس الباقة مجاناً</span>
            </button>
            <button
              onClick={() => setGameState('intro')}
              className="px-5 py-2.5 rounded-2xl bg-slate-900 text-slate-300 hover:text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
            >
              اختيار قسم آخر
            </button>
            <button
              onClick={onExit}
              className="px-5 py-2.5 rounded-2xl bg-slate-950 text-slate-400 hover:text-white font-bold text-xs transition-colors cursor-pointer"
            >
              القائمة الرئيسية
            </button>
          </div>
        </div>
      )}

      {/* Payment Success Toast */}
      {paymentSuccessToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 text-sm">
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <span>{paymentSuccessToast}</span>
        </div>
      )}

      {/* ================= RECHARGE MODAL ("شحن 10 جولات جديدة") ================= */}
      {isRechargeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 max-w-md w-full text-right space-y-4 shadow-2xl shadow-amber-500/20 relative">
            <button
              onClick={() => setIsRechargeModalOpen(false)}
              className="absolute top-4 left-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black border border-amber-500/30 inline-block">
                باقة الـ 10 جولات 📦
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white font-display">
                شحن 10 جولات إضافية 💳
              </h3>
              <p className="text-xs text-slate-300">
                الباقة رقم #{currentPackNumber + 1} - 10 جولات جديدة بدون أي تكرار للشخصيات السابقة!
              </p>
            </div>

            {/* Package Details Box */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>القسم المحدد:</span>
                <strong className="text-white">
                  {selectedCategory === 'football' 
                    ? (footballSubFilter === 'coaches' ? 'مدربين فقط (22 مدرب)' : footballSubFilter === 'players' ? 'لاعبين فقط' : 'كرة قدم')
                    : WHO_AM_I_CATEGORIES.find((c) => c.id === selectedCategory)?.label}
                </strong>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>محتوى الباقة:</span>
                <strong className="text-amber-400 font-bold">10 جولات جديدة كلياً</strong>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>المتبقي في المخزون:</span>
                <strong className="text-emerald-400 font-bold">{remainingInThisCategoryCount} جولة متاحة</strong>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-sm">
                <span className="font-bold text-white">المبلغ الإجمالي:</span>
                <strong className="text-lg font-black text-amber-400 font-display">{game.price} ر.س</strong>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 block">اختر وسيلة الدفع:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('apple')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    selectedPaymentMethod === 'apple'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-black'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span> Pay</span>
                  <span>Apple Pay</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('mada')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    selectedPaymentMethod === 'mada'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-black'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>💳</span>
                  <span>مدى (Mada)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('card')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    selectedPaymentMethod === 'card'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-black'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>💳</span>
                  <span>بطاقة ائتمانية</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('bank')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    selectedPaymentMethod === 'bank'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-black'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>🏦</span>
                  <span>تحويل بنكي</span>
                </button>
              </div>

              {/* Bank Transfer Details */}
              {selectedPaymentMethod === 'bank' && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5 text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>البنك:</span>
                    <strong className="text-white">مصرف الراجحي</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>الآيبان (IBAN):</span>
                    <div className="flex items-center gap-1.5">
                      <code className="text-[11px] text-amber-300">SA4480000456608010123456</code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('SA4480000456608010123456');
                          setCopiedIban(true);
                          setTimeout(() => setCopiedIban(false), 2000);
                        }}
                        className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                      >
                        {copiedIban ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
            <button
              disabled={isProcessingPayment}
              onClick={handleProcessRecharge}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-base shadow-xl shadow-orange-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer font-display flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري معالجة الدفع وتفعيل الـ 10 جولات...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-current" />
                  <span>تأكيد الدفع وشحن الـ 10 جولات ({game.price} ر.س)</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>دفع مشفر وآمن 100% • تفعيل فوري ومباشر</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

