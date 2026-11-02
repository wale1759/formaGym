import { useEffect, useState } from 'react';
import { restoreStoredList } from '../storage.js';

// Browser storage is optional; blocked writes must not prevent using the app.
export default function useStored(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      return (
        restoreStoredList(key, JSON.parse(localStorage.getItem(key))) ?? initial
      );
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* Keep using the current in-memory state if storage is blocked or full. */
    }
  }, [key, value]);
  return [value, setValue];
}
