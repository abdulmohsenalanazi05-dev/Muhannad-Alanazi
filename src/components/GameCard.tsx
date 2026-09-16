import React from 'react';
import { Users, Clock, Star, Play, ShoppingCart, Eye, Sparkles, CheckCircle2 } from 'lucide-react';
import { GameItem } from '../types';
import { soundEngine } from '../utils/audio';

interface GameCardProps {
  game: GameItem;
  isOwned: boolean;
  onPlay: (game: GameItem) => void;
  onBuy: (game: GameItem) => void;
  onViewDetails: (game: GameItem) => void;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  isOwned,
  onPlay,
  onBuy,
  onViewDetails
}) => {
  return (
    <div 
      id={`game-card-${game.id}`}
      className="group relative flex flex-col rounded-3xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700/80 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/5 overflow-hidden text-right"
    >
      {/* Game Visual Cover / Art Header */}
      <div 
        onClick={() => {
          soundEngine.playClick();
          if (game.id === 'trivia-clash') {
            onBuy(game);
          } else {
            onViewDetails(game);
          }
        }}
        className={`relative h-48 sm:h-52 w-full bg-gradient-to-br ${game.gradient} p-5 flex flex-col justify-between cursor-pointer overflow-hidden`}
      >
        {/* Decorative graphic patterns */}
        <div className="absolute inset-0 bg-black/20 backdrop-brightness-95 group-hover:bg-black/10 transition-colors" />
        <div className="absolute -right-6 -bottom-6 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
        
        {/* Top Badges */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          {game.badge ? (
            <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-amber-300 text-xs font-black shadow-md border border-white/10">
              {game.badge}
            </span>
          ) : <span />}

          {isOwned ? (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/90 text-slate-950 text-xs font-black flex items-center gap-1 shadow-md">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>مملوكة</span>
            </span>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md text-amber-300 text-xs font-bold border border-white/10">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{game.rating}</span>
            </div>
          )}
        </div>

        {/* Center Title overlay on cover */}
        <div className="relative z-10">
          <span className="text-[11px] font-bold text-white/80 bg-black/30 px-2.5 py-0.5 rounded-full inline-block mb-1.5 backdrop-blur-sm">
            {game.difficulty}
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight leading-snug drop-shadow-md">
            {game.title}
          </h3>
          <p className="text-xs text-white/90 line-clamp-1 mt-0.5 drop-shadow">
            {game.tagline}
          </p>
        </div>

        {/* Hover preview eye hint */}
        <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
          <span className="px-4 py-2 rounded-xl bg-white text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-xl">
            <Eye className="w-4 h-4" />
            <span>عرض تفاصيل اللعبة</span>
          </span>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
            {game.description}
          </p>

          {/* Quick Specs: Players & Duration */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300 font-medium">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{game.players}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{game.duration}</span>
            </div>
          </div>
        </div>

        {/* Price & Action */}
        <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
          {/* Price Tag */}
          <div>
            {isOwned ? (
              <span className="text-xs font-bold text-emerald-400">جاهزة للعب في أي وقت</span>
            ) : game.id === 'trivia-clash' ? (
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[11px] text-slate-400">تبدأ من</span>
                  <span className="text-xl font-black text-white font-display">14</span>
                  <span className="text-xs font-bold text-emerald-400">ريال</span>
                </div>
                <span className="block text-[10px] text-emerald-400/90 font-bold">
                  3 باقات (10 / 15 / 20 سؤالاً)
                </span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-white font-display">
                  {game.price}
                </span>
                <span className="text-xs font-bold text-amber-400">ريال</span>
                {game.originalPrice && (
                  <span className="text-xs text-slate-500 line-through mr-1">
                    {game.originalPrice} ر.س
                  </span>
                )}
              </div>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-2">
            {isOwned ? (
              <button
                id={`play-owned-btn-${game.id}`}
                onClick={() => {
                  soundEngine.playClick();
                  onPlay(game);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>العب الآن</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  id={`details-btn-${game.id}`}
                  onClick={() => {
                    soundEngine.playClick();
                    onViewDetails(game);
                  }}
                  title="عرض تفاصيل اللعبة وقواعدها"
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                </button>

                <button
                  id={`buy-btn-${game.id}`}
                  onClick={() => {
                    soundEngine.playClick();
                    onBuy(game);
                  }}
                  className={`px-4 py-2.5 rounded-xl text-slate-950 font-black text-xs sm:text-sm transition-all shadow-md flex items-center gap-1.5 cursor-pointer font-display ${
                    game.id === 'trivia-clash'
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-400 hover:to-teal-400 shadow-emerald-500/20'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-orange-500/20'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>{game.id === 'trivia-clash' ? 'اختيار الباقة 📦' : 'اشترِ والعب'}</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
