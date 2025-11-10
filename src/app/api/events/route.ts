import { NextRequest, NextResponse } from 'next/server';
import { EventRepository } from '@/lib/repositories/EventRepository';
import { initDatabase } from '@/lib/db';

initDatabase();

const eventRepo = new EventRepository();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const upcoming = searchParams.get('upcoming');
    
    if (upcoming === 'true') {
      const events = eventRepo.getUpcomingEvents(userId ? parseInt(userId) : undefined);
      return NextResponse.json(events);
    }

    const events = eventRepo.getAllEvents(userId ? parseInt(userId) : undefined);
    return NextResponse.json(events);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { title, description, date, time, location, category, capacity, created_by } = body;
    
    if (!title || !date || !time || !location || !category || !capacity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const event = eventRepo.createEvent({
      title,
      description: description || '',
      date,
      time,
      location,
      category,
      capacity: parseInt(capacity),
      created_by: created_by || null,
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create event' },
      { status: 500 }
    );
  }
}