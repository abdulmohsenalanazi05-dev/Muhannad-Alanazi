export type CategoryId = 'all' | 'laugh' | 'think' | 'challenge' | 'family';

export interface Category {
  id: CategoryId;
  label: string;
  emoji: string;
  description: string;
}

export interface GameClue {
  text: string;
  points: number;
}

export type WhoAmICategoryId = 'all' | 'football' | 'foreign_series' | 'arab_celebs' | 'khaleeji_series';

export type FootballSubFilter = 'players' | 'coaches' | 'both';
export type ArabCelebsSubFilter = 'all' | 'social' | 'mix';

export interface WhoAmIRound {
  id: string;
  character: string;
  categoryName: string;
  categoryId?: 'football' | 'foreign_series' | 'arab_celebs' | 'khaleeji_series';
  celebType?: 'social' | 'mix';
  footballRole?: 'player' | 'coach';
  tag: string;
  clues: GameClue[];
  funFact?: string;
}

export interface TabooRound {
  id: string;
  word: string;
  categoryName: string;
  forbiddenWords: string[];
  hint?: string;
}

export type TriviaPackId = 'pack_10' | 'pack_15' | 'pack_20';

export interface TriviaPackOption {
  id: TriviaPackId;
  count: number;
  title: string;
  tagline: string;
  description: string;
  price: number;
  originalPrice: number;
  duration: string;
  badge?: string;
  popular?: boolean;
}

export interface TriviaQuestion {
  id: string;
  question: string;
  categoryName: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'extreme';
}

export interface PictureRiddle {
  id: string;
  title: string;
  categoryName: string;
  emojisOrClue: string;
  hint: string;
  answer: string;
  explanation?: string;
}

export interface GameItem {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: CategoryId;
  players: string;
  duration: string;
  difficulty: 'سهل وممتع' | 'متوسط وحماسي' | 'تحدي ناري' | 'عائلي خفيف';
  price: number;
  originalPrice?: number;
  badge?: string;
  rating: number;
  ratingCount: number;
  gradient: string;
  accentColor: string;
  iconName: string;
  howToPlay: string[];
  features: string[];
  demoAvailable?: boolean;
}

export type ActiveScreen = 'home' | 'details' | 'play' | 'my-games';
