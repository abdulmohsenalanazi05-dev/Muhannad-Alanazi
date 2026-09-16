import React, { useState, useEffect } from 'react';
import { GameItem, CategoryId } from './types';
import { GAMES } from './data/games';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { CategoryFilter } from './components/CategoryFilter';
import { GameCard } from './components/GameCard';
import { GameDetailsModal } from './components/GameDetailsModal';
import { CheckoutModal } from './components/CheckoutModal';
import { TriviaPacksModal } from './components/TriviaPacksModal';
import { MyGamesView } from './components/MyGamesView';
import { ActiveGameRunner } from './components/games/ActiveGameRunner';
import { TabooSecretCardView } from './components/games/TabooSecretCardView';
import { TeamScoreboard } from './components/TeamScoreboard';
import { Footer } from './components/Footer';
import { soundEngine } from './utils/audio';
import { LogoDesignId, LOGO_OPTIONS } from './components/BrandLogo';
import { LogoSelectorModal } from './components/LogoSelectorModal';
import { Sparkles, Tv, Gamepad2, ArrowRight, Palette, Check } from 'lucide-react';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'my-games' | 'play'>('home');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  
  // Modals state
  const [detailsGame, setDetailsGame] = useState<GameItem | null>(null);
  const [checkoutGame, setCheckoutGame] = useState<GameItem | null>(null);
  const [activePlayGame, setActivePlayGame] = useState<GameItem | null>(null);
  const [isLogoSelectorOpen, setIsLogoSelectorOpen] = useState(false);
  const [isTriviaPacksOpen, setIsTriviaPacksOpen] = useState(false);
  const [selectedTriviaPackSize, setSelectedTriviaPackSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('niddak_pack_size_trivia-clash');
      if (saved && ['10', '15', '20'].includes(saved)) {
        return parseInt(saved, 10);
      }
    } catch {}
    return 15;
  });

  // Logo selection state (persisted)
  const [selectedLogo, setSelectedLogo] = useState<LogoDesignId>(() => {
    try {
      const saved = localStorage.getItem('niddak_chosen_logo') as LogoDesignId;
      if (saved && ['bold-kufic', 'modern-athletic', 'minimal-stacked', 'flowing-calligraphy'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'bold-kufic';
  });

  useEffect(() => {
    try {
      localStorage.setItem('niddak_chosen_logo', selectedLogo);
    } catch {}
  }, [selectedLogo]);

  // Scanned Taboo Secret Card data (when scanned via phone QR scanner)
  const [secretCardData, setSecretCardData] = useState<{
    word: string;
    forbiddenWords: string[];
    categoryName?: string;
    hint?: string;
  } | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      
      if (params.has('taboo_word')) {
        return {
          word: params.get('taboo_word') || '',
          forbiddenWords: (params.get('taboo_forbidden') || '').split('|'),
          categoryName: params.get('taboo_category') || undefined,
          hint: params.get('taboo_hint') || undefined,
        };
      }
      
      if (hash.includes('taboo-secret')) {
        const hashParams = new URLSearchParams(hash.split('?')[1] || '');
        if (hashParams.has('w')) {
          return {
            word: decodeURIComponent(hashParams.get('w') || ''),
            forbiddenWords: decodeURIComponent(hashParams.get('f') || '').split('|'),
            categoryName: decodeURIComponent(hashParams.get('c') || ''),
            hint: hashParams.get('h') ? decodeURIComponent(hashParams.get('h') || '') : undefined,
          };
        }
      }
    } catch {}
    return null;
  });

  // Listen for hash changes (e.g. scanning a new card while on mobile)
  useEffect(() => {
    const handleHashOrPopState = () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(window.location.search);
      if (params.has('taboo_word')) {
        setSecretCardData({
          word: params.get('taboo_word') || '',
          forbiddenWords: (params.get('taboo_forbidden') || '').split('|'),
          categoryName: params.get('taboo_category') || undefined,
          hint: params.get('taboo_hint') || undefined,
        });
      } else if (hash.includes('taboo-secret')) {
        const hashParams = new URLSearchParams(hash.split('?')[1] || '');
        if (hashParams.has('w')) {
          setSecretCardData({
            word: decodeURIComponent(hashParams.get('w') || ''),
            forbiddenWords: decodeURIComponent(hashParams.get('f') || '').split('|'),
            categoryName: decodeURIComponent(hashParams.get('c') || ''),
            hint: hashParams.get('h') ? decodeURIComponent(hashParams.get('h') || '') : undefined,
          });
        }
      }
    };

    window.addEventListener('hashchange', handleHashOrPopState);
    return () => window.removeEventListener('hashchange', handleHashOrPopState);
  }, []);

  // Sound preference state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(soundEngine.enabled);

  // Owned/Purchased Games (persisted in localStorage)
  const [ownedGameIds, setOwnedGameIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('niddak_owned_game_ids');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    // Default unlocked game to let the user play right away
    return ['who-am-i'];
  });

  // Persist owned games whenever changed
  useEffect(() => {
    try {
      localStorage.setItem('niddak_owned_game_ids', JSON.stringify(ownedGameIds));
    } catch {}
  }, [ownedGameIds]);

  const toggleSound = () => {
    const newState = soundEngine.toggleSound();
    setSoundEnabled(newState);
  };

  // Filter games based on category
  const filteredGames = selectedCategory === 'all'
    ? GAMES
    : GAMES.filter((g) => g.category === selectedCategory);

  const ownedGamesList = GAMES.filter((g) => ownedGameIds.includes(g.id));

  // Handler to purchase game
  const handleStartPurchase = (game: GameItem) => {
    setDetailsGame(null);
    if (game.id === 'trivia-clash') {
      setIsTriviaPacksOpen(true);
      return;
    }
    setCheckoutGame(game);
  };

  // Handler when purchase succeeds
  const handlePurchaseSuccess = (game: GameItem) => {
    if (!ownedGameIds.includes(game.id)) {
      setOwnedGameIds((prev) => [...prev, game.id]);
    }
    setCheckoutGame(null);
    setActivePlayGame(game);
    setCurrentScreen('play');
  };

  // Handler to directly play game
  const handlePlayGame = (game: GameItem) => {
    setDetailsGame(null);
    if (game.id === 'trivia-clash') {
      setIsTriviaPacksOpen(true);
      return;
    }
    setActivePlayGame(game);
    setCurrentScreen('play');
  };

  // Scroll to games catalog
  const scrollToGames = () => {
    const el = document.getElementById('games-catalog-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // If user scanned a secret card on mobile, show the mobile secret card view
  if (secretCardData) {
    return (
      <TabooSecretCardView
        word={secretCardData.word}
        forbiddenWords={secretCardData.forbiddenWords}
        categoryName={secretCardData.categoryName}
        hint={secretCardData.hint}
        onClose={() => {
          setSecretCardData(null);
          window.location.hash = '';
          const url = new URL(window.location.href);
          url.searchParams.delete('taboo_word');
          url.searchParams.delete('taboo_forbidden');
          url.searchParams.delete('taboo_category');
          url.searchParams.delete('taboo_hint');
          window.history.replaceState({}, '', url.pathname);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0f17] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
      
      {/* Navbar (visible on home and my-games screens) */}
      {currentScreen !== 'play' && (
        <Navbar
          currentScreen={currentScreen}
          onNavigate={(screen) => {
            soundEngine.playClick();
            setCurrentScreen(screen);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          ownedCount={ownedGamesList.length}
          selectedLogo={selectedLogo}
          onOpenLogoSelector={() => setIsLogoSelectorOpen(true)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {currentScreen === 'play' && activePlayGame ? (
          /* Active Game Playing Screen */
          <div className="relative py-4">
            <ActiveGameRunner
              game={activePlayGame}
              initialPackSize={selectedTriviaPackSize}
              onExit={() => {
                soundEngine.playClick();
                setCurrentScreen('home');
                setActivePlayGame(null);
              }}
            />
            {/* Team Scoreboard available during gameplay */}
            <TeamScoreboard />
          </div>
        ) : currentScreen === 'my-games' ? (
          /* My Purchased Games Screen */
          <MyGamesView
            ownedGames={ownedGamesList}
            onPlayGame={handlePlayGame}
            onExploreMore={() => {
              setCurrentScreen('home');
              setTimeout(scrollToGames, 100);
            }}
          />
        ) : (
          /* Home View: Hero, Category Filter, and Games Showcase */
          <div>
            {/* Hero Section */}
            <Hero
              onExploreClick={scrollToGames}
              onQuickDemoClick={() => {
                const demoGame = GAMES.find((g) => g.id === 'who-am-i') || GAMES[0];
                handlePlayGame(demoGame);
              }}
            />

            {/* Games Section */}
            <section id="games-catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
              
              {/* Category Filter Pills */}
              <CategoryFilter
                selectedCategory={selectedCategory}
                onSelectCategory={(catId) => setSelectedCategory(catId)}
              />

              {/* Games Grid */}
              <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {filteredGames.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    isOwned={ownedGameIds.includes(game.id)}
                    onPlay={handlePlayGame}
                    onBuy={handleStartPurchase}
                    onViewDetails={(g) => setDetailsGame(g)}
                  />
                ))}
              </div>

              {/* Callout: Why Niddak is different */}
              <div className="mt-16 sm:mt-20 p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-amber-950/20 border border-slate-800 text-right relative overflow-hidden">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold mb-4 border border-amber-500/20">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>فلسفة ندّك</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white font-display">
                    ليه ندّك أفضل خيار لجلستكم؟
                  </h3>
                  <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
                    بدل ما كل شخص ينعزل بجواله أو تضيعون 20 دقيقة تدورون كود غرفة وتثبتون تطبيقات، ندّك يجمعكم حول جهاز واحد. شخص واحد يمسك اللعبة والكل يشارك، يضحك، ويتحمس في نفس المكان وبدون أي تأخير!
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-300">
                    <span className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
                      ⚡ اطلب والعب خلال 10 ثواني
                    </span>
                    <span className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
                      📺 اعرضها على التلفزيون بضغطة زر
                    </span>
                    <span className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
                      💰 ادفع مرة واحدة واللعبة لك للأبد
                    </span>
                  </div>
                </div>
              </div>

            </section>
          </div>
        )}
      </main>

      {/* Footer (on home and my-games screens) */}
      {currentScreen !== 'play' && (
        <Footer
          onBrowseGames={() => {
            setCurrentScreen('home');
            setTimeout(scrollToGames, 100);
          }}
          onOpenMyGames={() => {
            setCurrentScreen('my-games');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          selectedLogo={selectedLogo}
          onOpenLogoSelector={() => setIsLogoSelectorOpen(true)}
        />
      )}

      {/* Pre-purchase Game Details Modal */}
      <GameDetailsModal
        game={detailsGame}
        isOpen={!!detailsGame}
        onClose={() => setDetailsGame(null)}
        isOwned={detailsGame ? ownedGameIds.includes(detailsGame.id) : false}
        onBuy={handleStartPurchase}
        onPlay={handlePlayGame}
      />

      {/* Instant Checkout & Activation Modal */}
      <CheckoutModal
        game={checkoutGame}
        isOpen={!!checkoutGame}
        initialPackRounds={selectedTriviaPackSize}
        onClose={() => setCheckoutGame(null)}
        onSuccess={handlePurchaseSuccess}
      />

      {/* Trivia Clash 3-Packs Modal */}
      <TriviaPacksModal
        isOpen={isTriviaPacksOpen}
        onClose={() => setIsTriviaPacksOpen(false)}
        game={GAMES.find((g) => g.id === 'trivia-clash') || GAMES[2]}
        isOwned={ownedGameIds.includes('trivia-clash')}
        onSelectPackAndBuy={(game, pack) => {
          setSelectedTriviaPackSize(pack.count);
          setIsTriviaPacksOpen(false);
          setCheckoutGame(game);
        }}
        onSelectPackAndPlay={(game, pack) => {
          setSelectedTriviaPackSize(pack.count);
          setIsTriviaPacksOpen(false);
          try {
            localStorage.setItem('niddak_pack_size_trivia-clash', String(pack.count));
          } catch {}
          setActivePlayGame(game);
          setCurrentScreen('play');
        }}
      />

      {/* Logo Design Selector Studio Modal */}
      <LogoSelectorModal
        isOpen={isLogoSelectorOpen}
        onClose={() => setIsLogoSelectorOpen(false)}
        selectedLogo={selectedLogo}
        onSelectLogo={(newLogoId) => setSelectedLogo(newLogoId)}
      />

    </div>
  );
}
