// Grid state is a 2D array (10x10) where each cell is true (filled/green) or false (empty/white)
export type GridState = boolean[][];

// Represents a click/action on the grid
export interface GridClick {
  row: number;
  col: number;
  timestamp: number;
}

// Represents results from a single puzzle attempt
export interface PuzzleResult {
  puzzleId: number;
  clicks: number;
  optimalClicks: number;
  timeTaken: number; // in milliseconds
  strategy: 'pure additive' | 'additive' | 'subtractive' | 'pure subtractive';
  efficiency: number; // percentage: (optimalClicks / clicks) * 100
}

// Represents a single puzzle configuration
// No targetState — any 4-way symmetric result is valid
export interface Puzzle {
  id: number;
  initialState: GridState;
  optimalClicks: number; // minimum clicks to reach nearest symmetric state (for post-hoc analysis)
  title: string;
  description?: string;
}

// Overall session results
export interface SessionResults {
  sessionId: string;
  puzzles: PuzzleResult[];
  totalClicks: number;
  totalTime: number;
  averageEfficiency: number;
  startTime: number;
  endTime: number;
}
