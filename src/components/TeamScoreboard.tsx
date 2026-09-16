import React, { useState } from 'react';
import { Trophy, Plus, Minus, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { soundEngine } from '../utils/audio';

export const TeamScoreboard: React.FC = () => {
  const [team1Name, setTeam1Name] = useState('الفريق أ');
  const [team2Name, setTeam2Name] = useState('الفريق ب');
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const adjustScore = (team: 1 | 2, delta: number) => {
    soundEngine.playClick();
    if (team === 1) {
      setTeam1Score((prev) => Math.max(0, prev + delta));
    } else {
      setTeam2Score((prev) => Math.max(0, prev + delta));
    }
  };

  const handleReset = () => {
    soundEngine.playClick();
    if (window.confirm('هل تريد تصفير نقاط الفريقين؟')) {
      setTeam1Score(0);
      setTeam2Score(0);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-xs transition-all">
      <div className="rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-md overflow-hidden text-right">
        
        {/* Toggle Bar */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs font-bold text-slate-200 hover:bg-slate-800/80 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>لوحة نقاط الجلسة</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] text-amber-300 font-black">
              {team1Score} - {team2Score}
            </span>
          </div>
          {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </button>

        {/* Expanded Controls */}
        {isExpanded && (
          <div className="p-3 border-t border-slate-800/80 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              
              {/* Team 1 */}
              <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
                <input
                  type="text"
                  value={team1Name}
                  onChange={(e) => setTeam1Name(e.target.value)}
                  className="w-full text-center text-xs font-bold text-amber-400 bg-transparent border-b border-slate-700 pb-1 focus:outline-none"
                />
                <div className="text-2xl font-black text-white font-display my-1">{team1Score}</div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <button
                    onClick={() => adjustScore(1, 1)}
                    className="p-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => adjustScore(1, -1)}
                    className="p-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-bold"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Team 2 */}
              <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
                <input
                  type="text"
                  value={team2Name}
                  onChange={(e) => setTeam2Name(e.target.value)}
                  className="w-full text-center text-xs font-bold text-rose-400 bg-transparent border-b border-slate-700 pb-1 focus:outline-none"
                />
                <div className="text-2xl font-black text-white font-display my-1">{team2Score}</div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <button
                    onClick={() => adjustScore(2, 1)}
                    className="p-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => adjustScore(2, -1)}
                    className="p-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-bold"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>

            <div className="flex justify-end">
              <button
                onClick={handleReset}
                className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>تصفير النقاط</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
