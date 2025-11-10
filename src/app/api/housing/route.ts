import { NextResponse } from 'next/server';
import { db } from '@/lib/mock-data';

export async function GET() {
  return NextResponse.json(db.housing);
}

export async function POST(request: Request) {
  try {
    const listing = await request.json();
    const newListing = {
      ...listing,
      id: `h${db.housing.length + 1}`,
    };
    db.housing.push(newListing);
    return NextResponse.json(newListing);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
  }
}
