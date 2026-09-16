import React from 'react';
import { Play, Sparkles, ShoppingBag, ArrowRight, Tv, Users, Clock, CheckCircle2 } from 'lucide-react';
import { GameItem } from '../types';
import { soundEngine } from '../utils/audio';

interface MyGamesViewProps {
  ownedGames: GameItem[];
  onPlayGame: (game: GameItem) => void;
  onExploreMore: () => void;
}

export const MyGamesView: React.FC<MyGamesViewProps> = ({
  ownedGames,
  onPlayGame,
  onExploreMore
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-right">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
            </div>
            <h1 className="text-3xl font-black text-white font-display">ألعابي المشتراة</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-400 text-xs font-bold border border-slate-700">
              {ownedGames.length} ألعاب جاهزة
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1.5">
            ألعابك ملكك دائماً بدون اشتراك شهري. اضغط «ابدأ اللعب» في أي جلسة واستمتعوا مباشرة!
          </p>
        </div>

        <button
          onClick={() => {
            soundEngine.playClick();
            onExploreMore();
          }}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span>تصفح وشراء المزيد من الألعاب</span>
          <ArrowRight className="w-4 h-4 rotate-180" />
        </button>
      </div>

      {/* Gathering Tips Banner */}
      <div className="my-6 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-2.5">
          <Tv className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>نصيحة للجلسة: ارمِ شاشة المتصفح على التلفزيون أو ضع التابلت بوسط المجلس لتجربة ممتعة للجميع!</span>
        </div>
        <span className="text-amber-400 font-semibold shrink-0">بدون كودات أو تسجيل دخول لكل لاعب</span>
      </div>

      {/* Games List or Empty State */}
      {ownedGames.length === 0 ? (
        <div className="py-20 text-center space-y-5 bg-slate-900/30 border border-slate-800/60 rounded-3xl p-8">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-800/80 flex items-center justify-center text-3xl">
            🎲
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">لم تشترِ أي لعبة بعد</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
              اختر لعبتك الأولى من المتجر بضغطة زر واحدة وابدأ اللعب مع جماعتك خلال ثوانٍ!
            </p>
          </div>
          <button
            onClick={() => {
              soundEngine.playClick();
              onExploreMore();
            }}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-sm transition-all shadow-lg shadow-orange-500/20 cursor-pointer font-display"
          >
            استكشف ألعاب ندّك
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ownedGames.map((game) => (
            <div
              key={game.id}
              id={`my-game-item-${game.id}`}
              className="flex flex-col rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 transition-all overflow-hidden shadow-xl"
            >
              {/* Cover */}
              <div className={`p-6 bg-gradient-to-br ${game.gradient} text-white relative`}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-1 rounded-full bg-slate-950/80 text-emerald-300 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>متاحة للعب</span>
                  </span>
                  <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                    {game.difficulty}
                  </span>
                </div>
                <h3 className="text-2xl font-black font-display text-white">{game.title}</h3>
                <p className="text-xs text-white/90 line-clamp-1 mt-1">{game.tagline}</p>
              </div>

              {/* Specs */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">اللاعبين المناسبين:</span>
                    <span className="font-bold flex items-center gap-1 text-white">
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      {game.players}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">مدة الجلسة التقديرية:</span>
                    <span className="font-bold flex items-center gap-1 text-white">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      {game.duration}
                    </span>
                  </div>
                </div>

                {/* Big Action button: «ابدأ اللعب» */}
                <button
                  id={`start-play-${game.id}`}
                  onClick={() => {
                    soundEngine.playClick();
                    onPlayGame(game);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-base transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer font-display"
                >
                  <Play className="w-5 h-5 fill-slate-950" />
                  <span>ابدأ اللعب الآن</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
