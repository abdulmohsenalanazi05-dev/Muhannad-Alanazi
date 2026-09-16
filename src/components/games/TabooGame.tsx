import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, Pause, RotateCcw, Clock, Check, X, SkipForward, 
  ChevronLeft, AlertTriangle, Users, Trophy, Flame,
  QrCode, Eye, EyeOff, Smartphone, Sparkles, HelpCircle, Compass,
  CheckCircle2, CreditCard, Zap, RefreshCw
} from 'lucide-react';
import QRCode from 'qrcode';
import { GameItem, TabooRound } from '../../types';
import { TABOO_ROUNDS } from '../../data/games';
import { soundEngine } from '../../utils/audio';
import { RechargeModal } from '../RechargeModal';

interface TabooGameProps {
  game: GameItem;
  onExit: () => void;
}

const ROUNDS_PER_PACK = 10;

// Helper to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const TabooGame: React.FC<TabooGameProps> = ({ game, onExit }) => {
  const [gameState, setGameState] = useState<'intro' | 'turn_ready' | 'playing' | 'turn_end' | 'pack_completed'>('intro');
  const [currentCardInPackIndex, setCurrentCardInPackIndex] = useState(0);
  const [activeTeam, setActiveTeam] = useState<'A' | 'B'>('A');
  
  // Timer states - DOES NOT start automatically, user controls start!
  const [timeLeft, setTimeLeft] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const [teamScores, setTeamScores] = useState({ teamA: 0, teamB: 0 });
  const [roundStats, setRoundStats] = useState({ correct: 0, fouls: 0, skipped: 0 });

  // Pack System State
  const [currentPackNumber, setCurrentPackNumber] = useState<number>(1);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState<boolean>(false);
  const [paymentSuccessToast, setPaymentSuccessToast] = useState<string | null>(null);
  const [shuffleSeed, setShuffleSeed] = useState(0);

  // Local storage for played taboo cards
  const [playedRoundIds, setPlayedRoundIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('niddak_taboo_played_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('niddak_taboo_played_ids', JSON.stringify(playedRoundIds));
    } catch {}
  }, [playedRoundIds]);

  // Unplayed cards from TABOO_ROUNDS
  const unplayedRounds = useMemo(() => {
    return TABOO_ROUNDS.filter((r) => !playedRoundIds.includes(r.id));
  }, [playedRoundIds]);

  // 10 Cards for current pack
  const currentPackRounds = useMemo(() => {
    const pool = unplayedRounds.length >= ROUNDS_PER_PACK ? unplayedRounds : TABOO_ROUNDS;
    const shuffled = shuffleArray(pool);
    return shuffled.slice(0, Math.min(ROUNDS_PER_PACK, pool.length));
  }, [unplayedRounds, shuffleSeed]);

  const playedCount = useMemo(() => {
    return TABOO_ROUNDS.filter((r) => playedRoundIds.includes(r.id)).length;
  }, [playedRoundIds]);

  const remainingCount = Math.max(0, TABOO_ROUNDS.length - playedCount);

  // Barcode / Privacy states
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [safariUrl, setSafariUrl] = useState<string>('');
  const [isRevealedOnScreen, setIsRevealedOnScreen] = useState(false);
  const [isHoldingPeek, setIsHoldingPeek] = useState(false);

  const currentRound: TabooRound = currentPackRounds[currentCardInPackIndex] || currentPackRounds[0] || TABOO_ROUNDS[0];

  // Generate QR Code that directly opens Safari web page using current origin
  useEffect(() => {
    if (!currentRound) return;
    const origin = window.location.origin;
    const targetUrl = `${origin}/card?w=${encodeURIComponent(currentRound.word)}&f=${encodeURIComponent(currentRound.forbiddenWords.join(','))}&c=${encodeURIComponent(currentRound.categoryName)}${currentRound.hint ? `&h=${encodeURIComponent(currentRound.hint)}` : ''}`;
    
    setSafariUrl(targetUrl);

    QRCode.toDataURL(targetUrl, {
      width: 340,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0c0f17',
        light: '#ffffff'
      }
    })
      .then((dataUrl) => {
        setQrCodeDataUrl(dataUrl);
      })
      .catch((err) => {
        console.error('QR code generation error:', err);
      });
  }, [currentCardInPackIndex, currentRound]);

  // Timer logic - only runs when isTimerRunning is true
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === 'playing' && isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            soundEngine.playBuzzer();
            setIsTimerRunning(false);
            setGameState('turn_end');
            return 0;
          }
          if (prev <= 5) {
            soundEngine.playTick(true);
          } else if (prev % 10 === 0) {
            soundEngine.playTick(false);
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, isTimerRunning, timeLeft]);

  const startTurn = () => {
    setTimeLeft(60);
    setIsTimerRunning(false); // Do not start timer immediately!
    setRoundStats({ correct: 0, fouls: 0, skipped: 0 });
    setIsRevealedOnScreen(false);
    setIsHoldingPeek(false);
    setGameState('playing');
    soundEngine.playClick();
  };

  const handleStartTimer = () => {
    soundEngine.playClick();
    setIsTimerRunning(true);
  };

  const handlePauseTimer = () => {
    soundEngine.playClick();
    setIsTimerRunning(false);
  };

  const handleResetTimer = () => {
    soundEngine.playClick();
    setTimeLeft(60);
  };

  const handleCorrect = () => {
    soundEngine.playCorrect();
    setRoundStats((prev) => ({ ...prev, correct: prev.correct + 1 }));
    if (activeTeam === 'A') {
      setTeamScores((prev) => ({ ...prev, teamA: prev.teamA + 1 }));
    } else {
      setTeamScores((prev) => ({ ...prev, teamB: prev.teamB + 1 }));
    }
    nextWord();
  };

  const handleFoul = () => {
    soundEngine.playBuzzer();
    setRoundStats((prev) => ({ ...prev, fouls: prev.fouls + 1 }));
    if (activeTeam === 'A') {
      setTeamScores((prev) => ({ ...prev, teamA: Math.max(0, prev.teamA - 1) }));
    } else {
      setTeamScores((prev) => ({ ...prev, teamB: Math.max(0, prev.teamB - 1) }));
    }
    nextWord();
  };

  const handleSkip = () => {
    soundEngine.playClick();
    setRoundStats((prev) => ({ ...prev, skipped: prev.skipped + 1 }));
    nextWord();
  };

  const nextWord = () => {
    setIsRevealedOnScreen(false);
    setIsHoldingPeek(false);
    if (currentCardInPackIndex + 1 < currentPackRounds.length) {
      setCurrentCardInPackIndex((prev) => prev + 1);
    } else {
      // 10 Cards completed in this pack!
      setIsTimerRunning(false);
      setGameState('pack_completed');
      soundEngine.playVictory();
    }
  };

  const handleSwitchTeam = () => {
    soundEngine.playClick();
    setIsTimerRunning(false);
    setActiveTeam((prev) => (prev === 'A' ? 'B' : 'A'));
    setGameState('turn_ready');
  };

  const restartCurrentPack = () => {
    setCurrentCardInPackIndex(0);
    setTeamScores({ teamA: 0, teamB: 0 });
    setGameState('turn_ready');
    soundEngine.playClick();
  };

  const resetPlayedHistory = () => {
    soundEngine.playClick();
    setPlayedRoundIds([]);
    setCurrentPackNumber(1);
    setShuffleSeed((prev) => prev + 1);
    setCurrentCardInPackIndex(0);
    setPaymentSuccessToast('تم تصفير سجل الكروت وبدء باقة جديدة بـ 10 كروت طازجة!');
    setTimeout(() => setPaymentSuccessToast(null), 3000);
  };

  const handleConfirmRecharge = () => {
    // Record current pack cards as played
    const justPlayedIds = currentPackRounds.map((r) => r.id);
    setPlayedRoundIds((prev) => Array.from(new Set([...prev, ...justPlayedIds])));
    setCurrentPackNumber((prev) => prev + 1);
    setShuffleSeed((prev) => prev + 1);
    setCurrentCardInPackIndex(0);
    setTeamScores({ teamA: 0, teamB: 0 });
    setGameState('turn_ready');

    setPaymentSuccessToast('تم تأكيد الدفع وتفعيل باقة الـ 10 كروت بنجاح! جاهزون للانطلاق 🔥');
    setTimeout(() => setPaymentSuccessToast(null), 4000);
  };

  // Whether card text is currently visible on screen
  const isCardVisible = isRevealedOnScreen || isHoldingPeek;

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
            <h2 className="text-base sm:text-lg font-black text-white font-display">لا تقولها! (الممنوعات) 🤐</h2>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-black border border-rose-500/30">
              باقة 10 كروت 📦
            </span>
          </div>
          {gameState !== 'intro' && gameState !== 'pack_completed' && (
            <div className="flex items-center justify-center gap-2 mt-0.5">
              <span className="text-xs text-rose-400 font-bold">
                الكرت {currentCardInPackIndex + 1} من {currentPackRounds.length}
              </span>
              <span className="text-[10px] text-slate-400">
                (الباقة #{currentPackNumber}) • دور: {activeTeam === 'A' ? 'الفريق أ' : 'الفريق ب'}
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

      {/* Intro */}
      {gameState === 'intro' && (
        <div className="my-auto py-8 text-center space-y-6">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center shadow-2xl shadow-rose-500/25 text-4xl">
            🤐
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h1 className="text-3xl sm:text-4xl font-black text-white font-display">
              لا تقولها! (الممنوعات)
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              اشرح الكلمة لفريقك بدون ما تنطق أي كلمة من الكلمات الممنوعة!
            </p>
          </div>

          {/* 10-Card Pack System Banner */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 border border-rose-500/30 max-w-lg mx-auto text-right space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>نظام الباقات: 10 كروت في كل دفعة 📦</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-black border border-rose-500/30">
                الباقة #{currentPackNumber}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              تتضمن اللعبة <strong className="text-white">10 كروت ممنوعات في كل باقة</strong> بدون أي تكرار. بعد إكمال الـ 10 كروت، يمكنكم شحن 10 كروت جديدة فوراً لمواصلة اللعب!
            </p>

            {/* Inventory progress */}
            <div className="pt-2 border-t border-rose-500/20 flex items-center justify-between text-[11px] text-slate-400">
              <span>المخزون الإجمالي: {TABOO_ROUNDS.length} كرت</span>
              <span className="text-amber-400 font-bold">المتبقي دون تكرار: {remainingCount} كرت</span>
            </div>
          </div>

          {/* Features Highlights */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 max-w-md mx-auto text-xs text-slate-300 text-right space-y-2">
            <div>• <strong>كرت الإجابة السري:</strong> يفتح بالباركود أو في سفاري بجوال الشارح.</div>
            <div>• <strong>تحكم بالوقت:</strong> عداد 60 ثانية يبدأ بضغطة زر عندما يكون الشارح جاهزاً.</div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              id="taboo-start-btn"
              onClick={() => {
                setActiveTeam('A');
                setGameState('turn_ready');
              }}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-black text-lg shadow-2xl shadow-rose-500/30 transition-all hover:scale-105 cursor-pointer font-display"
            >
              ابدأ باقة الـ 10 كروت (دور الفريق أ) 🔥
            </button>

            {playedCount > 0 && (
              <button
                onClick={resetPlayedHistory}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors p-2 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>تصفير سجل الكروت الملعوبة ({playedCount})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Turn Ready Screen */}
      {gameState === 'turn_ready' && (
        <div className="my-auto py-12 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-900 border border-slate-700 flex items-center justify-center text-3xl">
            📱
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              الكرت {currentCardInPackIndex + 1} من {currentPackRounds.length} (الباقة #{currentPackNumber})
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white font-display">
              دور: {activeTeam === 'A' ? 'الفريق أ' : 'الفريق ب'}
            </h2>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              ادخل الجولة، استعرض الكرت بجوالك أو على الشاشة، ثم اضغط زر بدء الوقت عندما تكون جاهزاً!
            </p>
          </div>

          <button
            id="taboo-start-turn-btn"
            onClick={startTurn}
            className="px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-lg shadow-xl shadow-orange-500/25 hover:scale-105 transition-all cursor-pointer font-display"
          >
            الدخول إلى الكرت والجولة 🚀
          </button>
        </div>
      )}

      {/* Active Taboo Card Playing Screen */}
      {gameState === 'playing' && (
        <div className="my-auto py-3 space-y-4">
          
          {/* Top Control Bar: Category & Dedicated Timer Starter */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
            
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-amber-300">
                قسم: {currentRound.categoryName}
              </span>
              <span className="text-xs text-rose-400 font-bold">
                كرت {currentCardInPackIndex + 1} من 10 (باقة #{currentPackNumber})
              </span>
            </div>

            {/* Timer Display & Action Button */}
            <div className="flex items-center gap-2.5">
              
              {/* Timer Badge */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-black transition-all ${
                timeLeft <= 10 && isTimerRunning
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse' 
                  : isTimerRunning 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-950 text-amber-400 border-slate-800'
              }`}>
                <Clock className="w-4 h-4" />
                <span>{timeLeft} ثانية</span>
                {!isTimerRunning && timeLeft === 60 && (
                  <span className="text-[10px] text-amber-300/80 mr-1">(متوقف)</span>
                )}
              </div>

              {/* Dedicated Start / Pause / Reset Timer Buttons */}
              {!isTimerRunning ? (
                <button
                  id="start-timer-btn"
                  onClick={handleStartTimer}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all cursor-pointer font-display"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>بدء عداد الوقت ⏱️</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePauseTimer}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>إيقاف مؤقت</span>
                  </button>

                  <button
                    onClick={handleResetTimer}
                    title="إعادة ضبط 60 ثانية"
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

            </div>

          </div>

          {/* Main Card: Secret Barcode Mode vs Themed Answer Card */}
          <div className="rounded-3xl bg-slate-900/90 border-2 border-amber-500/40 p-5 sm:p-7 text-center shadow-2xl shadow-amber-500/10 relative overflow-hidden">
            
            {!isCardVisible ? (
              /* Barcode View */
              <div className="space-y-4">
                
                {/* Mobile / Safari Fast Action Bar */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-2.5">
                  <div className="text-xs font-bold text-amber-400">
                    📱 تلعب من الجوال أو تبي تدخل سفاري مباشرة؟
                  </div>
                  {safariUrl && (
                    <a
                      href={safariUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full max-w-sm mx-auto py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer font-display"
                    >
                      <Compass className="w-5 h-5 text-slate-950" />
                      <span>اضغط هنا لفتح الكرت في سفاري (Safari) مباشرة 🧭</span>
                    </a>
                  )}
                  <div className="text-[11px] text-slate-400">
                    (أو امسح الباركود أدناه بكاميرا آيفون آخر)
                  </div>
                </div>

                {/* QR Code Canvas - also clickable! */}
                <div 
                  onClick={() => {
                    if (safariUrl) {
                      window.open(safariUrl, '_blank');
                    }
                  }}
                  title="اضغط للدخول إلى سفاري"
                  className="inline-block p-3.5 sm:p-4 rounded-3xl bg-white shadow-2xl border-4 border-slate-800 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer group relative"
                >
                  {qrCodeDataUrl ? (
                    <>
                      <img
                        src={qrCodeDataUrl}
                        alt="Taboo Secret Barcode"
                        className="w-48 h-48 sm:w-56 sm:h-56 mx-auto block rounded-xl select-none"
                      />
                      <div className="mt-1.5 text-[11px] font-bold text-slate-700 group-hover:text-amber-600 transition-colors">
                        اضغط الباركود لفتح سفاري 👆
                      </div>
                    </>
                  ) : (
                    <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center text-slate-600">
                      جاري تجهيز الباركود...
                    </div>
                  )}
                </div>

                {/* Direct On-Screen Option */}
                <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsRevealedOnScreen(true)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-amber-400" />
                    <span>إظهار الكرت على الشاشة فوراً</span>
                  </button>

                  <button
                    type="button"
                    onMouseDown={() => setIsHoldingPeek(true)}
                    onMouseUp={() => setIsHoldingPeek(false)}
                    onTouchStart={() => setIsHoldingPeek(true)}
                    onTouchEnd={() => setIsHoldingPeek(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-bold border border-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer select-none active:bg-amber-500 active:text-black"
                  >
                    <span>لمحة سريعة (ضغط مطول) 👁️</span>
                  </button>
                </div>

              </div>
            ) : (
              /* Themed Answer Card */
              <div className="space-y-6 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black text-sm">
                      🤐
                    </div>
                    <span className="text-xs font-black text-amber-300">كرت لا تقولها • ندّك (كرت {currentCardInPackIndex + 1}/10)</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsRevealedOnScreen(false);
                      setIsHoldingPeek(false);
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>إخفاء بالباركود مجدداً 🔒</span>
                  </button>
                </div>

                {/* Target Word */}
                <div className="py-3 border-b border-slate-800/80">
                  <span className="text-xs text-amber-400 font-bold block mb-1">الكلمة المطلوب منك تشرحها:</span>
                  <h3 className="text-4xl sm:text-5xl font-black text-amber-300 font-display tracking-wide">
                    {currentRound.word}
                  </h3>
                </div>

                {/* Forbidden Words List */}
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 text-rose-400 text-xs font-black">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>الكلمات الممنوع تنطقها (إياك تقولها!):</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                    {currentRound.forbiddenWords.map((word, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-base sm:text-lg font-bold shadow-inner flex items-center justify-center gap-2"
                      >
                        <span className="text-rose-400 text-sm">🚫</span>
                        <span>{word}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Allowed Hint */}
                {currentRound.hint && (
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 max-w-md mx-auto">
                    💡 <span className="text-amber-400 font-bold">تلميح مسموح:</span> {currentRound.hint}
                  </div>
                )}

              </div>
            )}

          </div>

          {/* Controller Scoring Action Buttons */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <button
              id="taboo-foul-btn"
              onClick={handleFoul}
              className="py-3.5 rounded-2xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-400 hover:text-white border border-rose-800/60 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>ممنوع! (-1)</span>
            </button>

            <button
              id="taboo-skip-btn"
              onClick={handleSkip}
              className="py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <SkipForward className="w-4 h-4" />
              <span>تخطي</span>
            </button>

            <button
              id="taboo-correct-btn"
              onClick={handleCorrect}
              className="py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer font-display"
            >
              <Check className="w-5 h-5" />
              <span>صحيح (+1)</span>
            </button>
          </div>

        </div>
      )}

      {/* Turn End Screen */}
      {gameState === 'turn_end' && (
        <div className="my-auto py-10 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-3xl">
            🔔
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white font-display">
              انتهى الوقت!
            </h2>
            <p className="text-sm text-slate-300">
              نتيجة جولة {activeTeam === 'A' ? 'الفريق أ' : 'الفريق ب'}:
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto text-center">
            <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/30">
              <span className="text-[11px] text-emerald-400 font-bold block">إجابات صحيحة</span>
              <span className="text-xl font-black text-white">{roundStats.correct}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-rose-500/30">
              <span className="text-[11px] text-rose-400 font-bold block">أخطاء ممنوعة</span>
              <span className="text-xl font-black text-white">{roundStats.fouls}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-bold block">تخطي</span>
              <span className="text-xl font-black text-white">{roundStats.skipped}</span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            {currentCardInPackIndex + 1 < currentPackRounds.length ? (
              <button
                onClick={handleSwitchTeam}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-sm shadow-xl shadow-orange-500/20 transition-all cursor-pointer font-display"
              >
                الانتقال إلى {activeTeam === 'A' ? 'الفريق ب' : 'الفريق أ'} (متبقي {currentPackRounds.length - currentCardInPackIndex} كروت) 🔄
              </button>
            ) : (
              <button
                onClick={() => setGameState('pack_completed')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black text-sm shadow-xl shadow-rose-500/20 transition-all cursor-pointer font-display"
              >
                عرض نتائج الباقة (10 كروت) 🏆
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pack Completed Screen (نظام الباقات) */}
      {gameState === 'pack_completed' && (
        <div className="my-auto py-8 text-center space-y-6 max-w-xl mx-auto">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-4xl shadow-xl shadow-amber-500/20">
            🎉
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-black border border-rose-500/30 inline-block">
              أكملتم باقة الـ 10 كروت 🔥
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white font-display">
              انتهت الباقة #{currentPackNumber}!
            </h2>
            <p className="text-sm text-slate-300">
              أكملتم 10 كروت ممنوعات حماسية بين الفريقين. مين الفائز في الجلسة؟
            </p>
          </div>

          {/* Scores comparison */}
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
          <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border-2 border-amber-500/40 text-right space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
                <span>تبون تكملون اللعب؟ اشحنوا 10 كروت جديدة!</span>
              </span>
              <span className="text-sm font-black text-amber-400 font-display">{game.price} ر.س</span>
            </div>
            <p className="text-xs text-slate-300">
              اشحن 10 كروت ممنوعات جديدة كلياً بدون أي تكرار للكروت السابقة! (المتبقي في المخزون: {remainingCount} كرت).
            </p>

            <button
              onClick={() => setIsRechargeModalOpen(true)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-base shadow-xl shadow-orange-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer font-display flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              <span>شحن 10 كروت جديدة ({game.price} ر.س) 💳</span>
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

            <button
              onClick={resetPlayedHistory}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              تصفير السجل والبدء من جديد
            </button>

            <button
              onClick={onExit}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              العودة للقائمة الرئيسية
            </button>
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
        itemLabel="كروت"
        remainingStockCount={remainingCount}
        categoryOrDetails="كروت ممنوعات حصرية"
      />

    </div>
  );
};

