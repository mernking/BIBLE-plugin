import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'bible.db');
const db = new Database(dbPath, { readonly: true });

try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table';").all();
  console.log('Tables in bible.db:', tables.map(t => t.name));

  tables.forEach(table => {
    const columns = db.prepare(`PRAGMA table_info(${table.name});`).all();
    console.log(`\nSchema for table ${table.name}:`);
    columns.forEach(col => {
      console.log(`  ${col.name} (${col.type}) - PK: ${col.pk}, NotNull: ${col.notnull}`);
    });
  });
} catch (error) {
  console.error('Error inspecting database:', error);
} finally {
  db.close();
}