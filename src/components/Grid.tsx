import React, { useEffect, useRef, useState } from 'react';
import { GridState, GridClick, Puzzle } from '../types/index';
import { inferStrategy, calculateEfficiency, is4WaySymmetric } from '../utils/strategyAnalyzer';
import './Grid.css';

interface GridProps {
  puzzle: Puzzle;
  onComplete: (result: {
    clicks: number;
    timeTaken: number;
    strategy: 'pure additive' | 'additive' | 'subtractive' | 'pure subtractive';
    efficiency: number;
  }) => void;
}

const GRID_SIZE = 10;
const GRID_PADDING = 10;
const MAX_CELL_SIZE = 40;

const getCellSize = () => {
  const available = Math.min(window.innerWidth - 48, 420); // 48px for page margins
  return Math.min(MAX_CELL_SIZE, Math.floor((available - GRID_PADDING * 2) / GRID_SIZE));
};

export const Grid: React.FC<GridProps> = ({ puzzle, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cellSize, setCellSize] = useState(getCellSize);
  const [gridState, setGridState] = useState<GridState>(
    puzzle.initialState.map(row => [...row])
  );
  const [clickHistory, setClickHistory] = useState<GridClick[]>([]);
  const [clicks, setClicks] = useState(0);
  const [startTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const onResize = () => setCellSize(getCellSize());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Redraw whenever grid state or cell size changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const x = GRID_PADDING + c * cellSize;
        const y = GRID_PADDING + r * cellSize;
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellSize, cellSize);
        if (gridState[r][c]) {
          ctx.fillStyle = '#4CAF50';
          ctx.fillRect(x, y, cellSize, cellSize);
        }
      }
    }

    if (is4WaySymmetric(gridState) && !isComplete) {
      setIsComplete(true);
    }
  }, [gridState, isComplete, cellSize]);

  const cellFromPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const col = Math.floor((clientX - rect.left - GRID_PADDING) / cellSize);
    const row = Math.floor((clientY - rect.top  - GRID_PADDING) / cellSize);
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return null;
    return { row, col };
  };

  const toggleCell = (row: number, col: number) => {
    if (isComplete) return;
    const newGridState = gridState.map(r => [...r]);
    newGridState[row][col] = !newGridState[row][col];
    setGridState(newGridState);
    setClickHistory(prev => [...prev, { row, col, timestamp: Date.now() - startTime }]);
    setClicks(c => c + 1);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (cell) toggleCell(cell.row, cell.col);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    const cell = cellFromPoint(touch.clientX, touch.clientY);
    if (cell) toggleCell(cell.row, cell.col);
  };

  const handleNext = () => {
    const timeTaken = Date.now() - startTime;
    const strategy = inferStrategy(puzzle.initialState, clickHistory);
    const efficiency = calculateEfficiency(puzzle.optimalClicks, clicks);
    onComplete({ clicks, timeTaken, strategy, efficiency });
  };

  const canvasSize = GRID_PADDING * 2 + GRID_SIZE * cellSize;

  return (
    <div className="grid-container">
      <div className="grid-info">
        <h2>{puzzle.title}</h2>
        {puzzle.description && <p>{puzzle.description}</p>}
        <div className="grid-stats">
          <div className="stat">
            <span className="label">Clicks:</span>
            <span className="value">{clicks}</span>
          </div>
          {isComplete && (
            <div className="stat complete">
              <span className="label">✓ Symmetric!</span>
            </div>
          )}
        </div>
        {isComplete && (
          <button className="next-button" onClick={handleNext}>
            Next Puzzle →
          </button>
        )}
      </div>
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          onClick={handleCanvasClick}
          onTouchEnd={handleTouchEnd}
          className="grid-canvas"
        />
      </div>
    </div>
  );
};
