import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const stmt = db.prepare('SELECT id, name, shortname, lang FROM bibles');
    const bibles = stmt.all();
    return NextResponse.json({ bibles });
  } catch (error) {
    console.error('Failed to fetch bibles:', error);
    return NextResponse.json({ message: 'Failed to fetch bibles' }, { status: 500 });
  }
}
