import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GridState } from '../types/index';
import { computeOptimalClicks } from '../utils/strategyAnalyzer';
import './PuzzleDesigner.css';

const GRID_SIZE = 10;
const CELL_SIZE = 40;
const GRID_PADDING = 10;
const CANVAS_SIZE = GRID_PADDING * 2 + GRID_SIZE * CELL_SIZE;

const emptyGrid = (): GridState =>
  Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));

const gridToCode = (g: GridState, idx: number, optimal: number): string => {
  const cells: string[] = [];
  for (let r = 0; r < GRID_SIZE; r++)
    for (let c = 0; c < GRID_SIZE; c++)
      if (g[r][c]) cells.push(`    g[${r}][${c}] = true;`);
  return [
    `const puzzle${idx + 1}: Puzzle = {`,
    `  id: ${idx + 1},`,
    `  title: 'Puzzle ${idx + 1}',`,
    `  description: 'Achieve symmetry across all four quadrants using as few clicks as possible.',`,
    `  optimalClicks: ${optimal},`,
    `  initialState: (() => {`,
    `    const g = createGrid();`,
    ...cells,
    `    return g;`,
    `  })(),`,
    `};`,
  ].join('\n');
};

export const PuzzleDesigner: React.FC = () => {
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [allGrids, setAllGrids] = useState<GridState[]>(
    Array(5).fill(null).map(emptyGrid)
  );
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isPainting = useRef(false);
  const paintValue = useRef<boolean>(true);

  const currentGrid = allGrids[puzzleIdx];
  const optimal = computeOptimalClicks(currentGrid);

  const draw = useCallback((g: GridState) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const x = GRID_PADDING + c * CELL_SIZE;
        const y = GRID_PADDING + r * CELL_SIZE;
        if (g[r][c]) {
          ctx.fillStyle = '#4CAF50';
          ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        }
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    }
  }, []);

  useEffect(() => { draw(currentGrid); }, [currentGrid, draw]);

  const cellAt = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const col = Math.floor((e.clientX - rect.left - GRID_PADDING) / CELL_SIZE);
    const row = Math.floor((e.clientY - rect.top - GRID_PADDING) / CELL_SIZE);
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return null;
    return { row, col };
  };

  const toggle = (row: number, col: number, value: boolean) => {
    setAllGrids(prev => {
      const next = prev.map((g, i) =>
        i === puzzleIdx ? g.map((r, ri) => r.map((c, ci) => ri === row && ci === col ? value : c)) : g
      );
      return next;
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cell = cellAt(e);
    if (!cell) return;
    isPainting.current = true;
    paintValue.current = !currentGrid[cell.row][cell.col];
    toggle(cell.row, cell.col, paintValue.current);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPainting.current) return;
    const cell = cellAt(e);
    if (!cell) return;
    toggle(cell.row, cell.col, paintValue.current);
  };

  const handleMouseUp = () => { isPainting.current = false; };

  const clearGrid = () =>
    setAllGrids(prev => prev.map((g, i) => i === puzzleIdx ? emptyGrid() : g));

  const copyAll = () => {
    const code = [
      `import { Puzzle, GridState } from '../types/index';`,
      ``,
      `const createGrid = (): GridState =>`,
      `  Array(10).fill(null).map(() => Array(10).fill(false));`,
      ``,
      ...allGrids.map((g, i) => gridToCode(g, i, computeOptimalClicks(g))),
      ``,
      `export const puzzles: Puzzle[] = [puzzle1, puzzle2, puzzle3, puzzle4, puzzle5];`,
    ].join('\n');
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="designer">
      <div className="designer-header">
        <h2>Puzzle Designer</h2>
        <p>Click or drag to draw cells. Switch between puzzles to design all 5.</p>
      </div>

      <div className="designer-tabs">
        {[0, 1, 2, 3, 4].map(i => (
          <button
            key={i}
            className={`tab-btn ${puzzleIdx === i ? 'active' : ''}`}
            onClick={() => setPuzzleIdx(i)}
          >
            Puzzle {i + 1}
          </button>
        ))}
      </div>

      <div className="designer-body">
        <div className="designer-canvas-area">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="designer-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          <button className="clear-btn" onClick={clearGrid}>Clear</button>
        </div>

        <div className="designer-code">
          <div className="optimal-display">
            Optimal clicks: <strong>{optimal}</strong>
          </div>
          <pre>{gridToCode(currentGrid, puzzleIdx, optimal)}</pre>
          <button className="copy-btn" onClick={copyAll}>
            {copied ? '✓ Copied!' : 'Copy all 5 puzzles'}
          </button>
        </div>
      </div>
    </div>
  );
};
