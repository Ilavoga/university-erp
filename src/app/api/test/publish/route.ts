import { NextResponse } from 'next/server'

// Simple in-memory event buffer for development/testing only.
// This file provides a secure test endpoint to simulate publishing realtime events
// during development. It intentionally does not integrate with any external
// provider. To keep it safe, it is disabled in production and requires a
// developer token set via the DEV_PUBLISH_TOKEN environment variable.

type TestEvent = {
  id: string
  channel: string
  event: string
  data: unknown
  createdAt: string
  remoteAddr?: string
}

const MAX_BUFFER = 200
const eventBuffer: TestEvent[] = []

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

function getRemoteAddr(req: Request) {
  try {
    // Cloud / proxy aware header
    const forwarded = req.headers.get('x-forwarded-for')
    if (forwarded) return forwarded.split(',')[0].trim()
    const cf = req.headers.get('cf-connecting-ip')
    if (cf) return cf
  } catch (e) {
    // ignore
  }
  return undefined
}

async function authorize(req: Request) {
  // Disallow in production
  if (process.env.NODE_ENV === 'production') {
    return { ok: false, status: 403, reason: 'Not allowed in production' }
  }

  const tokenHeader = req.headers.get('x-dev-publish-token') || ''
  const expected = process.env.DEV_PUBLISH_TOKEN || ''

  if (!expected) {
    // If a token has not been configured, require localhost origin for safety.
    const host = req.headers.get('host') || ''
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      return { ok: true }
    }
    return { ok: false, status: 401, reason: 'DEV_PUBLISH_TOKEN not set' }
  }

  if (tokenHeader && tokenHeader === expected) return { ok: true }
  return { ok: false, status: 401, reason: 'Invalid DEV publish token' }
}

export async function POST(req: Request) {
  const auth = await authorize(req)
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status })

  let body: unknown
  try {
    body = await req.json()
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const payload = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
  const channel = typeof payload['channel'] === 'string' ? String(payload['channel']) : undefined
  const event = typeof payload['event'] === 'string' ? String(payload['event']) : undefined
  const data = payload['data']

  if (!channel) {
    return NextResponse.json({ error: 'Missing or invalid `channel`' }, { status: 400 })
  }
  if (!event) {
    return NextResponse.json({ error: 'Missing or invalid `event`' }, { status: 400 })
  }

  // Basic channel validation to avoid abuse: allow letters, numbers, colon, hyphen, underscore
  if (!/^[a-zA-Z0-9:_\-]+$/.test(channel)) {
    return NextResponse.json({ error: 'Invalid channel format' }, { status: 400 })
  }

  const remote = getRemoteAddr(req)
  const entry: TestEvent = {
    id: generateId(),
    channel,
    event,
    data: data === undefined ? null : data,
    createdAt: new Date().toISOString(),
    remoteAddr: remote,
  }

  // push into buffer
  eventBuffer.unshift(entry)
  if (eventBuffer.length > MAX_BUFFER) eventBuffer.pop()

  // NOTE: This endpoint intentionally does not attempt to publish to any
  // provider. If you want to wire it to Pusher/Supabase/Ably in your dev
  // environment, add the provider SDK and implement the publish call here.

  return NextResponse.json({ ok: true, event: entry }, { status: 201 })
}

export async function GET(req: Request) {
  const auth = await authorize(req)
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status })

  const url = new URL(req.url)
  const channelFilter = url.searchParams.get('channel')
  const limitParam = url.searchParams.get('limit')
  let results = eventBuffer.slice()
  if (channelFilter) results = results.filter((e) => e.channel === channelFilter)
  const limit = limitParam ? Math.min(200, Math.max(1, Number(limitParam))) : 50
  results = results.slice(0, limit)
  return NextResponse.json({ ok: true, items: results })
}

export async function DELETE(req: Request) {
  const auth = await authorize(req)
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status })

  // clear buffer
  eventBuffer.length = 0
  return NextResponse.json({ ok: true, cleared: true })
}
