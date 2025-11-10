import { NextResponse } from 'next/server';
import { db } from '@/lib/mock-data';

export async function GET() {
  return NextResponse.json(db.marketplace);
}

export async function POST(request: Request) {
  try {
    const listing = await request.json();
    const newListing = {
      ...listing,
      id: `m${db.marketplace.length + 1}`,
      rating: 0,
      reviews: [],
    };
    db.marketplace.push(newListing);
    return NextResponse.json(newListing);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
  }
}
