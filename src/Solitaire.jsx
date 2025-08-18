import React, { useState, useEffect, useCallback } from 'react';
import backgroundImage from './assets/backgroundimage.png';

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const Solitaire = ({ onBack }) => {
  const [deck, setDeck] = useState([]);
  const [waste, setWaste] = useState([]);
  const [foundations, setFoundations] = useState([[], [], [], []]);
  const [tableau, setTableau] = useState([[], [], [], [], [], [], []]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [draggedCard, setDraggedCard] = useState(null);
  const [dragOverTarget, setDragOverTarget] = useState(null);

  const createCard = (suit, value) => ({
    suit,
    value,
    id: `${suit}-${value}`,
    isRed: suit === '♥' || suit === '♦',
    numValue: value === 'A' ? 1 : value === 'J' ? 11 : value === 'Q' ? 12 : value === 'K' ? 13 : parseInt(value)
  });

  const createDeck = useCallback(() => {
    const newDeck = [];
    SUITS.forEach(suit => {
      VALUES.forEach(value => {
        newDeck.push(createCard(suit, value));
      });
    });
    return newDeck.sort(() => Math.random() - 0.5);
  }, []);

  const initializeGame = useCallback(() => {
    const shuffledDeck = createDeck();
    const newTableau = [[], [], [], [], [], [], []];
    
    let deckIndex = 0;
    for (let col = 0; col < 7; col++) {
      for (let row = 0; row <= col; row++) {
        const card = shuffledDeck[deckIndex++];
        card.faceUp = row === col;
        newTableau[col].push(card);
      }
    }
    
    setTableau(newTableau);
    setDeck(shuffledDeck.slice(deckIndex));
    setWaste([]);
    setFoundations([[], [], [], []]);
    setSelectedCard(null);
    setMoves(0);
    setGameWon(false);
  }, [createDeck]);

  const drawFromDeck = () => {
    if (deck.length === 0) {
      setDeck([...waste].reverse());
      setWaste([]);
    } else {
      const newCard = { ...deck[0], faceUp: true };
      setWaste([newCard, ...waste]);
      setDeck(deck.slice(1));
    }
    setMoves(prev => prev + 1);
  };

  const canPlaceOnFoundation = (card, foundationIndex) => {
    const foundation = foundations[foundationIndex];
    if (foundation.length === 0) {
      return card.value === 'A';
    }
    const topCard = foundation[foundation.length - 1];
    return card.suit === topCard.suit && card.numValue === topCard.numValue + 1;
  };

  const canPlaceOnTableau = (card, columnIndex) => {
    const column = tableau[columnIndex];
    if (column.length === 0) {
      return card.value === 'K';
    }
    const topCard = column[column.length - 1];
    return topCard.faceUp && card.isRed !== topCard.isRed && card.numValue === topCard.numValue - 1;
  };

  const moveToFoundation = (card, source, foundationIndex) => {
    if (!canPlaceOnFoundation(card, foundationIndex)) return false;

    const newFoundations = [...foundations];
    newFoundations[foundationIndex] = [...newFoundations[foundationIndex], card];
    setFoundations(newFoundations);

    if (source.type === 'waste') {
      setWaste(waste.slice(1));
    } else if (source.type === 'tableau') {
      const newTableau = [...tableau];
      newTableau[source.index] = newTableau[source.index].slice(0, -1);
      
      if (newTableau[source.index].length > 0) {
        const lastCard = newTableau[source.index][newTableau[source.index].length - 1];
        if (!lastCard.faceUp) {
          lastCard.faceUp = true;
        }
      }
      setTableau(newTableau);
    }

    setMoves(prev => prev + 1);
    setSelectedCard(null);
    return true;
  };

  const moveToTableau = (cards, source, columnIndex) => {
    if (!canPlaceOnTableau(cards[0], columnIndex)) return false;

    const newTableau = [...tableau];
    newTableau[columnIndex] = [...newTableau[columnIndex], ...cards];

    if (source.type === 'waste') {
      setWaste(waste.slice(1));
    } else if (source.type === 'tableau') {
      newTableau[source.index] = newTableau[source.index].slice(0, source.cardIndex);
      
      if (newTableau[source.index].length > 0) {
        const lastCard = newTableau[source.index][newTableau[source.index].length - 1];
        if (!lastCard.faceUp) {
          lastCard.faceUp = true;
        }
      }
    }

    setTableau(newTableau);
    setMoves(prev => prev + 1);
    setSelectedCard(null);
    return true;
  };

  const handleCardClick = (card, source) => {
    if (!card.faceUp) return;

    if (selectedCard && selectedCard.card.id === card.id) {
      setSelectedCard(null);
      return;
    }

    if (selectedCard) {
      if (source.type === 'foundation') return;
      
      if (source.type === 'tableau') {
        const cards = selectedCard.source.type === 'tableau' 
          ? tableau[selectedCard.source.index].slice(selectedCard.source.cardIndex)
          : [selectedCard.card];
        
        if (moveToTableau(cards, selectedCard.source, source.index)) {
          return;
        }
      }
      
      setSelectedCard(null);
    } else {
      if (source.type === 'foundation') return;
      setSelectedCard({ card, source });
    }
  };

  const handleFoundationClick = (foundationIndex) => {
    if (!selectedCard) return;

    moveToFoundation(selectedCard.card, selectedCard.source, foundationIndex);
  };

  const handleEmptyTableauClick = (columnIndex) => {
    if (!selectedCard) return;

    const cards = selectedCard.source.type === 'tableau' 
      ? tableau[selectedCard.source.index].slice(selectedCard.source.cardIndex)
      : [selectedCard.card];

    moveToTableau(cards, selectedCard.source, columnIndex);
  };

  const autoMoveToFoundation = () => {
    let moved = false;
    
    if (waste.length > 0) {
      const topCard = waste[0];
      for (let i = 0; i < 4; i++) {
        if (canPlaceOnFoundation(topCard, i)) {
          moveToFoundation(topCard, { type: 'waste' }, i);
          moved = true;
          break;
        }
      }
    }
    
    if (!moved) {
      for (let col = 0; col < 7; col++) {
        const column = tableau[col];
        if (column.length > 0) {
          const topCard = column[column.length - 1];
          if (topCard.faceUp) {
            for (let i = 0; i < 4; i++) {
              if (canPlaceOnFoundation(topCard, i)) {
                moveToFoundation(topCard, { type: 'tableau', index: col }, i);
                moved = true;
                break;
              }
            }
          }
        }
        if (moved) break;
      }
    }
  };

  const handleDragStart = (e, card, source) => {
    if (!card.faceUp) return;
    setDraggedCard({ card, source });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, target) => {
    e.preventDefault();
    setDragOverTarget(target);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOverTarget(null);
  };

  const handleDrop = (e, target) => {
    e.preventDefault();
    setDragOverTarget(null);
    
    if (!draggedCard) return;

    if (target.type === 'foundation') {
      moveToFoundation(draggedCard.card, draggedCard.source, target.index);
    } else if (target.type === 'tableau') {
      const cards = draggedCard.source.type === 'tableau' 
        ? tableau[draggedCard.source.index].slice(draggedCard.source.cardIndex)
        : [draggedCard.card];
      
      moveToTableau(cards, draggedCard.source, target.index);
    }
    
    setDraggedCard(null);
  };

  const renderCard = (card, isSelected = false, source = null, cardIndex = null) => {
    const bgColor = card.faceUp 
      ? 'bg-white text-black shadow-lg' 
      : 'bg-gradient-to-br from-blue-700 to-blue-900 shadow-md';
    
    const borderColor = isSelected ? 'border-pastel-yellow border-4' : 'border-gray-300';
    const selectedGlow = isSelected ? 'ring-4 ring-pastel-yellow ring-opacity-70 shadow-2xl' : '';
    const selectedTransform = isSelected ? 'scale-110 -translate-y-2' : '';
    const selectedBg = isSelected ? 'bg-gradient-to-br from-yellow-50 to-yellow-100' : bgColor;
    
    return (
      <div 
        className={`w-16 h-24 rounded-lg border-2 ${borderColor} ${isSelected ? selectedBg : bgColor} ${selectedGlow} ${selectedTransform} flex flex-col justify-between p-2 text-sm font-bold transform transition-all duration-200 hover:scale-105 cursor-pointer ${card.isRed ? 'text-red-600' : 'text-black'}`}
        draggable={card.faceUp}
        onDragStart={(e) => handleDragStart(e, card, source)}
      >
        {card.faceUp ? (
          <>
            <div className="text-left font-bold">{card.value}</div>
            <div className="text-center text-2xl">{card.suit}</div>
            <div className="transform rotate-180 self-end text-right font-bold">{card.value}</div>
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 rounded-md flex items-center justify-center">
            <div className="text-blue-300 text-lg">🂠</div>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  useEffect(() => {
    const totalCards = foundations.flat().length;
    if (totalCards === 52) {
      setGameWon(true);
    }
  }, [foundations]);

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Background image with subtle fade for gameplay visibility */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      ></div>
      <div className="absolute inset-0 bg-black/50"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/40 via-gray-900/30 to-gray-800/50"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-green-900/10"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pastel-green/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pastel-blue/5 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={onBack}
            className="group inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 hover:border-pastel-green rounded-xl px-6 py-3 transform transition-all duration-300 hover:scale-105 shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-white font-medium">Back to Menu</span>
          </button>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">Solitaire</h1>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-4 text-center shadow-lg">
            <div className="text-white/80 text-sm mb-1">Moves</div>
            <div className="text-2xl font-bold text-pastel-lightGreen drop-shadow-md">{moves}</div>
          </div>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={initializeGame}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 hover:border-pastel-green rounded-xl px-6 py-3 transform transition-all duration-300 hover:scale-105 font-medium text-white shadow-md"
          >
            New Game
          </button>
          <button
            onClick={autoMoveToFoundation}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 hover:border-pastel-green rounded-xl px-6 py-3 transform transition-all duration-300 hover:scale-105 font-medium text-white shadow-md"
          >
            Auto Move
          </button>
        </div>

        {gameWon && (
          <div className="bg-pastel-green backdrop-blur-md border border-pastel-green rounded-xl p-6 mb-8 text-center transform transition-all duration-500 hover:scale-105 shadow-lg">
            <div className="text-2xl font-bold mb-2 text-gray-800">🎉 Congratulations! You Won!</div>
            <div className="text-lg text-gray-700">Completed in {moves} moves</div>
          </div>
        )}

        <div className="flex justify-between mb-8">
          <div className="flex gap-6">
            <div
              onClick={drawFromDeck}
              className="w-16 h-24 border-2 border-white/30 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 cursor-pointer hover:from-blue-500 hover:to-blue-700 flex items-center justify-center transform transition-all duration-300 hover:scale-105 shadow-lg backdrop-blur-sm"
            >
              <div className="text-white text-2xl">
                {deck.length > 0 ? '🂠' : '↺'}
              </div>
            </div>
            
            <div className="w-16 h-24 border-2 border-white/30 rounded-xl bg-white/10 backdrop-blur-sm shadow-lg">
              {waste.length > 0 && (
                <div
                  onClick={() => handleCardClick(waste[0], { type: 'waste' })}
                  className="cursor-pointer"
                >
                  {renderCard(waste[0], selectedCard?.card.id === waste[0].id, { type: 'waste' })}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            {foundations.map((foundation, index) => (
              <div
                key={index}
                onClick={() => handleFoundationClick(index)}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, { type: 'foundation', index })}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, { type: 'foundation', index })}
                className={`w-16 h-24 border-2 rounded-xl bg-white/10 backdrop-blur-sm cursor-pointer hover:bg-white/20 transform transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center ${
                  dragOverTarget?.type === 'foundation' && dragOverTarget?.index === index 
                    ? 'border-pastel-green bg-pastel-green/20' 
                    : 'border-white/30'
                }`}
              >
                {foundation.length > 0 ? renderCard(foundation[foundation.length - 1], false, { type: 'foundation', index }) : (
                  <div className="text-white/50 text-lg">♠♥♦♣</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          {tableau.map((column, colIndex) => (
            <div 
              key={colIndex} 
              className="flex flex-col gap-1 min-h-32"
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, { type: 'tableau', index: colIndex })}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, { type: 'tableau', index: colIndex })}
            >
              {column.length === 0 ? (
                <div
                  onClick={() => handleEmptyTableauClick(colIndex)}
                  className={`w-16 h-24 border-2 rounded-xl bg-white/10 backdrop-blur-sm cursor-pointer hover:bg-white/20 transform transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center ${
                    dragOverTarget?.type === 'tableau' && dragOverTarget?.index === colIndex 
                      ? 'border-pastel-blue bg-pastel-blue/20' 
                      : 'border-white/30'
                  }`}
                >
                  <div className="text-white/50 text-lg">K</div>
                </div>
              ) : (
                column.map((card, cardIndex) => (
                  <div
                    key={card.id}
                    onClick={() => handleCardClick(card, { type: 'tableau', index: colIndex, cardIndex })}
                    className={`cursor-pointer ${cardIndex > 0 ? '-mt-20' : ''}`}
                    style={{ zIndex: cardIndex }}
                  >
                    {renderCard(card, selectedCard?.card.id === card.id, { type: 'tableau', index: colIndex, cardIndex }, cardIndex)}
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Solitaire;