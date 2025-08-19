import React, { useState, useEffect, useCallback } from 'react';
import backgroundImage from './assets/backgroundimage.png';

const DIFFICULTY_LEVELS = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 }
};

const Minesweeper = ({ onBack }) => {
  const [difficulty, setDifficulty] = useState('easy');
  const [board, setBoard] = useState([]);
  const [gameState, setGameState] = useState('playing'); // playing, won, lost
  const [minesLeft, setMinesLeft] = useState(0);
  const [timer, setTimer] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [minesPlaced, setMinesPlaced] = useState(false);

  const initializeBoard = useCallback((rows, cols) => {
    const newBoard = Array(rows).fill().map(() =>
      Array(cols).fill().map(() => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0
      }))
    );

    return newBoard;
  }, []);

  const placeMinesAfterFirstClick = useCallback((board, firstClickRow, firstClickCol, mineCount) => {
    const rows = board.length;
    const cols = board[0].length;
    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    
    const safeCells = new Set();
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = firstClickRow + dr;
        const nc = firstClickCol + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          safeCells.add(`${nr},${nc}`);
        }
      }
    }

    let minesPlaced = 0;
    while (minesPlaced < mineCount) {
      const row = Math.floor(Math.random() * rows);
      const col = Math.floor(Math.random() * cols);
      const key = `${row},${col}`;
      
      if (!newBoard[row][col].isMine && !safeCells.has(key)) {
        newBoard[row][col].isMine = true;
        minesPlaced++;
      }
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!newBoard[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newBoard[nr][nc].isMine) {
                count++;
              }
            }
          }
          newBoard[r][c].neighborMines = count;
        }
      }
    }

    return newBoard;
  }, []);

  const startNewGame = useCallback(() => {
    const config = DIFFICULTY_LEVELS[difficulty];
    const newBoard = initializeBoard(config.rows, config.cols);
    setBoard(newBoard);
    setMinesLeft(config.mines);
    setGameState('playing');
    setTimer(0);
    setGameStarted(false);
    setMinesPlaced(false);
  }, [difficulty, initializeBoard]);

  const revealCell = useCallback((row, col) => {
    if (gameState !== 'playing') return;
    
    if (!gameStarted) {
      setGameStarted(true);
    }

    setBoard(prevBoard => {
      let workingBoard = prevBoard.map(r => r.map(c => ({ ...c })));
      
      if (!minesPlaced) {
        const config = DIFFICULTY_LEVELS[difficulty];
        workingBoard = placeMinesAfterFirstClick(workingBoard, row, col, config.mines);
        setMinesPlaced(true);
      }
      
      const cell = workingBoard[row][col];
      
      if (cell.isRevealed || cell.isFlagged) return prevBoard;
      
      if (cell.isMine) {
        setGameState('lost');
        workingBoard.forEach(r => r.forEach(c => {
          if (c.isMine) c.isRevealed = true;
        }));
        return workingBoard;
      }
      
      const toReveal = [[row, col]];
      const revealed = new Set();
      
      while (toReveal.length > 0) {
        const [r, c] = toReveal.pop();
        const key = `${r},${c}`;
        
        if (revealed.has(key) || r < 0 || r >= workingBoard.length || 
            c < 0 || c >= workingBoard[0].length || 
            workingBoard[r][c].isRevealed || workingBoard[r][c].isFlagged) {
          continue;
        }
        
        revealed.add(key);
        workingBoard[r][c].isRevealed = true;
        
        if (workingBoard[r][c].neighborMines === 0) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              toReveal.push([r + dr, c + dc]);
            }
          }
        }
      }
      
      const totalMines = workingBoard.flat().filter(c => c.isMine).length;
      const config = DIFFICULTY_LEVELS[difficulty];
      
      if (minesPlaced && totalMines === config.mines) {
        const nonMinesCells = workingBoard.flat().filter(c => !c.isMine).length;
        const revealedCells = workingBoard.flat().filter(c => c.isRevealed && !c.isMine).length;
        
        if (revealedCells === nonMinesCells) {
          setGameState('won');
        }
      }
      
      return workingBoard;
    });
  }, [gameState, gameStarted, minesPlaced, difficulty, placeMinesAfterFirstClick]);

  const toggleFlag = useCallback((row, col, e) => {
    e.preventDefault();
    if (gameState !== 'playing') return;
    
    setBoard(prevBoard => {
      const newBoard = prevBoard.map(r => r.map(c => ({ ...c })));
      const cell = newBoard[row][col];
      
      if (cell.isRevealed) return prevBoard;
      
      cell.isFlagged = !cell.isFlagged;
      setMinesLeft(prev => cell.isFlagged ? prev - 1 : prev + 1);
      
      return newBoard;
    });
  }, [gameState]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  useEffect(() => {
    if (!gameStarted || gameState !== 'playing') return;
    
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameStarted, gameState]);

  const getCellContent = (cell) => {
    if (cell.isFlagged) return '🚩';
    if (!cell.isRevealed) return '';
    if (cell.isMine) return '💣';
    if (cell.neighborMines === 0) return '';
    return cell.neighborMines;
  };

  const getCellStyle = (cell) => {
    if (cell.isFlagged) return 'bg-yellow-500';
    if (!cell.isRevealed) return 'bg-gray-600 hover:bg-gray-500';
    if (cell.isMine) return 'bg-red-500';
    return 'bg-gray-300 text-black';
  };

  const getNumberColor = (num) => {
    const colors = {
      1: 'text-blue-600',
      2: 'text-green-600',
      3: 'text-red-600',
      4: 'text-purple-600',
      5: 'text-yellow-600',
      6: 'text-pink-600',
      7: 'text-black',
      8: 'text-gray-600'
    };
    return colors[num] || '';
  };

  return (
    <section className="relative min-h-screen overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      ></div>
      <div className="absolute inset-0 bg-black/50"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/40 via-gray-900/30 to-gray-800/50"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-green-900/10"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pastel-red/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pastel-blue/5 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={onBack}
            className="group inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 hover:border-pastel-red rounded-xl px-6 py-3 transform transition-all duration-300 hover:scale-105 shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-white font-medium">Back to Menu</span>
          </button>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">Minesweeper</h1>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-4 text-center shadow-lg">
            <div className="text-white/80 text-sm mb-1">Mines Left</div>
            <div className="text-2xl font-bold text-pastel-lightRed drop-shadow-md">{minesLeft}</div>
            <div className="text-white/80 text-sm mb-1 mt-2">Time</div>
            <div className="text-xl font-bold text-pastel-lightBlue drop-shadow-md">{timer}s</div>
          </div>
        </div>

        <div className="flex justify-center mb-8 gap-4">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="bg-white/20 backdrop-blur-sm border border-white/30 hover:border-white/50 text-white px-4 py-2 rounded-xl focus:outline-none focus:border-pastel-blue shadow-md"
            disabled={gameState === 'playing' && gameStarted}
            style={{
              color: 'white'
            }}
          >
            <option value="easy" style={{backgroundColor: '#1f2937', color: 'white'}}>Easy (9×9, 10 mines)</option>
            <option value="medium" style={{backgroundColor: '#1f2937', color: 'white'}}>Medium (16×16, 40 mines)</option>
            <option value="hard" style={{backgroundColor: '#1f2937', color: 'white'}}>Hard (16×30, 99 mines)</option>
          </select>
          
          <button
            onClick={startNewGame}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 hover:border-pastel-blue rounded-xl px-6 py-2 transform transition-all duration-300 hover:scale-105 font-medium text-white shadow-md"
          >
            New Game
          </button>
        </div>

        {gameState === 'won' && (
          <div className="bg-pastel-green backdrop-blur-md border border-pastel-green rounded-xl p-6 mb-8 text-center transform transition-all duration-500 hover:scale-105 shadow-lg">
            <div className="text-2xl font-bold mb-2 text-gray-800">🎉 Congratulations! You Won!</div>
            <div className="text-lg text-gray-700">Completed in {timer} seconds</div>
          </div>
        )}

        {gameState === 'lost' && (
          <div className="bg-pastel-red backdrop-blur-md border border-pastel-red rounded-xl p-6 mb-8 text-center transform transition-all duration-500 hover:scale-105 shadow-lg">
            <div className="text-2xl font-bold mb-2 text-gray-800">💥 Game Over!</div>
            <div className="text-lg text-gray-700">You hit a mine!</div>
          </div>
        )}

        <div className="flex justify-center">
          <div className="inline-block bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 transform transition-all duration-500 hover:scale-105 shadow-lg">
            <div 
              className="grid gap-1"
              style={{ 
                gridTemplateColumns: `repeat(${board[0]?.length || 1}, minmax(0, 1fr))` 
              }}
            >
              {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    className={`w-6 h-6 border border-gray-400 flex items-center justify-center text-xs font-bold ${getCellStyle(cell)} ${
                      cell.isRevealed && cell.neighborMines > 0 ? getNumberColor(cell.neighborMines) : ''
                    }`}
                    onClick={() => revealCell(rowIndex, colIndex)}
                    onContextMenu={(e) => toggleFlag(rowIndex, colIndex, e)}
                  >
                    {getCellContent(cell)}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-white/80 text-sm bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20 shadow-md">
            <span>💡 Left click to reveal • Right click to flag</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Minesweeper;