import { Puzzle, GridState } from '../types/index';

const createGrid = (): GridState =>
  Array(10).fill(null).map(() => Array(10).fill(false));

const puzzle1: Puzzle = {
  id: 1,
  title: 'Puzzle 1',
  description: 'Achieve symmetry across all four quadrants using as few clicks as possible.',
  optimalClicks: 3,
  initialState: (() => {
    const g = createGrid();
    g[1][0] = true;
    g[2][0] = true;
    g[2][2] = true;
    g[2][3] = true;
    g[2][4] = true;
    g[2][5] = true;
    g[2][6] = true;
    g[2][7] = true;
    g[3][0] = true;
    g[3][2] = true;
    g[3][3] = true;
    g[3][4] = true;
    g[3][5] = true;
    g[3][6] = true;
    g[3][7] = true;
    g[4][2] = true;
    g[4][3] = true;
    g[4][6] = true;
    g[4][7] = true;
    g[5][2] = true;
    g[5][3] = true;
    g[5][6] = true;
    g[5][7] = true;
    g[6][2] = true;
    g[6][3] = true;
    g[6][4] = true;
    g[6][5] = true;
    g[6][6] = true;
    g[6][7] = true;
    g[7][2] = true;
    g[7][3] = true;
    g[7][4] = true;
    g[7][5] = true;
    g[7][6] = true;
    g[7][7] = true;
    return g;
  })(),
};
const puzzle2: Puzzle = {
  id: 2,
  title: 'Puzzle 2',
  description: 'Achieve symmetry across all four quadrants using as few clicks as possible.',
  optimalClicks: 6,
  initialState: (() => {
    const g = createGrid();
    g[2][0] = true;
    g[2][1] = true;
    g[2][2] = true;
    g[2][3] = true;
    g[2][4] = true;
    g[2][5] = true;
    g[2][6] = true;
    g[2][7] = true;
    g[2][8] = true;
    g[2][9] = true;
    g[4][0] = true;
    g[4][1] = true;
    g[4][2] = true;
    g[4][3] = true;
    g[4][4] = true;
    g[4][5] = true;
    g[4][6] = true;
    g[4][7] = true;
    g[4][8] = true;
    g[4][9] = true;
    g[5][0] = true;
    g[5][1] = true;
    g[5][2] = true;
    g[5][3] = true;
    g[5][4] = true;
    g[5][5] = true;
    g[5][6] = true;
    g[5][7] = true;
    g[5][8] = true;
    g[5][9] = true;
    g[7][0] = true;
    g[7][1] = true;
    g[7][2] = true;
    g[7][3] = true;
    g[7][4] = true;
    g[7][5] = true;
    g[7][6] = true;
    g[7][7] = true;
    g[7][8] = true;
    g[7][9] = true;
    g[8][6] = true;
    g[8][8] = true;
    g[8][9] = true;
    g[9][6] = true;
    g[9][8] = true;
    g[9][9] = true;
    return g;
  })(),
};
const puzzle3: Puzzle = {
  id: 3,
  title: 'Puzzle 3',
  description: 'Achieve symmetry across all four quadrants using as few clicks as possible.',
  optimalClicks: 6,
  initialState: (() => {
    const g = createGrid();
    g[0][6] = true;
    g[0][7] = true;
    g[1][6] = true;
    g[1][7] = true;
    g[2][6] = true;
    g[2][7] = true;
    g[3][0] = true;
    g[3][1] = true;
    g[3][4] = true;
    g[3][5] = true;
    g[3][8] = true;
    g[3][9] = true;
    g[4][0] = true;
    g[4][1] = true;
    g[4][4] = true;
    g[4][5] = true;
    g[4][8] = true;
    g[4][9] = true;
    g[5][0] = true;
    g[5][1] = true;
    g[5][4] = true;
    g[5][5] = true;
    g[5][8] = true;
    g[5][9] = true;
    g[6][0] = true;
    g[6][1] = true;
    g[6][4] = true;
    g[6][5] = true;
    g[6][8] = true;
    g[6][9] = true;
    return g;
  })(),
};
const puzzle4: Puzzle = {
  id: 4,
  title: 'Puzzle 4',
  description: 'Achieve symmetry across all four quadrants using as few clicks as possible.',
  optimalClicks: 6,
  initialState: (() => {
    const g = createGrid();
    g[0][0] = true;
    g[0][1] = true;
    g[1][0] = true;
    g[1][1] = true;
    g[3][3] = true;
    g[3][4] = true;
    g[3][5] = true;
    g[3][6] = true;
    g[4][3] = true;
    g[4][4] = true;
    g[4][5] = true;
    g[4][6] = true;
    g[5][3] = true;
    g[5][4] = true;
    g[5][5] = true;
    g[5][6] = true;
    g[6][3] = true;
    g[6][4] = true;
    g[6][5] = true;
    g[6][6] = true;
    g[8][9] = true;
    g[9][9] = true;
    return g;
  })(),
};
const puzzle5: Puzzle = {
  id: 5,
  title: 'Puzzle 5',
  description: 'Achieve symmetry across all four quadrants using as few clicks as possible.',
  optimalClicks: 10,
  initialState: (() => {
    const g = createGrid();
    g[0][1] = true;
    g[0][2] = true;
    g[0][3] = true;
    g[1][1] = true;
    g[1][2] = true;
    g[1][3] = true;
    g[3][3] = true;
    g[3][6] = true;
    g[4][3] = true;
    g[4][6] = true;
    g[5][3] = true;
    g[5][6] = true;
    g[6][3] = true;
    g[6][6] = true;
    g[8][1] = true;
    g[8][2] = true;
    g[9][1] = true;
    g[9][2] = true;
    return g;
  })(),
};

export const puzzles: Puzzle[] = [puzzle1, puzzle2, puzzle3, puzzle4, puzzle5];