import React, { useState } from 'react';
import { puzzles } from '../data/puzzles';
import { PuzzleResult, SessionResults } from '../types/index';
import { Grid } from './Grid';
import { SummaryPage } from './SummaryPage';
import './PuzzleFlow.css';

export const PuzzleFlow: React.FC = () => {
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [results, setResults] = useState<PuzzleResult[]>([]);
  const [sessionStartTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);

  const currentPuzzle = puzzles[currentPuzzleIndex];
  const progress = ((currentPuzzleIndex + 1) / puzzles.length) * 100;

  const handlePuzzleComplete = (puzzleResult: {
    clicks: number;
    timeTaken: number;
    clickHistory: any[];
    finalState: any;
    strategy: 'additive' | 'subtractive' | 'mixed';
    efficiency: number;
  }) => {
    const result: PuzzleResult = {
      puzzleId: currentPuzzle.id,
      clicks: puzzleResult.clicks,
      optimalClicks: currentPuzzle.optimalClicks,
      timeTaken: puzzleResult.timeTaken,
      finalState: puzzleResult.finalState,
      clickHistory: puzzleResult.clickHistory,
      strategy: puzzleResult.strategy,
      efficiency: puzzleResult.efficiency,
    };

    const newResults = [...results, result];
    setResults(newResults);

    // Move to next puzzle or show summary
    if (currentPuzzleIndex < puzzles.length - 1) {
      setCurrentPuzzleIndex(currentPuzzleIndex + 1);
    } else {
      setIsComplete(true);
    }
  };

  if (isComplete) {
    const sessionResults: SessionResults = {
      sessionId: `session-${Date.now()}`,
      puzzles: results,
      totalClicks: results.reduce((sum, r) => sum + r.clicks, 0),
      totalTime: Date.now() - sessionStartTime,
      averageEfficiency:
        Math.round(
          results.reduce((sum, r) => sum + r.efficiency, 0) / results.length
        ) || 0,
      startTime: sessionStartTime,
      endTime: Date.now(),
    };

    return (
      <SummaryPage
        sessionResults={sessionResults}
        onRestart={() => {
          setCurrentPuzzleIndex(0);
          setResults([]);
          setIsComplete(false);
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
