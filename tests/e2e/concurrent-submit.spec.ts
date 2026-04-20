import { expect, test } from '@playwright/test';

function makeFakeSession(index: number) {
  const now = Date.now();
  return {
    sessionId: `concurrent-test-${now}-${index}`,
    puzzles: Array.from({ length: 5 }, (_, i) => ({
      puzzleId: i + 1,
      clicks: 3 + index,
      optimalClicks: 3,
      timeTaken: 5000 + index * 100,
      strategy: 'additive' as const,
      efficiency: Math.round((3 / (3 + index)) * 100),
    })),
    totalClicks: (3 + index) * 5,
    totalTime: 25000 + index * 500,
    averageEfficiency: Math.round((3 / (3 + index)) * 100),
    startTime: now - 30000,
    endTime: now,
  };
}

test('concurrent submissions: no sessions are lost', async ({ request }) => {
  const CONCURRENT_USERS = 70;

  const sessionsBefore = await request.get('/api/sessions');
  const initialCount = (await sessionsBefore.json()).length;

  const submissions = Array.from({ length: CONCURRENT_USERS }, (_, i) =>
    request.post('/api/sessions', { data: makeFakeSession(i) })
  );

  const responses = await Promise.all(submissions);

  for (const res of responses) {
    expect(res.status()).toBe(201);
  }

  await new Promise(r => setTimeout(r, 500));

  const sessionsAfter = await request.get('/api/sessions');
  const allSessions = await sessionsAfter.json();
  const newCount = allSessions.length - initialCount;

  expect(newCount).toBe(CONCURRENT_USERS);
});

test('concurrent submissions: server stays responsive under load', async ({ request }) => {
  const CONCURRENT_USERS = 70;
  const MAX_ACCEPTABLE_MS = 2000;

  // Fire 50 POSTs simultaneously and measure how long the slowest one takes.
  // Because the server uses synchronous file I/O, each request blocks the
  // event loop. The last request in the queue must wait for all preceding
  // readFileSync/writeFileSync calls to finish, causing latency to grow
  // linearly with the number of concurrent users.
  const start = Date.now();

  const submissions = Array.from({ length: CONCURRENT_USERS }, (_, i) =>
    request.post('/api/sessions', { data: makeFakeSession(i) })
  );

  const responses = await Promise.all(submissions);
  const totalTime = Date.now() - start;

  for (const res of responses) {
    expect(res.status()).toBe(201);
  }

  // With async I/O or a write queue this should complete well under the limit.
  // With sync I/O the file grows each iteration, making serialized reads/writes
  // progressively slower — this assertion will eventually fail as data grows.
  expect(totalTime).toBeLessThan(MAX_ACCEPTABLE_MS);
});

test('concurrent submissions: GET is not starved by writes', async ({ request }) => {
  const WRITE_COUNT = 30;

  // Fire a burst of writes AND a read at the same time.
  // The read should not be blocked for an unreasonable amount of time.
  const writes = Array.from({ length: WRITE_COUNT }, (_, i) =>
    request.post('/api/sessions', { data: makeFakeSession(i) })
  );

  const readStart = Date.now();
  const [readResponse] = await Promise.all([
    request.get('/api/sessions'),
    ...writes,
  ]);
  const readLatency = Date.now() - readStart;

  expect(readResponse.status()).toBe(200);

  // A GET during a burst of writes should still respond within 1 second.
  // Sync I/O makes the GET wait behind all queued writes.
  expect(readLatency).toBeLessThan(1000);
});
