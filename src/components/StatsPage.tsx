import React, { useState } from 'react';
import { SessionResults, PuzzleResult } from '../types/index';
import { loadSessions } from '../utils/storage';
import { puzzles } from '../data/puzzles';
import './StatsPage.css';

type Strategy = PuzzleResult['strategy'];

interface PuzzleStat {
  id: number;
  optimal: number;
  avgClicks: number;
  avgTime: number;
  avgEfficiency: number;
  strategyCounts: Record<string, number>;
  dominantStrategy: Strategy;
  n: number;
}

const fmt = (ms: number) => {
  const s = Math.round(ms / 1000);
  return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
};

const pct = (n: number) => `${Math.round(n)}%`;

const avg = (arr: number[]) =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

const strategyLabel: Record<Strategy, string> = {
  'pure additive':    'Pure additive',
  'additive':         'Additive',
  'subtractive':      'Subtractive',
  'pure subtractive': 'Pure subtractive',
};

const stratColors: Record<Strategy, string> = {
  'pure subtractive': '#1565c0',
  'subtractive':      '#42a5f5',
  'additive':         '#ef9a9a',
  'pure additive':    '#c62828',
};

const Bar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => (
  <div className="bar-track">
    <div className="bar-fill" style={{ width: max ? `${(value / max) * 100}%` : '0%', background: color }} />
    <span className="bar-label">{value}</span>
  </div>
);

export const StatsPage: React.FC = () => {
  const [sessions] = useState<SessionResults[]>(loadSessions);

  if (sessions.length === 0) {
    return (
      <div className="stats-page">
        <h2>Statistics</h2>
        <p className="no-data">No sessions recorded yet. Complete a puzzle session to see stats here.</p>
      </div>
    );
  }

  const allPuzzleResults = sessions.flatMap(s => s.puzzles);

  const totalSessions    = sessions.length;
  const avgTotalClicks   = avg(sessions.map(s => s.totalClicks));
  const avgTotalTime     = avg(sessions.map(s => s.totalTime));
  const avgEfficiencyAll = avg(sessions.map(s => s.averageEfficiency));

  const perPuzzle: PuzzleStat[] = puzzles.map(p => {
    const rows = allPuzzleResults.filter(r => r.puzzleId === p.id);
    if (!rows.length) return null;
    const strategyCounts = rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.strategy] = (acc[r.strategy] ?? 0) + 1;
      return acc;
    }, {});
    const dominantStrategy = Object.entries(strategyCounts)
      .sort((a, b) => b[1] - a[1])[0][0] as Strategy;
    return {
      id: p.id,
      optimal: p.optimalClicks,
      avgClicks: avg(rows.map(r => r.clicks)),
      avgTime: avg(rows.map(r => r.timeTaken)),
      avgEfficiency: avg(rows.map(r => r.efficiency)),
      strategyCounts,
      dominantStrategy,
      n: rows.length,
    };
  }).filter((x): x is PuzzleStat => x !== null);

  const strategies: Strategy[] = ['pure subtractive', 'subtractive', 'additive', 'pure additive'];
  const strategyTotals = strategies.reduce<Record<string, number>>((acc, s) => {
    acc[s] = allPuzzleResults.filter(r => r.strategy === s).length;
    return acc;
  }, {});
  const maxStratCount = Math.max(...Object.values(strategyTotals));

  return (
    <div className="stats-page">
      <h2>Statistics</h2>

      <div className="summary-cards">
        <div className="card">
          <div className="card-value">{totalSessions}</div>
          <div className="card-label">Sessions</div>
        </div>
        <div className="card">
          <div className="card-value">{Math.round(avgTotalClicks)}</div>
          <div className="card-label">Avg total clicks</div>
        </div>
        <div className="card">
          <div className="card-value">{fmt(avgTotalTime)}</div>
          <div className="card-label">Avg total time</div>
        </div>
        <div className="card">
          <div className="card-value">{pct(avgEfficiencyAll)}</div>
          <div className="card-label">Avg efficiency</div>
        </div>
      </div>

      <h3>Per-puzzle breakdown</h3>
      <table className="stats-table">
        <thead>
          <tr>
            <th>Puzzle</th>
            <th>N</th>
            <th>Optimal</th>
            <th>Avg clicks</th>
            <th>Avg efficiency</th>
            <th>Avg time</th>
            <th>Dominant strategy</th>
          </tr>
        </thead>
        <tbody>
          {perPuzzle.map((p: PuzzleStat) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.n}</td>
              <td>{p.optimal}</td>
              <td>{Math.round(p.avgClicks)}</td>
              <td>{pct(p.avgEfficiency)}</td>
              <td>{fmt(p.avgTime)}</td>
              <td><span className="strategy-tag">{strategyLabel[p.dominantStrategy]}</span></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Strategy distribution (all puzzles, all sessions)</h3>
      <div className="strategy-dist">
        {strategies.map(s => (
          <div key={s} className="strategy-row">
            <div className="strategy-name">{strategyLabel[s]}</div>
            <Bar value={strategyTotals[s]} max={maxStratCount} color={stratColors[s]} />
            <div className="strategy-pct">
              {allPuzzleResults.length ? pct((strategyTotals[s] / allPuzzleResults.length) * 100) : '—'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
