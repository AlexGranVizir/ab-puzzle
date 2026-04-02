import { GridClick, GridState } from '../types/index';

export type Strategy = 'additive' | 'subtractive' | 'mixed';

/**
 * Infer the strategy used by analyzing click history
 * - Additive: More cells were toggled from false→true
 * - Subtractive: More cells were toggled from true→false
 * - Mixed: Roughly equal amounts of both
 */
export function inferStrategy(
  initialState: GridState,
  clickHistory: GridClick[],
  finalState: GridState
): Strategy {
  if (clickHistory.length === 0) return 'mixed';

  let addedCount = 0;
  let removedCount = 0;

  // Reconstruct grid state after each click to determine if cells were added or removed
  const grid = initialState.map(row => [...row]);

  clickHistory.forEach(click => {
    const wasFilled = grid[click.row][click.col];
    if (wasFilled) {
      removedCount++;
    } else {
      addedCount++;
    }
    grid[click.row][click.col] = !grid[click.row][click.col];
  });

  const ratio = addedCount / (removedCount || 1); // Handle division by zero

  if (ratio > 1.5) return 'additive';
  if (ratio < 0.67) return 'subtractive'; // Less than 2/3 ratio means more removing
  return 'mixed';
}

/**
 * Check whether a grid has 4-way symmetry.
 * For every cell [r][c]: must match [r][9-c], [9-r][c], and [9-r][9-c].
 * An all-empty grid is not considered complete.
 */
export function is4WaySymmetric(grid: GridState): boolean {
  const hasAnyCells = grid.some(row => row.some(cell => cell));
  if (!hasAnyCells) return false;

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      if (grid[r][c] !== grid[r][9 - c]) return false;
      if (grid[r][c] !== grid[9 - r][c]) return false;
    }
  }
  return true;
}


export function calculateEfficiency(optimalClicks: number, actualClicks: number): number {
  if (actualClicks === 0) return 0;
  return Math.round((optimalClicks / actualClicks) * 100);
}

/**
 * Compute the exact minimum number of clicks to reach any valid 4-way symmetric state.
 *
 * The 10×10 grid decomposes into exactly 25 independent symmetry groups, each
 * containing 4 cells: (r,c), (r,9-c), (9-r,c), (9-r,9-c)  for r∈[0,4], c∈[0,4].
 *
 * For each group, the cheapest fix is min(#filled, #empty).
 * Summing across all groups gives the global optimum.
 *
 * Edge case: if every group is cheapest as all-false the result would be the
 * empty grid (invalid). In that case we pay the extra cost to keep the
 * cheapest group as all-true instead.
 */
export function computeOptimalClicks(grid: GridState): number {
  let total = 0;
  let allGroupsGoEmpty = true;
  let minExtraCost = Infinity;  // cheapest penalty to keep one group non-empty

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const trueCount = [
        grid[r][c],
        grid[r][9 - c],
        grid[9 - r][c],
        grid[9 - r][9 - c],
      ].filter(Boolean).length;

      const costToEmpty = trueCount;
      const costToFull  = 4 - trueCount;
      const minCost = Math.min(costToEmpty, costToFull);
      total += minCost;

      if (costToFull <= costToEmpty) allGroupsGoEmpty = false;
      // Extra cost to make this group all-true instead of all-false
      minExtraCost = Math.min(minExtraCost, costToFull - costToEmpty);
    }
  }

  // If every group greedily chose all-false, the result is an empty grid (invalid).
  // Pay the minimum extra cost to flip the cheapest group to all-true.
  if (allGroupsGoEmpty) total += minExtraCost;

  return total;
}

/**
 * Analyze efficiency trend across multiple puzzles
 */
export function analyzeEfficiencyTrend(efficiencies: number[]): {
  average: number;
  trend: 'improving' | 'declining' | 'stable';
} {
  if (efficiencies.length === 0) {
    return { average: 0, trend: 'stable' };
  }

  const average = Math.round(
    efficiencies.reduce((sum, e) => sum + e, 0) / efficiencies.length
  );

  if (efficiencies.length < 2) {
    return { average, trend: 'stable' };
  }

  const firstHalf = efficiencies.slice(0, Math.ceil(efficiencies.length / 2));
  const secondHalf = efficiencies.slice(Math.ceil(efficiencies.length / 2));

  const firstAvg = firstHalf.reduce((sum, e) => sum + e, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, e) => sum + e, 0) / secondHalf.length;

  if (secondAvg > firstAvg + 5) return { average, trend: 'improving' };
  if (secondAvg < firstAvg - 5) return { average, trend: 'declining' };
  return { average, trend: 'stable' };
}
