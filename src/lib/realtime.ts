export type RealtimeEvent = {
  id?: string
  channel: string
  event: string
  data: unknown
  createdAt?: string
}

export interface RealtimeClient {
  connect(): Promise<void>
  disconnect(): void
  subscribe(channel: string, handler: (e: RealtimeEvent) => void): Promise<void>
  unsubscribe(channel: string, handler?: (e: RealtimeEvent) => void): void
}

/**
 * TestPollingClient
 * - Polls the dev-only `/api/test/publish` endpoint added to this repo.
 * - Keeps a small last-seen map per channel and dispatches new events to handlers.
 * - Intended for development and storybook/testing only.
 */
export function createTestClient(opts?: { pollInterval?: number; token?: string }): RealtimeClient {
  const pollInterval = opts?.pollInterval ?? 2000
  const token = opts?.token

  const handlers = new Map<string, Set<(e: RealtimeEvent) => void>>()
  const lastSeen = new Map<string, string | undefined>()
  let timer: ReturnType<typeof setInterval> | null = null
  let connected = false

  async function fetchEventsForChannel(channel: string) {
    try {
      const params = new URLSearchParams()
      params.set('channel', channel)
      params.set('limit', '100')
      const url = `/api/test/publish?${params.toString()}`
      const headers: Record<string, string> = {}
      if (token) headers['x-dev-publish-token'] = token
      const res = await fetch(url, { headers })
      if (!res.ok) return []
      const payload = await res.json()
      return Array.isArray(payload.items) ? payload.items as RealtimeEvent[] : []
    } catch (e) {
      // swallow network errors in dev client
      return []
    }
  }

  async function pollOnce() {
    // Poll only channels that have handlers
    const channels = Array.from(handlers.keys())
    await Promise.all(
      channels.map(async (channel) => {
        const items = await fetchEventsForChannel(channel)
        if (!items || items.length === 0) return
        // items are returned most-recent-first from the test endpoint; reverse to dispatch oldest->newest
        const reversed = items.slice().reverse()
        const last = lastSeen.get(channel)
        for (const it of reversed) {
          // if we have a lastSeen id, skip older or equal ids
          if (last && typeof it.id === 'string' && it.id <= last) continue
          const set = handlers.get(channel)
          if (set) {
            for (const h of set) {
              try {
                h(it)
              } catch (e) {
                // handler errors should not break loop
                console.error('realtime handler error', e)
              }
            }
          }
          if (typeof it.id === 'string') lastSeen.set(channel, it.id)
        }
      })
    )
  }

  async function connect() {
    if (connected) return
    connected = true
    // kick off polling timer
    await pollOnce()
    timer = setInterval(() => void pollOnce(), pollInterval)
  }

  function disconnect() {
    connected = false
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  async function subscribe(channel: string, handler: (e: RealtimeEvent) => void) {
    if (!handlers.has(channel)) handlers.set(channel, new Set())
    handlers.get(channel)!.add(handler)
    // fetch recent items immediately for this channel
    const items = await fetchEventsForChannel(channel)
    if (items && items.length > 0) {
      // dispatch newest-last -> we want oldest-first
      const reversed = items.slice().reverse()
        for (const it of reversed) {
          try {
            handler(it)
          } catch (e) {
            console.error('realtime handler error', e)
          }
          if (typeof it.id === 'string') lastSeen.set(channel, it.id)
        }
    }
  }

  function unsubscribe(channel: string, handler?: (e: RealtimeEvent) => void) {
    if (!handlers.has(channel)) return
    if (!handler) {
      handlers.delete(channel)
      lastSeen.delete(channel)
      return
    }
    const set = handlers.get(channel)!
    set.delete(handler)
    if (set.size === 0) {
      handlers.delete(channel)
      lastSeen.delete(channel)
    }
  }

  return { connect, disconnect, subscribe, unsubscribe }
}
