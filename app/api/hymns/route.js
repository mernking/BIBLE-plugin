import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const hymns = await prisma.hymn.findMany();
    return NextResponse.json(hymns);
  } catch (error) {
    console.error('Error fetching hymns:', error);
    return NextResponse.json({ error: 'Error fetching hymns' }, { status: 500 });
  }
}
