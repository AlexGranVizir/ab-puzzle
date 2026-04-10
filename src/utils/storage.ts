import { SessionResults } from '../types/index';

const STORAGE_KEY = 'puzzle_sessions';

export const saveSession = (session: SessionResults): void => {
  const existing = loadSessions();
  existing.push(session);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
};

export const loadSessions = (): SessionResults[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const clearSessions = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
