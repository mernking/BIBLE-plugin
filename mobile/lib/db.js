import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'bible.db');
const db = new Database(dbPath, { readonly: true });

export default db;
