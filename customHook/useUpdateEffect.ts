import { useEffect, useRef } from 'react';

/**
 * customHook/useUpdateEffect.ts
 * desc:  최초 랜더링 시점에 동작이 억제됨, 추후 의존 변경시에만 트리거되는 custom hook
 * 작성일자: 2026/02/10
 * 작성자: park junsung
 *
 * */
const useUpdateEffect = (effect: React.EffectCallback, deps: any[]) => {
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

export default useUpdateEffect;
