import React, { useState, useEffect } from 'react';
import { puzzles } from '../data/puzzles';
import { PuzzleResult, SessionResults } from '../types/index';
import { Grid } from './Grid';
import { SummaryPage } from './SummaryPage';
import './PuzzleFlow.css';

export const PuzzleFlow: React.FC = () => {
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [results, setResults] = useState<PuzzleResult[]>([]);
  const [sessionStartTime] = useState(Date.now());
  const [sessionResults, setSessionResults] = useState<SessionResults | null>(null);

  const currentPuzzle = puzzles[currentPuzzleIndex];
  const progress = ((currentPuzzleIndex + 1) / puzzles.length) * 100;

  const handlePuzzleComplete = (puzzleResult: {
    clicks: number;
    timeTaken: number;
    strategy: 'pure additive' | 'additive' | 'subtractive' | 'pure subtractive';
    efficiency: number;
  }) => {
    const result: PuzzleResult = {
      puzzleId: currentPuzzle.id,
      clicks: puzzleResult.clicks,
      optimalClicks: currentPuzzle.optimalClicks,
      timeTaken: puzzleResult.timeTaken,
      strategy: puzzleResult.strategy,
      efficiency: puzzleResult.efficiency,
    };

    const newResults = [...results, result];
    setResults(newResults);

    if (currentPuzzleIndex < puzzles.length - 1) {
      setCurrentPuzzleIndex(currentPuzzleIndex + 1);
    } else {
      const endTime = Date.now();
      setSessionResults({
        sessionId: `session-${endTime}`,
        puzzles: newResults,
        totalClicks: newResults.reduce((sum, r) => sum + r.clicks, 0),
        totalTime: endTime - sessionStartTime,
        averageEfficiency:
          Math.round(newResults.reduce((sum, r) => sum + r.efficiency, 0) / newResults.length) || 0,
        startTime: sessionStartTime,
        endTime,
      });
    }
  };

  // Fire-and-forget submission — runs exactly once when sessionResults is set
  useEffect(() => {
    if (!sessionResults) return;
    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionResults),
    }).catch(() => {});
  }, [sessionResults]);

  if (sessionResults) {
    return (
      <SummaryPage
        sessionResults={sessionResults}
        onRestart={() => {
          setCurrentPuzzleIndex(0);
          setResults([]);
          setSessionResults(null);
        }}
      />
    );
  }

  return (
    <div className="puzzle-flow">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="puzzle-counter">
        Puzzle {currentPuzzleIndex + 1} of {puzzles.length}
      </div>
      <Grid key={currentPuzzle.id} puzzle={currentPuzzle} onComplete={handlePuzzleComplete} />
    </div>
  );
};
