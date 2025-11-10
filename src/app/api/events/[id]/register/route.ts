import { NextRequest, NextResponse } from 'next/server';
import { EventRepository } from '@/lib/repositories/EventRepository';
import { initDatabase } from '@/lib/db';

initDatabase();

const eventRepo = new EventRepository();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = parseInt(params.id);
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const registration = eventRepo.registerForEvent(eventId, userId);
    return NextResponse.json(registration, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Event not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error.message === 'Event is full' || error.message === 'Already registered for this event') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to register for event' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = parseInt(params.id);
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const success = eventRepo.unregisterFromEvent(eventId, parseInt(userId));

    if (!success) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Unregistered successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to unregister from event' },
      { status: 500 }
    );
  }
}