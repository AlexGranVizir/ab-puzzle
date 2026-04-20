import React, { useState, useEffect, useCallback } from 'react';
import { SessionResults, PuzzleResult } from '../types/index';
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
  'pure subtractive': '#1b5e20',
  'subtractive':      '#2e7d32',
  'additive':         '#66bb6a',
  'pure additive':    '#a5d6a7',
};

const Bar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => (
  <div className="bar-track">
    <div className="bar-fill" style={{ width: max ? `${(value / max) * 100}%` : '0%', background: color }} />
    <span className="bar-label">{value}</span>
  </div>
);

const puzzleStrategies: Strategy[] = ['pure subtractive', 'subtractive', 'additive', 'pure additive'];

export const StatsPage: React.FC = () => {
  const [sessions, setSessions] = useState<SessionResults[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(() => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then(data => {
        setSessions(prev => data.length !== prev.length ? data : prev);
        setError(null);
      })
      .catch(() => setError('Failed to load sessions from server.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 10000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  if (loading) {
    return <div className="stats-page"><h2>Statistics</h2><p className="no-data">Loading…</p></div>;
  }

  if (error) {
    return <div className="stats-page"><h2>Statistics</h2><p className="no-data">{error}</p></div>;
  }

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

  const maxPuzzleStrategyCount = Math.max(
    ...perPuzzle.flatMap(p => puzzleStrategies.map(strategy => p.strategyCounts[strategy] ?? 0))
  );

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

      <h3>Strategy distribution by puzzle</h3>
      <div className="strategy-puzzle-grid">
        {perPuzzle.map((p: PuzzleStat) => (
          <section key={p.id} className="strategy-puzzle-card">
            <div className="strategy-puzzle-header">
              <h4>Puzzle {p.id}</h4>
              <span>{p.n} run{p.n !== 1 ? 's' : ''}</span>
            </div>
            <div className="strategy-dist">
              {puzzleStrategies.map(strategy => {
                const count = p.strategyCounts[strategy] ?? 0;
                return (
                  <div key={`${p.id}-${strategy}`} className="strategy-row">
                    <div className="strategy-name">{strategyLabel[strategy]}</div>
                    <Bar value={count} max={maxPuzzleStrategyCount} color={stratColors[strategy]} />
                    <div className="strategy-pct">{pct((count / p.n) * 100)}</div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};
