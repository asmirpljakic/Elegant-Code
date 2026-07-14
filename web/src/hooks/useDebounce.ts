import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Postavlja se tajmer na promenu vrednosti
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Brišemo prethodni tajmer ako korisnik nastavi da kuca
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
