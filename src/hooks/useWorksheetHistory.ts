import { useState, useCallback, useRef } from 'react';
import { WorksheetData } from '../types';

const MAX_HISTORY_LIMIT = 50;

/**
 * Custom Hook for robust Undo/Redo state management of WorksheetData
 */
export function useWorksheetHistory(initialData: WorksheetData) {
  const [past, setPast] = useState<WorksheetData[]>([]);
  const [present, setPresent] = useState<WorksheetData>(initialData);
  const [future, setFuture] = useState<WorksheetData[]>([]);

  // Ref to always have the latest present value in callbacks without stale closures
  const presentRef = useRef<WorksheetData>(present);
  presentRef.current = present;

  const pastRef = useRef<WorksheetData[]>(past);
  pastRef.current = past;

  const futureRef = useRef<WorksheetData[]>(future);
  futureRef.current = future;

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  /**
   * Updates worksheet and pushes previous state to history
   */
  const setWorksheet = useCallback((
    action: WorksheetData | ((prev: WorksheetData) => WorksheetData)
  ) => {
    const current = presentRef.current;
    const next = typeof action === 'function' ? action(current) : action;

    // Avoid pushing to history if identical reference
    if (next === current) return;

    setPast(prevPast => {
      const newPast = [...prevPast, current];
      if (newPast.length > MAX_HISTORY_LIMIT) {
        return newPast.slice(newPast.length - MAX_HISTORY_LIMIT);
      }
      return newPast;
    });

    setPresent(next);
    setFuture([]); // Clear redo stack on new modification
  }, []);

  /**
   * Undoes the last action
   */
  const undo = useCallback((): boolean => {
    const currentPast = pastRef.current;
    if (currentPast.length === 0) return false;

    const previous = currentPast[currentPast.length - 1];
    const newPast = currentPast.slice(0, currentPast.length - 1);
    const current = presentRef.current;

    setPast(newPast);
    setFuture(prevFuture => [current, ...prevFuture]);
    setPresent(previous);
    return true;
  }, []);

  /**
   * Redoes the previously undone action
   */
  const redo = useCallback((): boolean => {
    const currentFuture = futureRef.current;
    if (currentFuture.length === 0) return false;

    const next = currentFuture[0];
    const newFuture = currentFuture.slice(1);
    const current = presentRef.current;

    setPast(prevPast => [...prevPast, current]);
    setFuture(newFuture);
    setPresent(next);
    return true;
  }, []);

  /**
   * Resets history stack (used on new worksheet, dataset load, or import)
   */
  const resetWorksheet = useCallback((newData: WorksheetData) => {
    setPast([]);
    setFuture([]);
    setPresent(newData);
  }, []);

  return {
    worksheet: present,
    setWorksheet,
    resetWorksheet,
    undo,
    redo,
    canUndo,
    canRedo,
    pastLength: past.length,
    futureLength: future.length
  };
}
