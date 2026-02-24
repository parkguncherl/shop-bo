import { useEffect, useState } from 'react';

/**
 * 디바운스 처리하여 트리거 직후부터 time 이내에 발생하는 변경은 모두 하나의 변경으로 처리
 * */
const useDebounce = (value: string, time: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timerId = setTimeout(() => {
      return setDebouncedValue(value);
    }, time);

    return () => clearTimeout(timerId);
  }, [value, time]);

  return debouncedValue;
};

export default useDebounce;
