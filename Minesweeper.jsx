import React, { useState, useEffect, useCallback } from 'react';

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

  const initializeBoard = useCallback((rows, cols, mines) => {
    const newBoard = Array(rows).fill().map(() =>
      Array(cols).fill().map(() => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0
      }))
    );

    let minesPlaced = 0;
    while (minesPlaced < mines) {
      const row = Math.floor(Math.random() * rows);
      const col = Math.floor(Math.random() * cols);
      
      if (!newBoard[row][col].isMine) {
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
    const newBoard = initializeBoard(config.rows, config.cols, config.mines);
    setBoard(newBoard);
    setMinesLeft(config.mines);
    setGameState('playing');
    setTimer(0);
    setGameStarted(false);
  }, [difficulty, initializeBoard]);

  const revealCell = useCallback((row, col) => {
    if (gameState !== 'playing') return;
    
    if (!gameStarted) {
      setGameStarted(true);
    }

    setBoard(prevBoard => {
      const newBoard = prevBoard.map(r => r.map(c => ({ ...c })));
      const cell = newBoard[row][col];
      
      if (cell.isRevealed || cell.isFlagged) return prevBoard;
      
      if (cell.isMine) {
        setGameState('lost');
        newBoard.forEach(r => r.forEach(c => {
          if (c.isMine) c.isRevealed = true;
        }));
        return newBoard;
      }
      
      const toReveal = [[row, col]];
      const revealed = new Set();
      
      while (toReveal.length > 0) {
        const [r, c] = toReveal.pop();
        const key = `${r},${c}`;
        
        if (revealed.has(key) || r < 0 || r >= newBoard.length || 
            c < 0 || c >= newBoard[0].length || 
            newBoard[r][c].isRevealed || newBoard[r][c].isFlagged) {
          continue;
        }
        
        revealed.add(key);
        newBoard[r][c].isRevealed = true;
        
        if (newBoard[r][c].neighborMines === 0) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              toReveal.push([r + dr, c + dc]);
            }
          }
        }
      }
      
      const nonMinesCells = newBoard.flat().filter(c => !c.isMine).length;
      const revealedCells = newBoard.flat().filter(c => c.isRevealed && !c.isMine).length;
      
      if (revealedCells === nonMinesCells) {
        setGameState('won');
      }
      
      return newBoard;
    });
  }, [gameState, gameStarted]);

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
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={onBack}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
          >
            ← Back to Menu
          </button>
          <h1 className="text-3xl font-bold">Minesweeper</h1>
          <div className="text-right">
            <div>Mines: {minesLeft}</div>
            <div>Time: {timer}s</div>
          </div>
        </div>

        <div className="flex justify-center mb-4 gap-4">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="bg-gray-700 text-white px-3 py-1 rounded"
            disabled={gameState === 'playing' && gameStarted}
          >
            <option value="easy">Easy (9x9, 10 mines)</option>
            <option value="medium">Medium (16x16, 40 mines)</option>
            <option value="hard">Hard (16x30, 99 mines)</option>
          </select>
          
          <button
            onClick={startNewGame}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded"
          >
            New Game
          </button>
        </div>

        {gameState === 'won' && (
          <div className="bg-green-600 p-4 rounded mb-4 text-center">
            <div className="text-xl font-bold">Congratulations! You Won!</div>
            <div>Time: {timer} seconds</div>
          </div>
        )}

        {gameState === 'lost' && (
          <div className="bg-red-600 p-4 rounded mb-4 text-center">
            <div className="text-xl font-bold">Game Over!</div>
            <div>You hit a mine!</div>
          </div>
        )}

        <div className="flex justify-center">
          <div className="inline-block bg-gray-800 p-4 rounded">
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

        <div className="mt-4 text-center text-sm text-gray-400">
          Left click to reveal • Right click to flag
        </div>
      </div>
    </div>
  );
};

export default Minesweeper;