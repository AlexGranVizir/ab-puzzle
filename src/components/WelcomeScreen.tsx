import React, { useEffect, useRef, useState, useCallback } from 'react';
import './WelcomeScreen.css';

const DEMO_N = 10;
const DEMO_PADDING = 8;
const MAX_CELL = 32;
const MIN_CLICKS = 3;

const getDemoCell = () => {
  const avail = Math.min(window.innerWidth - 64, 340);
  return Math.min(MAX_CELL, Math.floor((avail - DEMO_PADDING * 2) / DEMO_N));
};

// Top-left and bottom-right quadrants pre-filled
const initialDemo = (): boolean[][] =>
  Array(DEMO_N).fill(null).map((_, r) =>
    Array(DEMO_N).fill(null).map((_, c) =>
      (r < 5 && c < 5) || (r >= 5 && c >= 5)
    )
  );

export const WelcomeScreen: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cellSize, setCellSize] = useState(getDemoCell);
  const [grid, setGrid] = useState<boolean[][]>(initialDemo);
  const [clicks, setClicks] = useState(0);
  const ready = clicks >= MIN_CLICKS;

  useEffect(() => {
    const onResize = () => setCellSize(getDemoCell());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < DEMO_N; r++) {
      for (let c = 0; c < DEMO_N; c++) {
        const x = DEMO_PADDING + c * cellSize;
        const y = DEMO_PADDING + r * cellSize;
        if (grid[r][c]) {
          ctx.fillStyle = '#4CAF50';
          ctx.fillRect(x, y, cellSize, cellSize);
        }
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellSize, cellSize);
      }
    }

    // Thick lines marking the 4 quadrants
    const midX = DEMO_PADDING + (DEMO_N / 2) * cellSize;
    const midY = DEMO_PADDING + (DEMO_N / 2) * cellSize;
    const end  = DEMO_PADDING + DEMO_N * cellSize;
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(midX, DEMO_PADDING); ctx.lineTo(midX, end);
    ctx.moveTo(DEMO_PADDING, midY); ctx.lineTo(end,  midY);
    ctx.stroke();
  }, [grid, cellSize]);

  useEffect(() => { draw(); }, [draw]);

  const toggle = (clientX: number, clientY: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const col = Math.floor((clientX - rect.left  - DEMO_PADDING) / cellSize);
    const row = Math.floor((clientY - rect.top   - DEMO_PADDING) / cellSize);
    if (row < 0 || row >= DEMO_N || col < 0 || col >= DEMO_N) return;
    setGrid(prev => prev.map((r, ri) =>
      r.map((cell, ci) => ri === row && ci === col ? !cell : cell)
    ));
    setClicks(n => n + 1);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    toggle(t.clientX, t.clientY);
  };

  const canvasSize = DEMO_PADDING * 2 + DEMO_N * cellSize;

  return (
    <div className="welcome-screen">
      <h2>How to play</h2>

      <p className="welcome-hint">
        First, let us become familiar with the tool. Click on any cell in the grid below
        to see how its color can be changed. You can change the color of one cell at a time.
      </p>

      <div className="welcome-canvas-area">
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          onClick={e => toggle(e.clientX, e.clientY)}
          onTouchEnd={handleTouchEnd}
          className="welcome-canvas"
        />
        {!ready && (
          <div className="click-prompt">
            Click at least {MIN_CLICKS - clicks} more cell{MIN_CLICKS - clicks !== 1 ? 's' : ''} to continue
          </div>
        )}
      </div>

      <button className="welcome-start-btn" onClick={onStart} disabled={!ready}>
        Start Puzzles →
      </button>
    </div>
  );
};
