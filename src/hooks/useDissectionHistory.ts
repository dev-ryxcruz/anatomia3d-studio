import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ANATOMICAL_STRUCTURES,
  ANATOMICAL_SYSTEMS,
  SystemId,
} from '../data/anatomyCatalog';
import { SliceAxis } from '../components/Viewer3D';

export interface DissectionSnapshot {
  selectedId: string | null;
  selectedSubMeshId: string | null;
  hiddenIds: string[];
  xrayIds: string[];
  hiddenSystems: SystemId[];
  xraySystems: SystemId[];
}

export function normalizeSearchText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function parseInitialUrlParams() {
  if (typeof window === 'undefined') {
    return {
      part: 'heart' as string | null,
      sub: null as string | null,
      xray: [] as string[],
      xsys: [] as SystemId[],
      hidden: [] as string[],
      hsys: [] as SystemId[],
      slice: 'none' as SliceAxis,
      offset: 1.25,
      explode: 0,
    };
  }
  const params = new URLSearchParams(window.location.search);
  const partParam = params.get('part');
  const defaultPart = window.innerWidth < 768 ? null : 'heart';
  const part =
    partParam === 'none'
      ? null
      : partParam && ANATOMICAL_STRUCTURES.some((s) => s.id === partParam)
      ? partParam
      : defaultPart;

  const sub = params.get('sub') || null;
  const xray = (params.get('xray') || '').split(',').filter(Boolean);
  const xsys = (params.get('xsys') || '')
    .split(',')
    .filter((s): s is SystemId =>
      ANATOMICAL_SYSTEMS.some((sys) => sys.id === s)
    );
  const hidden = (params.get('hidden') || '').split(',').filter(Boolean);
  const hsys = (params.get('hsys') || '')
    .split(',')
    .filter((s): s is SystemId =>
      ANATOMICAL_SYSTEMS.some((sys) => sys.id === s)
    );

  const rawSlice = params.get('slice');
  const slice: SliceAxis =
    rawSlice === 'axial' || rawSlice === 'sagittal' || rawSlice === 'coronal'
      ? rawSlice
      : 'none';
  const rawOffset = parseFloat(params.get('offset') || '');
  const offset = Number.isFinite(rawOffset) ? rawOffset : 1.25;
  const rawExplode = parseFloat(params.get('explode') || '');
  const explode = Number.isFinite(rawExplode)
    ? Math.max(0, Math.min(1, rawExplode / 100))
    : 0;

  return { part, sub, xray, xsys, hidden, hsys, slice, offset, explode };
}

export function useDissectionHistory({
  initialSnapshot,
  selectedId,
  selectedSubMeshId,
  hiddenIds,
  xrayIds,
  hiddenSystems,
  xraySystems,
  onRestoreSnapshot,
}: {
  initialSnapshot: DissectionSnapshot;
  selectedId: string | null;
  selectedSubMeshId: string | null;
  hiddenIds: Set<string>;
  xrayIds: Set<string>;
  hiddenSystems: Set<SystemId>;
  xraySystems: Set<SystemId>;
  onRestoreSnapshot: (snap: DissectionSnapshot) => void;
}) {
  const [historyState, setHistoryState] = useState<{
    stack: DissectionSnapshot[];
    index: number;
  }>(() => ({
    stack: [initialSnapshot],
    index: 0,
  }));
  const isRestoringHistoryRef = useRef(false);

  useEffect(() => {
    if (isRestoringHistoryRef.current) {
      isRestoringHistoryRef.current = false;
      return;
    }
    const snapshot: DissectionSnapshot = {
      selectedId,
      selectedSubMeshId,
      hiddenIds: Array.from(hiddenIds).sort(),
      xrayIds: Array.from(xrayIds).sort(),
      hiddenSystems: Array.from(hiddenSystems).sort(),
      xraySystems: Array.from(xraySystems).sort(),
    };

    setHistoryState((prev) => {
      const current = prev.stack[prev.index];
      if (
        current &&
        current.selectedId === snapshot.selectedId &&
        current.selectedSubMeshId === snapshot.selectedSubMeshId &&
        current.hiddenIds.join(',') === snapshot.hiddenIds.join(',') &&
        current.xrayIds.join(',') === snapshot.xrayIds.join(',') &&
        current.hiddenSystems.join(',') === snapshot.hiddenSystems.join(',') &&
        current.xraySystems.join(',') === snapshot.xraySystems.join(',')
      ) {
        return prev;
      }
      const nextStack = prev.stack.slice(0, prev.index + 1);
      nextStack.push(snapshot);
      if (nextStack.length > 50) {
        nextStack.shift();
      }
      return {
        stack: nextStack,
        index: nextStack.length - 1,
      };
    });
  }, [
    selectedId,
    selectedSubMeshId,
    hiddenIds,
    xrayIds,
    hiddenSystems,
    xraySystems,
  ]);

  const canUndo = historyState.index > 0;
  const canRedo = historyState.index < historyState.stack.length - 1;

  const handleUndo = useCallback(() => {
    setHistoryState((prev) => {
      if (prev.index <= 0) return prev;
      const targetIdx = prev.index - 1;
      const snap = prev.stack[targetIdx];
      isRestoringHistoryRef.current = true;
      onRestoreSnapshot(snap);
      return { ...prev, index: targetIdx };
    });
  }, [onRestoreSnapshot]);

  const handleRedo = useCallback(() => {
    setHistoryState((prev) => {
      if (prev.index >= prev.stack.length - 1) return prev;
      const targetIdx = prev.index + 1;
      const snap = prev.stack[targetIdx];
      isRestoringHistoryRef.current = true;
      onRestoreSnapshot(snap);
      return { ...prev, index: targetIdx };
    });
  }, [onRestoreSnapshot]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo, handleRedo]);

  return { canUndo, canRedo, handleUndo, handleRedo };
}

export function useUrlDissectionSync({
  selectedId,
  selectedSubMeshId,
  xrayIds,
  xraySystems,
  hiddenIds,
  hiddenSystems,
  sliceAxis,
  sliceOffset,
  explodeFactor,
}: {
  selectedId: string | null;
  selectedSubMeshId: string | null;
  xrayIds: Set<string>;
  xraySystems: Set<SystemId>;
  hiddenIds: Set<string>;
  hiddenSystems: Set<SystemId>;
  sliceAxis: SliceAxis;
  sliceOffset: number;
  explodeFactor: number;
}) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (selectedId) params.set('part', selectedId);
    if (selectedSubMeshId) params.set('sub', selectedSubMeshId);
    if (xrayIds.size > 0) params.set('xray', Array.from(xrayIds).join(','));
    if (xraySystems.size > 0)
      params.set('xsys', Array.from(xraySystems).join(','));
    if (hiddenIds.size > 0)
      params.set('hidden', Array.from(hiddenIds).join(','));
    if (hiddenSystems.size > 0)
      params.set('hsys', Array.from(hiddenSystems).join(','));
    if (sliceAxis !== 'none') {
      params.set('slice', sliceAxis);
      params.set('offset', sliceOffset.toFixed(2));
    }
    if (explodeFactor > 0.01) {
      params.set('explode', String(Math.round(explodeFactor * 100)));
    }
    const qs = params.toString();
    const newUrl = qs
      ? `${window.location.pathname}?${qs}`
      : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [
    selectedId,
    selectedSubMeshId,
    xrayIds,
    xraySystems,
    hiddenIds,
    hiddenSystems,
    sliceAxis,
    sliceOffset,
    explodeFactor,
  ]);
}
