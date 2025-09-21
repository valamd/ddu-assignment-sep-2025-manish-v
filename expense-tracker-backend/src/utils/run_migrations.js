
const fs = require('fs');
const pool = require('../config/db');
require('dotenv').config();

async function runFile(path) {
  const sql = fs.readFileSync(path, 'utf8');
  // split by semicolon but be careful with JSON in SQL; here our SQL is simple
  const statements = sql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
  for (const s of statements) {
    try {
      await pool.query(s);
    } catch (err) {
      // ignore if table exists
      if (err && err.code === 'ER_TABLE_EXISTS_ERROR') continue;
      console.error('Migration statement failed:', err && err.message);
      throw err;
    }
  }
}

async function main() {
  try {
    console.log('Running schema.sql ...');
    await runFile(__dirname + '/../../migrations/schema.sql');
    console.log('Running seed_system_categories.sql ...');
    await runFile(__dirname + '/../../migrations/seed_system_categories.sql');
    console.log('Migrations complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration error', err);
    process.exit(1);
  }
}

main();
