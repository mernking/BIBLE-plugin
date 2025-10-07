import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request, { params }) {
  const { shortname } = params;

  try {
    const bibleStmt = db.prepare('SELECT id FROM bibles WHERE shortname = ?');
    const bible = bibleStmt.get(shortname);

    if (!bible) {
      return NextResponse.json({ message: 'Bible not found' }, { status: 404 });
    }

    const versesStmt = db.prepare('SELECT book_name, book_number, chapter, verse, text FROM verses WHERE bible_id = ? ORDER BY id');
    const verses = versesStmt.all(bible.id);

    // The frontend expects a certain structure, so we need to reconstruct it.
    // The old structure was an object with a `verses` array and a `metadata` object.
    // We will just return the verses array for now, and adapt the frontend.
    const bibleData = {
        verses: verses.map(v => ({
            book_name: v.book_name,
            book: v.book_number,
            chapter: v.chapter,
            verse: v.verse,
            text: v.text
        }))
    }

    return NextResponse.json(bibleData);
  } catch (error) {
    console.error(`Failed to fetch bible ${shortname}:`, error);
    return NextResponse.json({ message: `Failed to fetch bible ${shortname}` }, { status: 500 });
  }
}
