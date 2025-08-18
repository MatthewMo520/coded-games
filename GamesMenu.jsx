import React, { useState } from 'react';
import Tetris from './Tetris';
import Minesweeper from './Minesweeper';
import Solitaire from './Solitaire';

const GamesMenu = () => {
  const [currentGame, setCurrentGame] = useState(null);

  const games = [
    {
      id: 'tetris',
      name: 'Tetris',
      description: 'Classic falling blocks puzzle game',
      icon: '🧩',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      id: 'minesweeper',
      name: 'Minesweeper',
      description: 'Find all mines without triggering any',
      icon: '💣',
      color: 'bg-red-500 hover:bg-red-600',
    },
    {
      id: 'solitaire',
      name: 'Solitaire',
      description: 'Classic card game for one player',
      icon: '🃏',
      color: 'bg-green-500 hover:bg-green-600',
    },
  ];

  const handleGameSelect = (gameId) => {
    setCurrentGame(gameId);
  };

  const handleBackToMenu = () => {
    setCurrentGame(null);
  };

  if (currentGame === 'tetris') {
    return <Tetris onBack={handleBackToMenu} />;
  }

  if (currentGame === 'minesweeper') {
    return <Minesweeper onBack={handleBackToMenu} />;
  }

  if (currentGame === 'solitaire') {
    return <Solitaire onBack={handleBackToMenu} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">Game Menu</h1>
        <p className="text-gray-400 text-center mb-12">Choose a game to play</p>
        
        <div className="grid md:grid-cols-3 gap-6">
          {games.map((game) => (
            <div
              key={game.id}
              onClick={() => handleGameSelect(game.id)}
              className={`${game.color} rounded-lg p-6 cursor-pointer transform transition-all duration-200 hover:scale-105 shadow-lg`}
            >
              <div className="text-center">
                <div className="text-4xl mb-4">{game.icon}</div>
                <h2 className="text-2xl font-bold mb-2">{game.name}</h2>
                <p className="text-white/80">{game.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-gray-500">Click on any game to start playing!</p>
        </div>
      </div>
    </div>
  );
};

export default GamesMenu;