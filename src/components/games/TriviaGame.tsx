import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, RotateCcw, Clock, Check, X, ChevronLeft, 
  HelpCircle, Eye, Trophy, Sparkles, BookOpen, CheckCircle2,
  CreditCard, Zap, RefreshCw, BarChart2
} from 'lucide-react';
import { GameItem, TriviaQuestion } from '../../types';
import { TRIVIA_QUESTIONS } from '../../data/games';
import { soundEngine } from '../../utils/audio';
import { RechargeModal } from '../RechargeModal';

interface TriviaGameProps {
  game: GameItem;
  onExit: () => void;
  initialPackSize?: number;
}

// Default pack size is 15 questions per pack (options: 10, 15, 20)
const DEFAULT_PACK_SIZE = 15;

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const TriviaGame: React.FC<TriviaGameProps> = ({ game, onExit, initialPackSize }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(25);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [teamScores, setTeamScores] = useState({ teamA: 0, teamB: 0 });
  const [isEnded, setIsEnded] = useState(false);

  // Pack System State (10, 15, or 20 questions pack)
  const [packSize, setPackSize] = useState<number>(() => {
    if (initialPackSize && [10, 15, 20].includes(initialPackSize)) {
      return initialPackSize;
    }
    try {
      const saved = localStorage.getItem('niddak_pack_size_trivia-clash');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (parsed === 10 || parsed === 15 || parsed === 20) return parsed;
      }
    } catch {}
    return DEFAULT_PACK_SIZE;
  });

  useEffect(() => {
    if (initialPackSize && [10, 15, 20].includes(initialPackSize)) {
      setPackSize(initialPackSize);
    }
  }, [initialPackSize]);

  const [currentPackNumber, setCurrentPackNumber] = useState<number>(1);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState<boolean>(false);
  const [paymentSuccessToast, setPaymentSuccessToast] = useState<string | null>(null);
  const [shuffleSeed, setShuffleSeed] = useState(0);

  // Local storage for played trivia questions
  const [playedQuestionIds, setPlayedQuestionIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('niddak_trivia_played_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('niddak_trivia_played_ids', JSON.stringify(playedQuestionIds));
    } catch {}
  }, [playedQuestionIds]);

  const handlePackSizeChange = (newSize: number) => {
    soundEngine.playClick();
    setPackSize(newSize);
    try {
      localStorage.setItem('niddak_pack_size_trivia-clash', String(newSize));
    } catch {}
    setCurrentQuestionIndex(0);
    setIsRevealed(false);
    setSelectedOptionIndex(null);
    setTimeLeft(25);
    setIsTimerRunning(true);
    setPaymentSuccessToast(`تم تفعيل باقة الـ ${newSize} سؤالاً بنجاح! 🎯`);
    setTimeout(() => setPaymentSuccessToast(null), 2500);
  };

  const unplayedQuestions = useMemo(() => {
    return TRIVIA_QUESTIONS.filter((q) => !playedQuestionIds.includes(q.id));
  }, [playedQuestionIds]);

  const currentPackQuestions = useMemo(() => {
    const pool = unplayedQuestions.length >= packSize ? unplayedQuestions : TRIVIA_QUESTIONS;
    const shuffled = shuffleArray(pool);
    return shuffled.slice(0, Math.min(packSize, pool.length));
  }, [unplayedQuestions, shuffleSeed, packSize]);

  const playedCount = useMemo(() => {
    return TRIVIA_QUESTIONS.filter((q) => playedQuestionIds.includes(q.id)).length;
  }, [playedQuestionIds]);

  const remainingCount = Math.max(0, TRIVIA_QUESTIONS.length - playedCount);

  const currentQ: TriviaQuestion = currentPackQuestions[currentQuestionIndex] || currentPackQuestions[0] || TRIVIA_QUESTIONS[0];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0 && !isRevealed && !isEnded) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            soundEngine.playBuzzer();
            setIsTimerRunning(false);
            return 0;
          }
          if (prev <= 5) soundEngine.playTick(true);
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, isRevealed, isEnded]);

  const startQuestion = (qIdx: number) => {
    setCurrentQuestionIndex(qIdx);
    setIsRevealed(false);
    setSelectedOptionIndex(null);
    setTimeLeft(25);
    setIsTimerRunning(true);
    soundEngine.playClick();
  };

  const handleSelectOption = (idx: number) => {
    if (isRevealed) return;
    setSelectedOptionIndex(idx);
    setIsRevealed(true);
    setIsTimerRunning(false);

    if (idx === currentQ.correctAnswerIndex) {
      soundEngine.playCorrect();
    } else {
      soundEngine.playBuzzer();
    }
  };

  const handleDirectReveal = () => {
    setIsRevealed(true);
    setIsTimerRunning(false);
    soundEngine.playCorrect();
  };

  const handleNextQuestion = () => {
    soundEngine.playClick();
    if (currentQuestionIndex + 1 < currentPackQuestions.length) {
      startQuestion(currentQuestionIndex + 1);
    } else {
      setIsEnded(true);
      setIsTimerRunning(false);
      soundEngine.playVictory();
    }
  };

  const awardPoints = (team: 'A' | 'B') => {
    soundEngine.playCorrect();
    if (team === 'A') {
      setTeamScores((prev) => ({ ...prev, teamA: prev.teamA + 2 }));
    } else {
      setTeamScores((prev) => ({ ...prev, teamB: prev.teamB + 2 }));
    }
  };

  const restartCurrentPack = () => {
    setIsEnded(false);
    setTeamScores({ teamA: 0, teamB: 0 });
    startQuestion(0);
  };

  const resetPlayedHistory = () => {
    soundEngine.playClick();
    setPlayedQuestionIds([]);
    setCurrentPackNumber(1);
    setShuffleSeed((prev) => prev + 1);
    setIsEnded(false);
    setTeamScores({ teamA: 0, teamB: 0 });
    startQuestion(0);
    setPaymentSuccessToast(`تم تصفير سجل الأسئلة وبدء باقة جديدة بـ ${packSize} سؤالاً طازجاً!`);
    setTimeout(() => setPaymentSuccessToast(null), 3000);
  };

  const handleConfirmRecharge = (newCount?: number) => {
    const effectiveSize = newCount || packSize;
    if (newCount && newCount !== packSize) {
      setPackSize(newCount);
      try {
        localStorage.setItem('niddak_pack_size_trivia-clash', String(newCount));
      } catch {}
    }

    // Record current pack questions as played
    const justPlayedIds = currentPackQuestions.map((q) => q.id);
    setPlayedQuestionIds((prev) => Array.from(new Set([...prev, ...justPlayedIds])));
    setCurrentPackNumber((prev) => prev + 1);
    setShuffleSeed((prev) => prev + 1);
    setIsEnded(false);
    setTeamScores({ teamA: 0, teamB: 0 });
    startQuestion(0);

    setPaymentSuccessToast(`تم تأكيد الدفع وتفعيل باقة الـ ${effectiveSize} سؤالاً بنجاح! جاهزون للمنافسة 🔥`);
    setTimeout(() => setPaymentSuccessToast(null), 4000);
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-between max-w-4xl mx-auto p-4 sm:p-6 text-right">
      
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <button
          onClick={onExit}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 rotate-180" />
          <span>خروج</span>
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5">
            <h2 className="text-base sm:text-lg font-black text-white font-display">حرب المعلومات 🧠</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-black border border-emerald-500/30">
              باقة {packSize} سؤالاً {packSize === 15 ? '🔥' : '⚡'}
            </span>
          </div>
          {!isEnded && (
            <div className="flex flex-col items-center justify-center gap-0.5 mt-0.5">
              <div className="flex items-center justify-center gap-1.5 text-xs">
                <span className="text-emerald-400 font-bold">
                  السؤال {currentQuestionIndex + 1} من {currentPackQuestions.length}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-300 font-black">
                  متبقي {Math.max(0, currentPackQuestions.length - (currentQuestionIndex + 1))} جولة بالباقة
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span>(الباقة #{currentPackNumber})</span>
                <span>•</span>
                <span className="text-slate-300">
                  مخزون اللعبة: <strong className="text-emerald-400 font-bold">{remainingCount}</strong> سؤالاً متبقياً بدون تكرار 🎯
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Controls: Pack Size Switcher & Live Score */}
        <div className="flex items-center gap-2">
          {/* Pack Size Switcher */}
          <div className="hidden sm:flex items-center p-0.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px]">
            <button
              onClick={() => handlePackSizeChange(10)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                packSize === 10
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="10 أسئلة لكل باقة (14 ر.س)"
            >
              10 أسئلة
            </button>
            <button
              onClick={() => handlePackSizeChange(15)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                packSize === 15
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="15 سؤالاً لكل باقة (19 ر.س - الأكثر طلباً)"
            >
              <span>15 سؤالاً</span>
              <span>🔥</span>
            </button>
            <button
              onClick={() => handlePackSizeChange(20)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                packSize === 20
                  ? 'bg-emerald-400 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="20 سؤالاً لكل باقة (24 ر.س - ماراثون)"
            >
              <span>20 سؤالاً</span>
              <span>🏆</span>
            </button>
          </div>

          {/* Live Score */}
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-bold">
            <span className="text-amber-400">فريق أ: {teamScores.teamA}</span>
            <span className="text-slate-600">|</span>
            <span className="text-rose-400">فريق ب: {teamScores.teamB}</span>
          </div>
        </div>
      </div>

      {/* Live Pack Question Progress Bar */}
      {!isEnded && (
        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800/80 p-0.5 shadow-inner">
          <div 
            className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 h-full rounded-full transition-all duration-300 shadow-sm shadow-emerald-500/50"
            style={{ width: `${Math.min(100, Math.max(5, ((currentQuestionIndex + 1) / currentPackQuestions.length) * 100))}%` }}
          />
        </div>
      )}

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
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-4xl shadow-xl shadow-emerald-500/20">
            🧠
          </div>

          <div className="space-y-2">
            <span className="px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/30 inline-block">
              أكملتم باقة الـ {packSize} سؤالاً 🔥
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white font-display">
              انتهت باقة الأسئلة #{currentPackNumber}!
            </h2>
            <p className="text-sm text-slate-300">
              كفو والله! منافسة نارية، مين طلع أذكى واحد في الجلسة؟
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

          {/* Inventory & Remaining Rounds Stats Card */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-right space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-bold flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
                <span>تقرير الجولات والمخزون المتبقي لحرب المعلومات:</span>
              </span>
              <span className="text-emerald-400 font-black">
                {remainingCount} سؤالاً متبقياً بدون تكرار
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="block text-[10px] text-slate-400">لعبتم حتى الآن</span>
                <span className="text-sm font-black text-amber-300 font-display">{playedCount} سؤالاً</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <span className="block text-[10px] text-emerald-300">المتبقي في المخزون</span>
                <span className="text-sm font-black text-emerald-400 font-display">{remainingCount} سؤالاً</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="block text-[10px] text-slate-400">باقات جاهزة للشحن</span>
                <span className="text-sm font-black text-white font-display">
                  {Math.max(1, Math.floor(remainingCount / packSize))} باقات
                </span>
              </div>
            </div>
          </div>

          {/* Recharge Call to Action Box */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-emerald-500/15 border-2 border-emerald-500/40 text-right space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400" />
                <span>تبون تكملون التحدي؟ اشحنوا {packSize} سؤالاً جديدة!</span>
              </span>
              <span className="text-sm font-black text-emerald-400 font-display">
                {packSize === 10 ? 14 : packSize === 20 ? 24 : 19} ر.س
              </span>
            </div>
            <p className="text-xs text-slate-300">
              اشحن باقة أسئلة معلومات عامة جديدة كلياً بدون أي تكرار للأسئلة السابقة! (المتبقي في المخزون: {remainingCount} سؤال).
            </p>

            <button
              onClick={() => setIsRechargeModalOpen(true)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer font-display flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              <span>
                شحن باقة جديدة ({packSize} أسئلة - {packSize === 10 ? 14 : packSize === 20 ? 24 : 19} ر.س) 💳
              </span>
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
                <span>تصفير السجل ({playedCount} سؤال)</span>
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
        /* Question Screen */
        <div className="my-auto py-6 space-y-6">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                {currentQ.categoryName}
              </span>
              {currentQ.difficulty && (
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
                  currentQ.difficulty === 'easy' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                  currentQ.difficulty === 'medium' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                  currentQ.difficulty === 'hard' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                  'bg-purple-500/20 text-purple-300 border-purple-500/30'
                }`}>
                  {currentQ.difficulty === 'easy' ? '🟢 خفيف وسهل' :
                   currentQ.difficulty === 'medium' ? '🟡 متوسط' :
                   currentQ.difficulty === 'hard' ? '🔴 دسم وصعب' :
                   '🟣 غرائب ومعلومات نادرة'}
                </span>
              )}

              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-900 text-emerald-300 border border-slate-800">
                متبقي {Math.max(0, currentPackQuestions.length - (currentQuestionIndex + 1))} جولة
              </span>
            </div>

            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-black ${
              timeLeft <= 5 
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse' 
                : 'bg-slate-900 text-amber-400 border-slate-800'
            }`}>
              <Clock className="w-4 h-4" />
              <span>{timeLeft} ثانية</span>
            </div>
          </div>

          {/* Question Box */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 text-center shadow-xl space-y-2.5">
            <div className="flex items-center justify-center gap-2 text-xs font-bold">
              <span className="text-slate-400">
                السؤال {currentQuestionIndex + 1} من {currentPackQuestions.length}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-300 font-black">
                متبقي {Math.max(0, currentPackQuestions.length - (currentQuestionIndex + 1))} جولة في هذه الباقة
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="text-slate-400 hidden sm:inline text-[11px]">
                (المخزون الإجمالي: {remainingCount} سؤال)
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white font-display leading-relaxed">
              {currentQ.question}
            </h3>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQ.options.map((option, idx) => {
              const isCorrect = idx === currentQ.correctAnswerIndex;
              const isSelected = idx === selectedOptionIndex;

              let btnStyle = 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-200';
              if (isRevealed) {
                if (isCorrect) {
                  btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/10';
                } else if (isSelected) {
                  btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-300';
                } else {
                  btnStyle = 'bg-slate-950/40 border-slate-900 text-slate-500';
                }
              }

              return (
                <button
                  key={idx}
                  id={`trivia-option-${idx}`}
                  disabled={isRevealed}
                  onClick={() => handleSelectOption(idx)}
                  className={`p-4 rounded-2xl border text-right font-bold text-sm sm:text-base transition-all flex items-center justify-between gap-3 cursor-pointer ${btnStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-slate-800 flex items-center justify-center text-xs text-amber-400 font-black shrink-0">
                      {idx === 0 ? 'أ' : idx === 1 ? 'ب' : idx === 2 ? 'ج' : 'د'}
                    </span>
                    <span>{option}</span>
                  </div>
                  {isRevealed && isCorrect && <Check className="w-5 h-5 text-emerald-400 shrink-0" />}
                  {isRevealed && isSelected && !isCorrect && <X className="w-5 h-5 text-rose-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Explanation Factoid */}
          {isRevealed && currentQ.explanation && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-right space-y-1 animate-in fade-in">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>معلومة على الطاير:</span>
              </span>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {currentQ.explanation}
              </p>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            {!isRevealed ? (
              <button
                id="trivia-reveal-btn"
                onClick={handleDirectReveal}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-sm border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>كشف الإجابة مباشرة</span>
              </button>
            ) : (
              <div className="w-full sm:w-auto flex items-center gap-2 text-xs">
                <span className="text-slate-400">إضافة نقطتين:</span>
                <button
                  onClick={() => awardPoints('A')}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 cursor-pointer"
                >
                  + فريق أ
                </button>
                <button
                  onClick={() => awardPoints('B')}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 cursor-pointer"
                >
                  + فريق ب
                </button>
              </div>
            )}

            {isRevealed && (
              <button
                id="trivia-next-btn"
                onClick={handleNextQuestion}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer font-display"
              >
                <span>{currentQuestionIndex + 1 < currentPackQuestions.length ? 'السؤال التالي' : 'إنهاء الباقة واستعراض النتائج 🏆'}</span>
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
        itemLabel="أسئلة"
        remainingStockCount={remainingCount}
        categoryOrDetails="معلومات وثقافة عامة"
        packCount={packSize}
        allowCountToggle={true}
      />

    </div>
  );
};

