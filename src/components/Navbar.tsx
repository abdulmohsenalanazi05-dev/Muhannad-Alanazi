import React from 'react';
import { Volume2, VolumeX, Sparkles, Tv, Gamepad2, ShoppingBag, Palette } from 'lucide-react';
import { soundEngine } from '../utils/audio';
import { BrandLogo, LogoDesignId } from './BrandLogo';

interface NavbarProps {
  currentScreen: 'home' | 'details' | 'play' | 'my-games';
  onNavigate: (screen: 'home' | 'my-games') => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  ownedCount: number;
  selectedLogo: LogoDesignId;
  onOpenLogoSelector?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onNavigate,
  soundEnabled,
  onToggleSound,
  ownedCount,
  selectedLogo,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#0a0d14]/85 backdrop-blur-md border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Brand Logo with dynamic design */}
        <div 
          id="brand-logo"
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 cursor-pointer group select-none"
        >
          <BrandLogo designId={selectedLogo} size="md" />
        </div>

        {/* Gathering Device Tag */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
          <Tv className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>شاشة واحدة تجمعكم بدون غرف ولا تعقيد</span>
        </div>
        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Sound Toggle */}
          <button
            id="sound-toggle-btn"
            onClick={onToggleSound}
            aria-label="تبديل المؤثرات الصوتية"
            title={soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Browse Games Nav */}
          <button
            id="nav-explore-btn"
            onClick={() => onNavigate('home')}
            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentScreen === 'home'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span className="hidden xs:inline">الألعاب</span>
          </button>

          {/* My Games Button */}
          <button
            id="nav-my-games-btn"
            onClick={() => onNavigate('my-games')}
            className={`relative px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              currentScreen === 'my-games'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-orange-500/25'
                : 'bg-slate-800/90 text-white hover:bg-slate-700/90 border border-slate-700'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>ألعابي</span>
            {ownedCount > 0 && (
              <span className={`px-1.5 py-0.5 text-[10px] font-black rounded-full ${
                currentScreen === 'my-games' ? 'bg-black text-amber-300' : 'bg-amber-400 text-black'
              }`}>
                {ownedCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
