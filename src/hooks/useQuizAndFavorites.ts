import { useCallback, useEffect, useState } from 'react';
import { SystemId } from '../data/anatomyCatalog';

const QUIZ_STORAGE_KEY = 'anatomia3d_quiz_stats_v1';
const FAVORITES_STORAGE_KEY = 'anatomia3d_favorites_v1';

export interface SystemMasteryStat {
  correct: number;
  total: number;
}

export interface PersistedQuizStats {
  highScore: number;
  bestStreak: number;
  totalCorrect: number;
  totalAnswered: number;
  bySystem: Partial<Record<SystemId, SystemMasteryStat>>;
}

const DEFAULT_QUIZ_STATS: PersistedQuizStats = {
  highScore: 0,
  bestStreak: 0,
  totalCorrect: 0,
  totalAnswered: 0,
  bySystem: {},
};

function loadQuizStats(): PersistedQuizStats {
  if (typeof window === 'undefined') return DEFAULT_QUIZ_STATS;
  try {
    const raw = window.localStorage.getItem(QUIZ_STORAGE_KEY);
    if (!raw) return DEFAULT_QUIZ_STATS;
    const parsed = JSON.parse(raw);
    return {
      highScore: Number(parsed.highScore) || 0,
      bestStreak: Number(parsed.bestStreak) || 0,
      totalCorrect: Number(parsed.totalCorrect) || 0,
      totalAnswered: Number(parsed.totalAnswered) || 0,
      bySystem: parsed.bySystem && typeof parsed.bySystem === 'object' ? parsed.bySystem : {},
    };
  } catch {
    return DEFAULT_QUIZ_STATS;
  }
}

function loadFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function useQuizAndFavorites() {
  const [persistedStats, setPersistedStats] = useState<PersistedQuizStats>(loadQuizStats);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(
    () => new Set(loadFavorites())
  );
  const [onlyFavoritesFilter, setOnlyFavoritesFilter] = useState(false);

  // Sync quiz stats to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        QUIZ_STORAGE_KEY,
        JSON.stringify(persistedStats)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [persistedStats]);

  // Sync favorites to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(Array.from(favoriteIds))
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [favoriteIds]);

  const recordQuizAttempt = useCallback(
    (
      systemId: SystemId,
      isCorrect: boolean,
      sessionCorrectAfter: number,
      sessionStreakAfter: number
    ) => {
      setPersistedStats((prev) => {
        const sysStat = prev.bySystem[systemId] ?? { correct: 0, total: 0 };
        const updatedSys: SystemMasteryStat = {
          correct: sysStat.correct + (isCorrect ? 1 : 0),
          total: sysStat.total + 1,
        };
        return {
          highScore: Math.max(prev.highScore, sessionCorrectAfter),
          bestStreak: Math.max(prev.bestStreak, sessionStreakAfter),
          totalCorrect: prev.totalCorrect + (isCorrect ? 1 : 0),
          totalAnswered: prev.totalAnswered + 1,
          bySystem: {
            ...prev.bySystem,
            [systemId]: updatedSys,
          },
        };
      });
    },
    []
  );

  const resetPersistedQuizStats = useCallback(() => {
    setPersistedStats(DEFAULT_QUIZ_STATS);
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return {
    persistedStats,
    recordQuizAttempt,
    resetPersistedQuizStats,
    favoriteIds,
    toggleFavorite,
    onlyFavoritesFilter,
    setOnlyFavoritesFilter,
  };
}
