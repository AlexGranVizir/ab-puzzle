import React, { useEffect, useState } from 'react';
import { SessionResults } from '../types/index';
import './StrategyDistributionPlot.css';

const SCORE: Record<string, number> = {
  'pure subtractive': 1,
  'subtractive': 2,
  'additive': 3,
  'pure additive': 4,
};

interface Props {
  userSession: SessionResults;
}

export const StrategyDistributionPlot: React.FC<Props> = ({ userSession }) => {
  const [sessions, setSessions] = useState<SessionResults[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = () => {
    setLoading(true);
    fetch('/api/sessions')
      .then(r => r.json())
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(fetchSessions, []);

  const avgScore = (s: SessionResults) =>
    s.puzzles.reduce((sum, p) => sum + (SCORE[p.strategy] ?? 2.5), 0) / s.puzzles.length;

  const userScore = avgScore(userSession);
  const others = sessions.filter(s => s.sessionId !== userSession.sessionId);
  const otherScores = others.map(avgScore);

  const pct =
    others.length > 0
      ? Math.round((otherScores.filter(s => s < userScore).length / others.length) * 100)
      : 50;

  const lean =
    userScore <= 1.5 ? 'pure subtractive' :
    userScore <= 2.5 ? 'subtractive' :
    userScore <= 3.5 ? 'additive' : 'pure additive';

  const W = 580;
  const ML = 20;
  const MR = 20;
  const plotW = W - ML - MR;
  const STRIP_H = 20;
  const ARROW_H = 12;
  const END_LABEL_Y = 13;         // "pure subtractive" / "pure additive" sit here
  const STRIP_TOP = END_LABEL_Y + 8 + ARROW_H; // gap + arrow height below labels
  const H = STRIP_TOP + STRIP_H + 32;
  const pctX = ML + (pct / 100) * plotW;

  return (
    <div className="strategy-plot">
      <div className="plot-header">
        <h2>How you compare</h2>
        <button className="refresh-button" onClick={fetchSessions} disabled={loading}>
          {loading ? '…' : '↻ Refresh'}
        </button>
      </div>
      {loading ? (
        <p className="plot-loading">Loading…</p>
      ) : others.length === 0 ? (
        <p className="plot-caption">You're the first participant — no comparison data yet.</p>
      ) : (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} className="plot-svg" overflow="visible" aria-label="Strategy percentile">
            <defs>
              <linearGradient id="pctGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#5c6bc0" />
                <stop offset="50%" stopColor="#80cbc4" />
                <stop offset="100%" stopColor="#ff7043" />
              </linearGradient>
            </defs>

            {/* End labels — above the arrow */}
            <text x={ML} y={END_LABEL_Y} textAnchor="start" fontSize="10" fill="#888">
              pure subtractive
            </text>
            <text x={W - MR} y={END_LABEL_Y} textAnchor="end" fontSize="10" fill="#888">
              pure additive
            </text>

            {/* Strip */}
            <rect
              x={ML} y={STRIP_TOP}
              width={plotW} height={STRIP_H}
              rx={STRIP_H / 2}
              fill="url(#pctGrad)"
              opacity="0.85"
            />

            {/* Arrow */}
            <polygon
              points={`${pctX},${STRIP_TOP - 1} ${pctX - 6},${STRIP_TOP - ARROW_H} ${pctX + 6},${STRIP_TOP - ARROW_H}`}
              fill="#e53935"
            />

            {/* Caption */}
            <text x={W / 2} y={STRIP_TOP + STRIP_H + 20} textAnchor="middle" fontSize="13" fill="#444">
              You lean towards <tspan fontWeight="bold">{lean}</tspan>
            </text>
          </svg>

          <p className="plot-caption">
            Based on {others.length} other participant{others.length !== 1 ? 's' : ''}.
          </p>
        </>
      )}
    </div>
  );
};
