import { useEffect, useState } from 'react'

/**
 * Persist a piece of state in localStorage under the given key.
 * Falls back to in-memory state if storage is unavailable.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key)
      return stored !== null ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage full or blocked — keep app functional anyway.
    }
  }, [key, value])

  return [value, setValue]
}
