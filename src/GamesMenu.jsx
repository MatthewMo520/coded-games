import React, { useState } from 'react';
import Tetris from './Tetris';
import Minesweeper from './Minesweeper';
import Solitaire from './Solitaire';
import backgroundImage from './assets/backgroundimage.png';

const GamesMenu = () => {
  const [currentGame, setCurrentGame] = useState(null);

  const games = [
    {
      id: 'tetris',
      name: 'Tetris',
      description: 'Stack falling blocks to clear lines',
      icon: '🎮',
      color: 'bg-pastel-lightBlue border-pastel-blue',
    },
    {
      id: 'minesweeper',
      name: 'Minesweeper',
      description: 'Find hidden mines using number clues',
      icon: '⛏️',
      color: 'bg-pastel-lightRed border-pastel-red',
    },
    {
      id: 'solitaire',
      name: 'Solitaire',
      description: 'Move all cards to the foundation piles',
      icon: '♠️',
      color: 'bg-pastel-lightGreen border-pastel-green',
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
    <section className="relative min-h-screen overflow-hidden">
      {/* Background image with overlays matching your personal website */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      ></div>
      <div className="absolute inset-0 bg-black/70"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/60 via-gray-900/40 to-gray-800/80"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/5 via-transparent to-green-900/5"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pastel-blue/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pastel-green/10 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="text-center mb-20">
          <h1 className="text-5xl font-bold text-white mb-4 transform transition-all duration-700 hover:scale-105 drop-shadow-lg">
            Games
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-lg transition-all duration-500 drop-shadow-md">
            Pick a game and start playing
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {games.map((game, index) => (
            <div
              key={game.id}
              onClick={() => handleGameSelect(game.id)}
              className={`bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-8 cursor-pointer transform transition-all duration-500 hover:scale-105 hover:border-white/40 group shadow-lg`}
              style={{ 
                animationDelay: `${index * 200}ms`,
                animation: 'fadeInUp 0.6s ease-out forwards',
                opacity: 0,
                transform: 'translateY(20px)'
              }}
            >
              <div className="text-center">
                <div className="text-6xl mb-6 transform transition-all duration-300 group-hover:scale-110">{game.icon}</div>
                <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-pastel-lightBlue transition-colors duration-300 drop-shadow-md">{game.name}</h2>
                <p className="text-white/80 mb-6 group-hover:text-white/90 transition-colors duration-300">{game.description}</p>
                <div className={`inline-flex items-center gap-2 ${game.color} rounded-full px-4 py-2 text-sm font-medium text-gray-800 transform transition-all duration-300 group-hover:scale-105 shadow-md`}>
                  <span>Play Now</span>
                  <svg className="w-4 h-4 transform transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
};

export default GamesMenu;