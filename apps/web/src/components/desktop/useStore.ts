import { useEffect, useState } from 'preact/hooks'
import type { Store, WmState } from '../../lib/wm/state'

/** Re-render when the window-manager store changes. */
export function useWm(store: Store): WmState {
  const [state, setState] = useState(store.get())
  useEffect(() => {
    setState(store.get())
    return store.subscribe(() => setState(store.get()))
  }, [store])
  return state
}
