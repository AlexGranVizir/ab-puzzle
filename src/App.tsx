import React, { useState } from 'react';
import { PuzzleFlow } from './components/PuzzleFlow';
import { PuzzleDesigner } from './components/PuzzleDesigner';
import './App.css';

const DESIGNER_ENABLED = process.env.REACT_APP_DESIGNER === 'true';

function App() {
  const [mode, setMode] = useState<'play' | 'design'>('play');

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
        <p>Grid Symmetry Puzzles</p>
      </footer>
    </div>
  );
}

export default App;
