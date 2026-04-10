import React, { useEffect, useRef } from 'react';
import './ObjectiveScreen.css';

const N = 10;
const CELL = 28;
const PAD = 8;

// X diagonals + outer border — all 4-way symmetric
const EXAMPLE: boolean[][] = Array(N).fill(null).map((_, r) =>
  Array(N).fill(null).map((_, c) =>
    r === c || r + c === N - 1 ||
    r === 0 || r === N - 1 || c === 0 || c === N - 1
  )
);

const ExampleGrid: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = PAD * 2 + N * CELL;

    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, size, size);

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const x = PAD + c * CELL;
        const y = PAD + r * CELL;
        if (EXAMPLE[r][c]) {
          ctx.fillStyle = '#4CAF50';
          ctx.fillRect(x, y, CELL, CELL);
        }
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, CELL, CELL);
      }
    }

    const mid = PAD + (N / 2) * CELL;
    const end = PAD + N * CELL;

    // Horizontal and vertical midlines
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mid, PAD); ctx.lineTo(mid, end);
    ctx.moveTo(PAD, mid); ctx.lineTo(end, mid);
    ctx.stroke();
  }, []);

  const size = PAD * 2 + N * CELL;
  return <canvas ref={canvasRef} width={size} height={size} className="example-canvas" />;
};

export const ObjectiveScreen: React.FC<{ onBegin: () => void }> = ({ onBegin }) => (
  <div className="objective-screen">
    <h2>Your objective</h2>
    <p>
      You will now be presented with five grids containing colored patterns. For each grid,
      your task is to modify the color of the cells so that the pattern becomes perfectly
      symmetrical both from left to right and from top to bottom.
    </p>
    <p>
      The image below provides an example of a grid that is perfectly symmetrical both
      horizontally and vertically.
    </p>
    <div className="example-area">
      <ExampleGrid />
    </div>
    <p>
      Naturally, there are multiple ways to achieve this goal. However, we ask you to try
      to reach it using the <strong>fewest possible clicks</strong>.
    </p>
    <button className="objective-begin-btn" onClick={onBegin}>
      Begin →
    </button>
  </div>
);
