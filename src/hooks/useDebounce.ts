"use client";

import { useState, useEffect } from "react";

/**
 * 値をデバウンスするフック
 * @param value デバウンスする値
 * @param delay 遅延時間（ミリ秒）。デフォルトは300ms
 * @returns デバウンスされた値
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
