import { useRef, useState, useCallback } from 'react';

const MAX_HISTORY = 50;

/**
 * hooks/drawing/useHistory.ts
 * */
export function useHistory<T>(initialState: T) {
  const historyRef = useRef<T[]>([
    JSON.parse(JSON.stringify(initialState)), // 깊은 복사
  ]);
  const indexRef = useRef(0);

  const [, forceUpdate] = useState(0); // 리렌더 트리거용

  // 현재 상태 반환
  const getState = useCallback((): T => {
    return historyRef.current[indexRef.current];
  }, []);

  // 스냅샷 저장 (새 액션 발생 시)
  const pushHistory = useCallback((newState: T) => {
    console.log('historyRef: ', historyRef.current);
    const snapshot = JSON.parse(JSON.stringify(newState)); // 깊은 복사 필수!

    // 현재 인덱스 이후의 히스토리 제거 (redo 스택 초기화)
    historyRef.current = historyRef.current.slice(0, indexRef.current + 1);
    historyRef.current.push(snapshot);

    // 최대 히스토리 개수 유지
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift();
    } else {
      indexRef.current++;
    }

    forceUpdate((n) => n + 1);
  }, []);

  const undo = useCallback((): T | null => {
    if (indexRef.current <= 0) return null;
    indexRef.current--;
    forceUpdate((n) => n + 1);
    return historyRef.current[indexRef.current];
  }, []);

  const redo = useCallback((): T | null => {
    if (indexRef.current >= historyRef.current.length - 1) return null;
    indexRef.current++;
    forceUpdate((n) => n + 1);
    return historyRef.current[indexRef.current];
  }, []);

  // const canUndo = indexRef.current > 0;
  // const canRedo = indexRef.current < historyRef.current.length - 1;

  //return { getState, pushHistory, undo, redo, canUndo, canRedo };
  return { getState, pushHistory, undo, redo };
}
