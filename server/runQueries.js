const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Runner lives at server/, queries are in server/setup
const QUERIES_DIR = path.join(__dirname, 'setup');

function getDbConfigFromEnv() {
  return {
    user: process.env.DB_USER,
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  };
}

async function loadQueryFiles(dir) {
  try {
    const files = await fs.readdir(dir);
    return files.filter(f => f.toLowerCase().endsWith('.sql')).sort();
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function run() {
  const config = getDbConfigFromEnv();
  if (!config.database) {
    console.error('DB_NAME not set in environment. Aborting.');
    process.exit(1);
  }

  const pool = new Pool(config);
  const client = await pool.connect();
  let hadError = false;

  try {
    const files = await loadQueryFiles(QUERIES_DIR);
    if (!files.length) {
      console.log(`No .sql files found in ${QUERIES_DIR}. Nothing to do.`);
      return;
    }

    console.log(`Found ${files.length} .sql file(s) in ${QUERIES_DIR}:`, files);

    for (const file of files) {
      const filePath = path.join(QUERIES_DIR, file);
      console.log(`Running: ${filePath}`);
      const sql = await fs.readFile(filePath, 'utf8');

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log(`Success: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        hadError = true;
        console.error(`Error running ${file}:`, err.message || err);
      }
    }
    if (hadError) {
      console.error('One or more SQL files failed. See errors above.');
      process.exit(1);
    }

    console.log('All SQL files executed successfully.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('Setup run failed:', err);
  process.exit(1);
});
