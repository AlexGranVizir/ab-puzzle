import React, { useState } from 'react';
import { PuzzleFlow } from './components/PuzzleFlow';
import { PuzzleDesigner } from './components/PuzzleDesigner';
import { StatsPage } from './components/StatsPage';
import './App.css';

const DESIGNER_ENABLED = process.env.REACT_APP_DESIGNER === 'true';
const IS_STATS = window.location.pathname === '/stats';

function App() {
  const [mode, setMode] = useState<'play' | 'design'>('play');

  if (IS_STATS) {
    return (
      <div className="App">
        <header className="app-header">
          <h1>Grid Symmetry Puzzles</h1>
          <p>Submission statistics</p>
        </header>
        <main className="app-main">
          <StatsPage />
        </main>
        <footer className="app-footer">
          <p>Made by Claude for Gran Vizir</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>Grid Symmetry Puzzles</h1>
        <p>Solve 5 puzzles using as few clicks as possible</p>
        {DESIGNER_ENABLED && (
          <button
            className="mode-toggle"
            onClick={() => setMode(m => m === 'play' ? 'design' : 'play')}
          >
            {mode === 'play' ? '✏️ Designer' : '▶ Play'}
          </button>
        )}
      </header>
      <main className="app-main">
        {mode === 'play' || !DESIGNER_ENABLED ? <PuzzleFlow /> : <PuzzleDesigner />}
      </main>
      <footer className="app-footer">
        <p>Made by Claude for Gran Vizir</p>
      </footer>
    </div>
  );
}

export default App;
