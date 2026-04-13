import React from 'react';
import { SessionResults } from '../types/index';
import { StrategyDistributionPlot } from './StrategyDistributionPlot';
import './SummaryPage.css';

interface SummaryPageProps {
  sessionResults: SessionResults;
  onRestart: () => void;
}

export const SummaryPage: React.FC<SummaryPageProps> = ({
  sessionResults,
  onRestart,
}) => {
  const totalTimeSeconds = Math.round(sessionResults.totalTime / 1000);

  return (
    <div className="summary-page">
      <div className="summary-header">
        <h1>All done!</h1>
        <p>Here is a summary of your results across all 5 puzzles:</p>
      </div>

      <div className="summary-stats">
        <div className="stat-card">
          <div className="stat-label">Total Clicks</div>
          <div className="stat-value">{sessionResults.totalClicks}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Efficiency</div>
          <div className="stat-value">{sessionResults.averageEfficiency}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Time</div>
          <div className="stat-value">{totalTimeSeconds}s</div>
        </div>
      </div>

      <div className="puzzle-results">
        <h2>Per Puzzle</h2>
        <table className="results-table">
          <thead>
            <tr>
              <th>Puzzle</th>
              <th>Clicks</th>
              <th>Optimal</th>
              <th>Time</th>
              <th>Strategy Used</th>
            </tr>
          </thead>
          <tbody>
            {sessionResults.puzzles.map((puzzle, idx) => (
              <tr key={puzzle.puzzleId}>
                <td>Puzzle {idx + 1}</td>
                <td>{puzzle.clicks}</td>
                <td>{puzzle.optimalClicks}</td>
                <td>{Math.round(puzzle.timeTaken / 1000)}s</td>
                <td>{puzzle.strategy.charAt(0).toUpperCase() + puzzle.strategy.slice(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <StrategyDistributionPlot userSession={sessionResults} />

      <button className="restart-button" onClick={onRestart}>
        ↻ Retry Puzzles
      </button>
    </div>
  );
};
