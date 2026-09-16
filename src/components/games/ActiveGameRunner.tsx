import React from 'react';
import { GameItem } from '../../types';
import { WhoAmIGame } from './WhoAmIGame';
import { TabooGame } from './TabooGame';
import { TriviaGame } from './TriviaGame';
import { PictureGame } from './PictureGame';

interface ActiveGameRunnerProps {
  game: GameItem;
  onExit: () => void;
  initialPackSize?: number;
}

export const ActiveGameRunner: React.FC<ActiveGameRunnerProps> = ({ game, onExit, initialPackSize }) => {
  switch (game.id) {
    case 'who-am-i':
      return <WhoAmIGame game={game} onExit={onExit} />;
    case 'taboo':
      return <TabooGame game={game} onExit={onExit} />;
    case 'trivia-clash':
      return <TriviaGame game={game} onExit={onExit} initialPackSize={initialPackSize} />;
    case 'picture-meme':
      return <PictureGame game={game} onExit={onExit} />;
    default:
      return null;
  }
};
