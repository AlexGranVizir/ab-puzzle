import { expect, Page, TestInfo, test } from '@playwright/test';

const GRID_SIZE = 10;
const GRID_PADDING = 10;
const WELCOME_PADDING = 8;

function getCellCenter(row: number, col: number, cellSize: number, padding: number) {
  return {
    x: padding + col * cellSize + cellSize / 2,
    y: padding + row * cellSize + cellSize / 2,
  };
}

async function clickCell(page: Page, row: number, col: number) {
  const canvas = page.locator('.grid-canvas');
  const canvasWidth = await canvas.evaluate((node: HTMLCanvasElement) => node.width);
  const cellSize = (canvasWidth - GRID_PADDING * 2) / GRID_SIZE;
  const point = getCellCenter(row, col, cellSize, GRID_PADDING);
  await canvas.click({ position: point });
}

async function clickWelcomeCell(page: Page, row: number, col: number) {
  const canvas = page.locator('.welcome-canvas');
  const canvasWidth = await canvas.evaluate((node: HTMLCanvasElement) => node.width);
  const cellSize = (canvasWidth - WELCOME_PADDING * 2) / GRID_SIZE;
  const point = getCellCenter(row, col, cellSize, WELCOME_PADDING);
  await canvas.click({ position: point });
}

async function readGridState(page: Page): Promise<boolean[][]> {
  return page.locator('.grid-canvas').evaluate((canvas: HTMLCanvasElement, cfg: { gridSize: number; padding: number }) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context not available');

    const cellSize = (canvas.width - cfg.padding * 2) / cfg.gridSize;

    const grid = Array.from({ length: cfg.gridSize }, () => Array(cfg.gridSize).fill(false));
    for (let row = 0; row < cfg.gridSize; row++) {
      for (let col = 0; col < cfg.gridSize; col++) {
        const x = Math.floor(cfg.padding + col * cellSize + cellSize / 2);
        const y = Math.floor(cfg.padding + row * cellSize + cellSize / 2);
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const greenDominant = pixel[1] - pixel[0] > 40 && pixel[1] - pixel[2] > 40;
        grid[row][col] = greenDominant;
      }
    }
    return grid;
  }, { gridSize: GRID_SIZE, padding: GRID_PADDING });
}

function computeSymmetryFixClicks(grid: boolean[][]): Array<[number, number]> {
  const actions: Array<[number, number]> = [];
  const groups: Array<{
    cells: Array<[number, number]>;
    filledIndexes: number[];
    emptyIndexes: number[];
    costToEmpty: number;
    costToFull: number;
    choose: 'empty' | 'full';
  }> = [];

  let allGroupsChooseEmpty = true;
  let minExtraCost = Infinity;
  let minExtraGroup = -1;

  for (let r = 0; r < GRID_SIZE / 2; r++) {
    for (let c = 0; c < GRID_SIZE / 2; c++) {
      const cells: Array<[number, number]> = [
        [r, c],
        [r, GRID_SIZE - 1 - c],
        [GRID_SIZE - 1 - r, c],
        [GRID_SIZE - 1 - r, GRID_SIZE - 1 - c],
      ];
      const filledIndexes: number[] = [];
      const emptyIndexes: number[] = [];

      cells.forEach(([row, col], i) => {
        if (grid[row][col]) filledIndexes.push(i);
        else emptyIndexes.push(i);
      });

      const costToEmpty = filledIndexes.length;
      const costToFull = emptyIndexes.length;
      const choose: 'empty' | 'full' = costToFull <= costToEmpty ? 'full' : 'empty';

      if (choose === 'full') allGroupsChooseEmpty = false;

      const extraCost = costToFull - costToEmpty;
      if (extraCost < minExtraCost) {
        minExtraCost = extraCost;
        minExtraGroup = groups.length;
      }

      groups.push({ cells, filledIndexes, emptyIndexes, costToEmpty, costToFull, choose });
    }
  }

  if (allGroupsChooseEmpty && minExtraGroup >= 0) {
    groups[minExtraGroup].choose = 'full';
  }

  for (const group of groups) {
    const indexes = group.choose === 'empty' ? group.filledIndexes : group.emptyIndexes;
    for (const i of indexes) {
      actions.push(group.cells[i]);
    }
  }

  return actions;
}

function getSymmetryGroups(grid: boolean[][]) {
  const groups: Array<{
    cells: Array<[number, number]>;
    trueIndexes: number[];
    falseIndexes: number[];
  }> = [];

  for (let r = 0; r < GRID_SIZE / 2; r++) {
    for (let c = 0; c < GRID_SIZE / 2; c++) {
      const cells: Array<[number, number]> = [
        [r, c],
        [r, GRID_SIZE - 1 - c],
        [GRID_SIZE - 1 - r, c],
        [GRID_SIZE - 1 - r, GRID_SIZE - 1 - c],
      ];

      const trueIndexes: number[] = [];
      const falseIndexes: number[] = [];
      cells.forEach(([row, col], i) => {
        if (grid[row][col]) trueIndexes.push(i);
        else falseIndexes.push(i);
      });

      groups.push({ cells, trueIndexes, falseIndexes });
    }
  }

  return groups;
}

function computePureAdditiveClicks(grid: boolean[][]): Array<[number, number]> {
  const actions: Array<[number, number]> = [];
  for (const group of getSymmetryGroups(grid)) {
    if (group.trueIndexes.length === 0 || group.trueIndexes.length === 4) continue;
    for (const i of group.falseIndexes) {
      actions.push(group.cells[i]);
    }
  }
  return actions;
}

function computePureSubtractiveClicks(grid: boolean[][]): Array<[number, number]> {
  const groups = getSymmetryGroups(grid);
  const fullGroups = groups.filter(g => g.trueIndexes.length === 4);
  const anchorGroup = fullGroups[0];

  // If no fully-filled symmetry group exists, pure subtractive completion cannot
  // end non-empty. Return empty and let test fail explicitly via strategy asserts.
  if (!anchorGroup) return [];

  const actions: Array<[number, number]> = [];
  for (const group of groups) {
    if (group === anchorGroup) continue;
    for (const i of group.trueIndexes) {
      actions.push(group.cells[i]);
    }
  }
  return actions;
}

function is4WaySymmetric(grid: boolean[][]): boolean {
  let hasAnyFilledCell = false;

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c]) hasAnyFilledCell = true;
      if (grid[r][c] !== grid[r][GRID_SIZE - 1 - c]) return false;
      if (grid[r][c] !== grid[GRID_SIZE - 1 - r][c]) return false;
    }
  }

  return hasAnyFilledCell;
}

async function fetchSessions(request: Page['request']): Promise<any[]> {
  const response = await request.get('/api/sessions');
  expect(response.ok()).toBeTruthy();
  return response.json();
}

async function saveCheckpointScreenshot(
  page: Page,
  testInfo: TestInfo,
  label: string
) {
  const fileName = `${testInfo.repeatEachIndex}-${label}.png`;
  await page.screenshot({
    path: testInfo.outputPath(fileName),
    fullPage: true,
  });
}

function randomInt(minInclusive: number, maxInclusive: number): number {
  return Math.floor(Math.random() * (maxInclusive - minInclusive + 1)) + minInclusive;
}

function randomPick<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)];
}

async function startPuzzleSession(page: Page, testInfo: TestInfo, labelPrefix: string) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'How to play' })).toBeVisible();
  await saveCheckpointScreenshot(page, testInfo, `${labelPrefix}welcome`);

  for (const [row, col] of [[1, 1], [4, 4], [7, 2]] as Array<[number, number]>) {
    await clickWelcomeCell(page, row, col);
  }

  const objectivesButton = page.getByRole('button', { name: /Objectives/i });
  await expect(objectivesButton).toBeEnabled();
  await objectivesButton.click();

  await expect(page.getByRole('heading', { name: 'Your objective' })).toBeVisible();
  await saveCheckpointScreenshot(page, testInfo, `${labelPrefix}objective`);
  await page.getByRole('button', { name: /Begin/i }).click();

  await expect(page.getByText('Puzzle 1 of 5')).toBeVisible();
}

async function advanceFromCompletedPuzzle(page: Page) {
  await expect(page.getByRole('button', { name: /Continue/i })).toBeVisible();
  await page.getByRole('button', { name: /Continue/i }).click();
}

function listCellsByState(grid: boolean[][], target: boolean): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === target) cells.push([row, col]);
    }
  }
  return cells;
}

async function applyHumanVariation(page: Page) {
  const grid = await readGridState(page);
  const allCells = listCellsByState(grid, true).concat(listCellsByState(grid, false));
  const filledCells = listCellsByState(grid, true);
  const emptyCells = listCellsByState(grid, false);

  if (allCells.length === 0) return;

  // Human-like "fidgeting": random back-and-forth pairs that waste clicks
  // without changing net state. This guarantees non-optimal behavior.
  const fidgetPairs = randomInt(1, 3);
  for (let i = 0; i < fidgetPairs; i++) {
    const [row, col] = randomPick(allCells);
    await clickCell(page, row, col);
    await clickCell(page, row, col);
  }

  // Random tendency for this puzzle.
  const tendencies = ['additive', 'subtractive', 'indecisive'] as const;
  const tendency = randomPick([...tendencies]);

  if (tendency === 'additive' && emptyCells.length > 0) {
    const [row, col] = randomPick(emptyCells);
    await clickCell(page, row, col);
    return;
  }

  if (tendency === 'subtractive' && filledCells.length > 0) {
    const [row, col] = randomPick(filledCells);
    await clickCell(page, row, col);
    return;
  }

  // Indecisive: toggle the same random cell 3 times (net one change, noisy trace).
  const [row, col] = randomPick(allCells);
  await clickCell(page, row, col);
  await clickCell(page, row, col);
  await clickCell(page, row, col);
}

test('real e2e: completes all puzzles and persists session', async ({ page, request }, testInfo) => {
  const sessionsBefore = await fetchSessions(request);
  const initialCount = sessionsBefore.length;

  await startPuzzleSession(page, testInfo, 'core-');

  for (let puzzleIndex = 0; puzzleIndex < 5; puzzleIndex++) {
    await expect(page.getByText(`Puzzle ${puzzleIndex + 1} of 5`)).toBeVisible();
    await saveCheckpointScreenshot(page, testInfo, `core-puzzle-${puzzleIndex + 1}-before`);

    for (let attempt = 0; attempt < 3; attempt++) {
      const grid = await readGridState(page);
      if (is4WaySymmetric(grid)) break;

      const puzzleClicks = computeSymmetryFixClicks(grid);
      for (const [row, col] of puzzleClicks) {
        await clickCell(page, row, col);
      }
    }

    await expect(page.getByRole('button', { name: /Continue/i })).toBeVisible();
    await saveCheckpointScreenshot(page, testInfo, `core-puzzle-${puzzleIndex + 1}-ready`);
    await advanceFromCompletedPuzzle(page);
  }

  await expect(page.getByRole('heading', { name: 'All done!' })).toBeVisible();
  await saveCheckpointScreenshot(page, testInfo, 'core-summary');

  await expect
    .poll(async () => {
      const sessions = await fetchSessions(request);
      return sessions.length;
    }, {
      timeout: 10000,
    })
    .toBe(initialCount + 1);

  const sessionsAfter = await fetchSessions(request);
  const latestSession = sessionsAfter[sessionsAfter.length - 1];

  expect(latestSession).toBeTruthy();
  expect(latestSession.puzzles).toHaveLength(5);
  expect(typeof latestSession.totalClicks).toBe('number');
  expect(typeof latestSession.totalTime).toBe('number');
});

test('real e2e: human-like strategy variation is persisted', async ({ page, request }, testInfo) => {
  const sessionsBefore = await fetchSessions(request);
  const initialCount = sessionsBefore.length;

  await startPuzzleSession(page, testInfo, 'human-');

  for (let puzzleIndex = 0; puzzleIndex < 5; puzzleIndex++) {
    await expect(page.getByText(`Puzzle ${puzzleIndex + 1} of 5`)).toBeVisible();
    await saveCheckpointScreenshot(page, testInfo, `human-puzzle-${puzzleIndex + 1}-before`);

    await applyHumanVariation(page);

    for (let attempt = 0; attempt < 4; attempt++) {
      const grid = await readGridState(page);
      if (is4WaySymmetric(grid)) break;

      const puzzleClicks = computeSymmetryFixClicks(grid);
      for (const [row, col] of puzzleClicks) {
        await clickCell(page, row, col);
      }
    }

    await expect(page.getByRole('button', { name: /Continue/i })).toBeVisible();
    await saveCheckpointScreenshot(page, testInfo, `human-puzzle-${puzzleIndex + 1}-ready`);
    await advanceFromCompletedPuzzle(page);
  }

  await expect(page.getByRole('heading', { name: 'All done!' })).toBeVisible();
  await saveCheckpointScreenshot(page, testInfo, 'human-summary');

  await expect
    .poll(async () => {
      const sessions = await fetchSessions(request);
      return sessions.length;
    }, {
      timeout: 10000,
    })
    .toBe(initialCount + 1);

  const sessionsAfter = await fetchSessions(request);
  const latestSession = sessionsAfter[sessionsAfter.length - 1];

  expect(latestSession).toBeTruthy();
  expect(latestSession.puzzles).toHaveLength(5);

  const totalOptimalClicks = latestSession.puzzles.reduce(
    (sum: number, puzzle: any) => sum + puzzle.optimalClicks,
    0
  );
  const hasNonOptimalPuzzle = latestSession.puzzles.some(
    (puzzle: any) => puzzle.clicks > puzzle.optimalClicks
  );

  expect(hasNonOptimalPuzzle).toBeTruthy();
  expect(latestSession.totalClicks).toBeGreaterThan(totalOptimalClicks);
  expect(latestSession.averageEfficiency).toBeLessThan(100);
});

test('real e2e: pure additive strategy is persisted', async ({ page, request }, testInfo) => {
  const sessionsBefore = await fetchSessions(request);
  const initialCount = sessionsBefore.length;

  await startPuzzleSession(page, testInfo, 'pure-add-');

  for (let puzzleIndex = 0; puzzleIndex < 5; puzzleIndex++) {
    await expect(page.getByText(`Puzzle ${puzzleIndex + 1} of 5`)).toBeVisible();
    const grid = await readGridState(page);
    const puzzleClicks = computePureAdditiveClicks(grid);

    for (const [row, col] of puzzleClicks) {
      await clickCell(page, row, col);
    }

    await expect(page.getByRole('button', { name: /Continue/i })).toBeVisible();
    await saveCheckpointScreenshot(page, testInfo, `pure-add-puzzle-${puzzleIndex + 1}-ready`);
    await advanceFromCompletedPuzzle(page);
  }

  await expect(page.getByRole('heading', { name: 'All done!' })).toBeVisible();
  await saveCheckpointScreenshot(page, testInfo, 'pure-add-summary');

  await expect
    .poll(async () => {
      const sessions = await fetchSessions(request);
      return sessions.length;
    }, {
      timeout: 10000,
    })
    .toBe(initialCount + 1);

  const sessionsAfter = await fetchSessions(request);
  const latestSession = sessionsAfter[sessionsAfter.length - 1];

  expect(latestSession.puzzles).toHaveLength(5);
  for (const puzzle of latestSession.puzzles) {
    expect(puzzle.strategy).toBe('pure additive');
  }
});

test('real e2e: pure subtractive strategy is persisted', async ({ page, request }, testInfo) => {
  const sessionsBefore = await fetchSessions(request);
  const initialCount = sessionsBefore.length;

  await startPuzzleSession(page, testInfo, 'pure-sub-');

  for (let puzzleIndex = 0; puzzleIndex < 5; puzzleIndex++) {
    await expect(page.getByText(`Puzzle ${puzzleIndex + 1} of 5`)).toBeVisible();
    const grid = await readGridState(page);
    const puzzleClicks = computePureSubtractiveClicks(grid);

    for (const [row, col] of puzzleClicks) {
      await clickCell(page, row, col);
    }

    await expect(page.getByRole('button', { name: /Continue/i })).toBeVisible();
    await saveCheckpointScreenshot(page, testInfo, `pure-sub-puzzle-${puzzleIndex + 1}-ready`);
    await advanceFromCompletedPuzzle(page);
  }

  await expect(page.getByRole('heading', { name: 'All done!' })).toBeVisible();
  await saveCheckpointScreenshot(page, testInfo, 'pure-sub-summary');

  await expect
    .poll(async () => {
      const sessions = await fetchSessions(request);
      return sessions.length;
    }, {
      timeout: 10000,
    })
    .toBe(initialCount + 1);

  const sessionsAfter = await fetchSessions(request);
  const latestSession = sessionsAfter[sessionsAfter.length - 1];

  expect(latestSession.puzzles).toHaveLength(5);
  for (const puzzle of latestSession.puzzles) {
    expect(puzzle.strategy).toBe('pure subtractive');
  }
});
