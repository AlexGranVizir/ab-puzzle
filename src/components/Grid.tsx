import React, { useEffect, useRef, useState } from 'react';
import { GridState, GridClick, Puzzle } from '../types/index';
import { inferStrategy, calculateEfficiency, is4WaySymmetric } from '../utils/strategyAnalyzer';
import './Grid.css';

interface GridProps {
  puzzle: Puzzle;
  onComplete: (result: {
    clicks: number;
    timeTaken: number;
    clickHistory: GridClick[];
    finalState: GridState;
    strategy: 'additive' | 'subtractive' | 'mixed';
    efficiency: number;
  }) => void;
}

const GRID_SIZE = 10;
const CELL_SIZE = 40;
const GRID_PADDING = 10;

export const Grid: React.FC<GridProps> = ({ puzzle, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gridState, setGridState] = useState<GridState>(
    puzzle.initialState.map(row => [...row])
  );
  const [clickHistory, setClickHistory] = useState<GridClick[]>([]);
  const [clicks, setClicks] = useState(0);
  const [startTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);

  // Redraw whenever grid state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const x = GRID_PADDING + c * CELL_SIZE;
        const y = GRID_PADDING + r * CELL_SIZE;
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
        if (gridState[r][c]) {
          ctx.fillStyle = '#4CAF50';
          ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        }
      }
    }

    // Complete when any 4-way symmetric arrangement is reached
    if (is4WaySymmetric(gridState) && !isComplete) {
      setIsComplete(true);
    }
  }, [gridState, isComplete]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isComplete) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = Math.floor((x - GRID_PADDING) / CELL_SIZE);
    const row = Math.floor((y - GRID_PADDING) / CELL_SIZE);

    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return;

    const newGridState = gridState.map(r => [...r]);
    newGridState[row][col] = !newGridState[row][col];
    setGridState(newGridState);

    const newClick: GridClick = { row, col, timestamp: Date.now() - startTime };
    setClickHistory([...clickHistory, newClick]);
    setClicks(clicks + 1);
  };

  const handleNext = () => {
    const timeTaken = Date.now() - startTime;
    const strategy = inferStrategy(puzzle.initialState, clickHistory, gridState);
    const efficiency = calculateEfficiency(puzzle.optimalClicks, clicks);
    onComplete({ clicks, timeTaken, clickHistory, finalState: gridState, strategy, efficiency });
  };

  const canvasSize = GRID_PADDING * 2 + GRID_SIZE * CELL_SIZE;

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
          className="grid-canvas"
        />
      </div>
    </div>
  );
};
