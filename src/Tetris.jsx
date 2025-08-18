import React, { useState, useEffect, useCallback } from 'react';
import backgroundImage from './assets/backgroundimage.png';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

const TETRIS_PIECES = {
  I: { shape: [[1, 1, 1, 1]], color: 'bg-cyan-500' },
  O: { shape: [[1, 1], [1, 1]], color: 'bg-yellow-500' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: 'bg-purple-500' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: 'bg-green-500' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 'bg-red-500' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: 'bg-blue-500' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: 'bg-orange-500' }
};

const Tetris = ({ onBack }) => {
  const [board, setBoard] = useState(() => 
    Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0))
  );
  const [currentPiece, setCurrentPiece] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [heldPiece, setHeldPiece] = useState(null);
  const [canHold, setCanHold] = useState(true);

  const getRandomPiece = () => {
    const pieces = Object.keys(TETRIS_PIECES);
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
    return {
      type: randomPiece,
      shape: TETRIS_PIECES[randomPiece].shape,
      color: TETRIS_PIECES[randomPiece].color
    };
  };

  const rotatePiece = (piece) => {
    const rotated = piece[0].map((_, index) =>
      piece.map(row => row[index]).reverse()
    );
    return rotated;
  };

  const isValidMove = (board, piece, x, y) => {
    for (let py = 0; py < piece.length; py++) {
      for (let px = 0; px < piece[py].length; px++) {
        if (piece[py][px]) {
          const newX = x + px;
          const newY = y + py;
          
          if (newX < 0 || newX >= BOARD_WIDTH || 
              newY >= BOARD_HEIGHT || 
              (newY >= 0 && board[newY][newX])) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const placePiece = (board, piece, x, y, color) => {
    const newBoard = board.map(row => [...row]);
    for (let py = 0; py < piece.length; py++) {
      for (let px = 0; px < piece[py].length; px++) {
        if (piece[py][px]) {
          const newY = y + py;
          if (newY >= 0) {
            newBoard[newY][x + px] = color;
          }
        }
      }
    }
    return newBoard;
  };

  const clearLines = (board) => {
    const newBoard = board.filter(row => row.some(cell => !cell));
    const linesCleared = BOARD_HEIGHT - newBoard.length;
    
    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(0));
    }
    
    return { board: newBoard, linesCleared };
  };

  const spawnNewPiece = useCallback(() => {
    const piece = getRandomPiece();
    const startX = Math.floor(BOARD_WIDTH / 2) - Math.floor(piece.shape[0].length / 2);
    
    if (!isValidMove(board, piece.shape, startX, 0)) {
      setGameOver(true);
      return;
    }
    
    setCurrentPiece(piece);
    setPosition({ x: startX, y: 0 });
  }, [board]);

  const movePiece = useCallback((dx, dy) => {
    if (!currentPiece || gameOver || isPaused) return;
    
    const newX = position.x + dx;
    const newY = position.y + dy;
    
    if (isValidMove(board, currentPiece.shape, newX, newY)) {
      setPosition({ x: newX, y: newY });
    } else if (dy > 0) {
      const newBoard = placePiece(board, currentPiece.shape, position.x, position.y, currentPiece.color);
      const { board: clearedBoard, linesCleared } = clearLines(newBoard);
      
      setBoard(clearedBoard);
      setScore(prev => prev + linesCleared * 100 * level);
      setLevel(prev => Math.floor(score / 1000) + 1);
      setCanHold(true);
      spawnNewPiece();
    }
  }, [currentPiece, position, board, gameOver, isPaused, score, level, spawnNewPiece]);

  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    
    let dropY = position.y;
    while (isValidMove(board, currentPiece.shape, position.x, dropY + 1)) {
      dropY++;
    }
    
    const newBoard = placePiece(board, currentPiece.shape, position.x, dropY, currentPiece.color);
    const { board: clearedBoard, linesCleared } = clearLines(newBoard);
    
    setBoard(clearedBoard);
    setScore(prev => prev + linesCleared * 100 * level + (dropY - position.y) * 2); // Extra points for hard drop
    setLevel(prev => Math.floor(score / 1000) + 1);
    setCanHold(true);
    spawnNewPiece();
  }, [currentPiece, position, board, gameOver, isPaused, score, level, spawnNewPiece]);

  const holdPiece = useCallback(() => {
    if (!currentPiece || gameOver || isPaused || !canHold) return;
    
    if (heldPiece) {
      // Swap current piece with held piece
      const tempPiece = { ...currentPiece };
      setCurrentPiece({ ...heldPiece });
      setHeldPiece(tempPiece);
      
      // Reset position for the swapped piece
      const startX = Math.floor(BOARD_WIDTH / 2) - Math.floor(heldPiece.shape[0].length / 2);
      setPosition({ x: startX, y: 0 });
    } else {
      // Hold current piece and spawn new one
      setHeldPiece({ ...currentPiece });
      spawnNewPiece();
    }
    
    setCanHold(false);
  }, [currentPiece, heldPiece, gameOver, isPaused, canHold, spawnNewPiece]);

  const rotatePieceHandler = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    
    const rotated = rotatePiece(currentPiece.shape);
    if (isValidMove(board, rotated, position.x, position.y)) {
      setCurrentPiece({ ...currentPiece, shape: rotated });
    }
  }, [currentPiece, board, position, gameOver, isPaused]);

  const resetGame = () => {
    setBoard(Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0)));
    setScore(0);
    setLevel(1);
    setGameOver(false);
    setIsPaused(false);
    setCurrentPiece(null);
    setHeldPiece(null);
    setCanHold(true);
  };

  useEffect(() => {
    if (!currentPiece && !gameOver && !isPaused) {
      const timer = setTimeout(spawnNewPiece, 100);
      return () => clearTimeout(timer);
    }
  }, [currentPiece, gameOver, isPaused, spawnNewPiece]);

  useEffect(() => {
    if (gameOver || isPaused) return;
    
    const interval = setInterval(() => {
      movePiece(0, 1);
    }, Math.max(100, 1000 - (level - 1) * 100));
    
    return () => clearInterval(interval);
  }, [movePiece, level, gameOver, isPaused]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          movePiece(-1, 0);
          break;
        case 'ArrowRight':
          movePiece(1, 0);
          break;
        case 'ArrowDown':
          movePiece(0, 1);
          break;
        case 'ArrowUp':
          rotatePieceHandler();
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
        case 'c':
        case 'C':
          holdPiece();
          break;
        case 'p':
        case 'P':
          setIsPaused(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [movePiece, rotatePieceHandler, hardDrop, holdPiece]);

  const renderBoard = () => {
    let displayBoard = board.map(row => [...row]);
    
    if (currentPiece && !gameOver) {
      displayBoard = placePiece(displayBoard, currentPiece.shape, position.x, position.y, currentPiece.color);
    }
    
    return displayBoard.map((row, y) => (
      <div key={y} className="flex">
        {row.map((cell, x) => (
          <div
            key={x}
            className={`w-6 h-6 border border-gray-600 ${
              cell ? cell : 'bg-gray-800'
            }`}
          />
        ))}
      </div>
    ));
  };

  const renderHoldPiece = () => {
    if (!heldPiece) {
      return (
        <div className="w-16 h-16 border-2 border-white/30 bg-black/50 rounded backdrop-blur-sm flex items-center justify-center">
          <span className="text-white/50 text-xs">Empty</span>
        </div>
      );
    }

    const pieceGrid = Array(4).fill().map(() => Array(4).fill(0));
    const shape = heldPiece.shape;
    
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          pieceGrid[y][x] = heldPiece.color;
        }
      }
    }

    return (
      <div className="w-16 h-16 border-2 border-white/30 bg-black/50 rounded backdrop-blur-sm p-1">
        <div className="grid grid-cols-4 gap-0 h-full">
          {pieceGrid.flat().map((cell, index) => (
            <div
              key={index}
              className={`border border-gray-700 ${cell ? cell : 'bg-transparent'}`}
              style={{ width: '3px', height: '3px' }}
            />
          ))}
        </div>
      </div>
    );
  };

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
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pastel-blue/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pastel-green/5 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={onBack}
            className="group inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 hover:border-blue-500 rounded-xl px-6 py-3 transform transition-all duration-300 hover:scale-105"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-gray-200 font-medium">Back to Menu</span>
          </button>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-100 mb-2">Tetris</h1>
          </div>
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
            <div className="text-gray-400 text-sm mb-1">Score</div>
            <div className="text-2xl font-bold text-blue-400">{score}</div>
            <div className="text-gray-400 text-sm mb-1 mt-2">Level</div>
            <div className="text-xl font-bold text-green-400">{level}</div>
          </div>
        </div>
        
        <div className="flex justify-center gap-8 max-w-7xl mx-auto">
          {/* Hold Piece Display */}
          <div className="flex flex-col items-center">
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-4 mb-4 shadow-lg">
              <h3 className="text-white text-sm font-bold mb-2 text-center">Hold</h3>
              {renderHoldPiece()}
              <button
                onClick={holdPiece}
                disabled={!canHold || gameOver}
                className="mt-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 hover:border-pastel-yellow rounded-lg px-3 py-1 text-xs text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hold (C)
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-4 transform transition-all duration-500 hover:scale-105 shadow-lg">
              <div className="border-2 border-white/30 bg-black/50 p-2 rounded backdrop-blur-sm">
                {renderBoard()}
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="bg-gray-700 hover:bg-gray-600 border border-gray-600 hover:border-blue-500 rounded-xl px-6 py-3 transform transition-all duration-300 hover:scale-105 font-medium text-gray-200"
                  disabled={gameOver}
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button
                  onClick={resetGame}
                  className="bg-gray-700 hover:bg-gray-600 border border-gray-600 hover:border-blue-500 rounded-xl px-6 py-3 transform transition-all duration-300 hover:scale-105 font-medium text-gray-200"
                >
                  New Game
                </button>
              </div>
              
              {gameOver && (
                <div className="bg-pastel-red backdrop-blur-md border border-pastel-red rounded-xl p-6 mb-4 transform transition-all duration-500 hover:scale-105 shadow-lg">
                  <div className="text-2xl font-bold mb-2 text-gray-800">Game Over!</div>
                  <div className="text-lg text-gray-700">Final Score: {score}</div>
                </div>
              )}
              
              {isPaused && !gameOver && (
                <div className="bg-pastel-yellow backdrop-blur-md border border-pastel-yellow rounded-xl p-4 mb-4 shadow-lg">
                  <div className="font-bold text-gray-800">Game Paused</div>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 h-fit transform transition-all duration-500 hover:scale-105 shadow-lg">
            <h3 className="text-xl font-bold text-white mb-4 drop-shadow-md">Controls</h3>
            <div className="space-y-3 text-white/90">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm rounded px-2 py-1 text-xs font-mono text-white shadow-sm">←→</div>
                <span>Move piece</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm rounded px-2 py-1 text-xs font-mono text-white shadow-sm">↓</div>
                <span>Soft drop</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm rounded px-2 py-1 text-xs font-mono text-white shadow-sm">Space</div>
                <span>Hard drop</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm rounded px-2 py-1 text-xs font-mono text-white shadow-sm">↑</div>
                <span>Rotate piece</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm rounded px-2 py-1 text-xs font-mono text-white shadow-sm">C</div>
                <span>Hold piece</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm rounded px-2 py-1 text-xs font-mono text-white shadow-sm">P</div>
                <span>Pause game</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Tetris;