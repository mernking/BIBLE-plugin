import { PrismaClient } from '@prisma/client';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting data seeding...');

  // Delete all existing data
  await prisma.verse.deleteMany({});
  await prisma.bible.deleteMany({});
  await prisma.hymn.deleteMany({});
  console.log('Deleted all existing data.');

  /*
  // --- Seed Bibles and Verses from bible.db ---
  const oldDbPath = path.resolve(process.cwd(), 'bible.db');
  const oldDb = new Database(oldDbPath, { readonly: true });

  const oldBibles = oldDb.prepare('SELECT * FROM bibles').all();
  for (const oldBible of oldBibles) {
    const newBible = await prisma.bible.create({
      data: {
        name: oldBible.name,
        shortname: oldBible.shortname,
        lang: oldBible.lang,
      },
    });
    console.log(`Created Bible: ${newBible.name}`);

    const oldVerses = oldDb.prepare('SELECT * FROM verses WHERE bible_id = ?').all(oldBible.id);
    for (const oldVerse of oldVerses) {
      await prisma.verse.create({
        data: {
          bibleId: newBible.id,
          bookName: oldVerse.book_name,
          bookNumber: oldVerse.book_number,
          chapter: oldVerse.chapter,
          verse: oldVerse.verse,
          text: oldVerse.text,
        },
      });
    }
    console.log(`  Inserted ${oldVerses.length} verses for ${newBible.name}`);
  }
  oldDb.close();
  */

  // --- Seed Hymns from merged_hymns.json ---
  const hymnsPath = path.resolve(process.cwd(), 'lib/merged_hymns.json');
  const hymnsData = fs.readFileSync(hymnsPath, 'utf8');
  const hymns = JSON.parse(hymnsData);

  for (const hymn of hymns) {
    await prisma.hymn.create({
      data: {
        id: hymn.number, // Use the 'number' field as the ID
        title: hymn.title,
        author: hymn.author || null,
        meter: hymn.meter || null,
        tuneName: hymn.tuneName || null,
        verses: JSON.stringify(hymn.verses), // Store array as JSON string
        chorus: hymn.chorus || null,
        addedChorus: hymn.addedChorus || null,
        sourceFile: hymn.sourceFile || null,
        titleWithHymnNumber: hymn.titleWithHymnNumber || null,
        sound: hymn.sound || null,
        category: hymn.category || null,
      },
    });
    console.log(`Created Hymn: ${hymn.title}`);
  }

  console.log('Data seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });