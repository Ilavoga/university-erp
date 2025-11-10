import { useEffect, useState, useRef } from 'react'
import type { RealtimeClient, RealtimeEvent } from '../lib/realtime'

type UseRealtimeOpts = {
  onEvent: (e: RealtimeEvent) => void
  channels: string[]
}

/**
 * useRealtime
 * - Lightweight hook to connect to a RealtimeClient and subscribe to channels.
 * - Subscribes on mount and unsubscribes on unmount. Only runs in the browser.
 */
export function useRealtime(client: RealtimeClient | null, opts: UseRealtimeOpts) {
  const { onEvent, channels } = opts
  const [connected, setConnected] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    mountedRef.current = true
    let isCancelled = false

    async function setup() {
      if (!client) return
      try {
        await client.connect()
        if (!isCancelled) setConnected(true)
        // subscribe to channels
        await Promise.all(channels.map((c) => client.subscribe(c, onEvent)))
      } catch (e) {
        console.error('useRealtime setup error', e)
      }
    }

    setup()

    return () => {
      isCancelled = true
      if (!client) return
      channels.forEach((c) => client.unsubscribe(c, onEvent))
      try {
        client.disconnect()
      } catch (e) {
        // ignore
      }
      if (mountedRef.current) setConnected(false)
      mountedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, JSON.stringify(channels)])

  return { connected }
}
