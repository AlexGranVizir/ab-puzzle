import { expect, Page, TestInfo, test } from '@playwright/test';

const GRID_SIZE = 10;
const CELL_SIZE = 40;
const GRID_PADDING = 10;

function getCellCenter(row: number, col: number) {
  return {
    x: GRID_PADDING + col * CELL_SIZE + CELL_SIZE / 2,
    y: GRID_PADDING + row * CELL_SIZE + CELL_SIZE / 2,
  };
}

async function clickCell(page: Page, row: number, col: number) {
  const canvas = page.locator('.grid-canvas');
  const point = getCellCenter(row, col);
  await canvas.click({ position: point });
}

async function readGridState(page: Page): Promise<boolean[][]> {
  return page.locator('.grid-canvas').evaluate((canvas, cfg) => {
    const ctx = (canvas as HTMLCanvasElement).getContext('2d');
    if (!ctx) throw new Error('2D context not available');

    const grid = Array.from({ length: cfg.gridSize }, () => Array(cfg.gridSize).fill(false));
    for (let row = 0; row < cfg.gridSize; row++) {
      for (let col = 0; col < cfg.gridSize; col++) {
        const x = Math.floor(cfg.padding + col * cfg.cellSize + cfg.cellSize / 2);
        const y = Math.floor(cfg.padding + row * cfg.cellSize + cfg.cellSize / 2);
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const greenDominant = pixel[1] - pixel[0] > 40 && pixel[1] - pixel[2] > 40;
        grid[row][col] = greenDominant;
      }
    }
    return grid;
  }, { gridSize: GRID_SIZE, cellSize: CELL_SIZE, padding: GRID_PADDING });
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

function findFirstCell(grid: boolean[][], target: boolean): [number, number] | null {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === target) return [row, col];
    }
  }
  return null;
}

async function applyHumanVariation(page: Page, puzzleIndex: number) {
  const grid = await readGridState(page);

  // Alternate detour style across puzzles:
  // even puzzle indexes bias additive clicks, odd indexes bias subtractive clicks.
  const targetCell = puzzleIndex % 2 === 0
    ? findFirstCell(grid, false)
    : findFirstCell(grid, true);

  if (!targetCell) return;

  const [row, col] = targetCell;
  await clickCell(page, row, col);
  await clickCell(page, row, col);
  await clickCell(page, row, col);
}

test('real e2e: completes all puzzles and persists session', async ({ page, request }, testInfo) => {
  const sessionsBefore = await fetchSessions(request);
  const initialCount = sessionsBefore.length;

  await page.goto('/');
  await saveCheckpointScreenshot(page, testInfo, 'start');

  for (let puzzleIndex = 0; puzzleIndex < 5; puzzleIndex++) {
    await expect(page.getByText(`Puzzle ${puzzleIndex + 1} of 5`)).toBeVisible();
    await saveCheckpointScreenshot(page, testInfo, `puzzle-${puzzleIndex + 1}-before`);

    for (let attempt = 0; attempt < 3; attempt++) {
      const grid = await readGridState(page);
      if (is4WaySymmetric(grid)) break;

      const puzzleClicks = computeSymmetryFixClicks(grid);
      for (const [row, col] of puzzleClicks) {
        await clickCell(page, row, col);
      }
    }

    await expect(page.getByRole('button', { name: /Next Puzzle/i })).toBeVisible();
    await saveCheckpointScreenshot(page, testInfo, `puzzle-${puzzleIndex + 1}-ready`);
    await page.getByRole('button', { name: /Next Puzzle/i }).click();
  }

  await expect(page.getByRole('heading', { name: 'All done!' })).toBeVisible();
  await saveCheckpointScreenshot(page, testInfo, 'summary');

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

  await page.goto('/');
  await saveCheckpointScreenshot(page, testInfo, 'human-start');

  for (let puzzleIndex = 0; puzzleIndex < 5; puzzleIndex++) {
    await expect(page.getByText(`Puzzle ${puzzleIndex + 1} of 5`)).toBeVisible();
    await saveCheckpointScreenshot(page, testInfo, `human-puzzle-${puzzleIndex + 1}-before`);

    await applyHumanVariation(page, puzzleIndex);

    for (let attempt = 0; attempt < 4; attempt++) {
      const grid = await readGridState(page);
      if (is4WaySymmetric(grid)) break;

      const puzzleClicks = computeSymmetryFixClicks(grid);
      for (const [row, col] of puzzleClicks) {
        await clickCell(page, row, col);
      }
    }

    await expect(page.getByRole('button', { name: /Next Puzzle/i })).toBeVisible();
    await saveCheckpointScreenshot(page, testInfo, `human-puzzle-${puzzleIndex + 1}-ready`);
    await page.getByRole('button', { name: /Next Puzzle/i }).click();
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
