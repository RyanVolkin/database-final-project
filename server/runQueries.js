const fs = require('fs').promises;
const path = require('path');
const { neon } = require('@neondatabase/serverless');
const { parse } = require('csv-parse/sync');
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

  const client = neon(process.env.DATABASE_URL);
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
        // If the SQL file contains psql client-side "\copy" commands,
        // handle them by reading the CSV on the client and inserting rows.
        const copyLines = Array.from(sql.matchAll(/^\\copy\s+([^\s]+)\s+FROM\s+'([^']+)'/gim));
        if (copyLines.length) {
          await client.query('BEGIN');
          for (const m of copyLines) {
            const tableName = m[1];
            const csvPath = m[2];
            console.log(`Processing client-side copy for table ${tableName} from ${csvPath}`);
            const resolved = path.isAbsolute(csvPath) ? csvPath : path.join(__dirname, csvPath);
            let data;
            try {
              data = await fs.readFile(resolved, 'utf8');
            } catch (err) {
              throw new Error(`Failed to read CSV file ${resolved}: ${err.message}`);
            }

            // Get column names and data types for the table in their ordinal order
            const colRes = await client.query(
              `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`,
              [tableName.toLowerCase()]
            );
            console.log('column query result shape:', colRes);
            // Handle different client result shapes (pg vs neon)
            let colRows;
            if (Array.isArray(colRes)) colRows = colRes;
            else if (colRes && Array.isArray(colRes.rows)) colRows = colRes.rows;
            else if (colRes && colRes.result && Array.isArray(colRes.result.rows)) colRows = colRes.result.rows;
            else colRows = [];
            const columns = colRows.map(r => r.column_name);
            const colTypes = colRows.map(r => r.data_type);
            if (!columns.length) {
              throw new Error(`No columns found for table ${tableName}`);
            }

            // Parse CSV robustly (handles quoted fields and commas inside fields)
            const records = parse(data, { skip_empty_lines: true, trim: true });
            // Insert rows (one statement per row, parameterized). This is simple and reliable.
            for (const record of records) {
              const values = record.map((v, idx) => {
                // Normalize common missing tokens to null
                if (v === null || v === undefined) return null;
                if (typeof v === 'string') v = v.trim();
                if (v === '' || v === '--' || v.toUpperCase() === 'NA' || v.toUpperCase() === 'N/A' || v.toUpperCase() === 'NULL') return null;

                const type = colTypes[idx] || 'text';
                // Coerce numeric types
                if (['integer', 'bigint', 'smallint'].includes(type)) {
                  const n = Number(v);
                  return Number.isFinite(n) ? Math.trunc(n) : null;
                }
                if (['numeric', 'decimal', 'double precision', 'real'].includes(type)) {
                  const n = Number(v);
                  return Number.isFinite(n) ? n : null;
                }
                if (type === 'boolean') {
                  const lv = String(v).toLowerCase();
                  if (lv === 't' || lv === 'true' || lv === '1') return true;
                  if (lv === 'f' || lv === 'false' || lv === '0') return false;
                  return null;
                }
                // Default: string
                return v;
              });
              // If CSV has fewer columns than table, pad with nulls; if more, truncate.
              if (values.length < columns.length) {
                while (values.length < columns.length) values.push(null);
              } else if (values.length > columns.length) {
                values.length = columns.length;
              }

              const placeholders = values.map((_, i) => `$${i + 1}`).join(',');
              const insertSql = `INSERT INTO ${tableName} (${columns.join(',')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
              try {
                await client.query(insertSql, values);
              } catch (err) {
                // Log helpful debug info and rethrow to trigger rollback
                console.error(`Failed inserting into ${tableName}. Parsed values:`, values);
                throw err;
              }
            }
          }
          await client.query('COMMIT');
        } else {
          await client.query('BEGIN');
          // Some clients (serverless drivers) disallow multiple statements in a single prepared
          // statement. Split the SQL file into individual statements and run them one-by-one.
          const statements = sql
            .split(/;\s*(?:\r?\n|$)/)
            .map(s => s.trim())
            .filter(Boolean);
          for (const stmt of statements) {
            await client.query(stmt);
          }
          await client.query('COMMIT');
        }
        console.log(`Success: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        hadError = true;
        console.error(`Error running ${file}:`, err);
      }
    }
    if (hadError) {
      console.error('One or more SQL files failed. See errors above.');
      process.exit(1);
    }

    console.log('All SQL files executed successfully.');
  } finally {
    try {
      if (client) {
        if (typeof client.release === 'function') await client.release();
        else if (typeof client.end === 'function') await client.end();
      }
    } catch (err) {
      console.error('Error closing client:', err);
    }
  }
}

run().catch(err => {
  console.error('Setup run failed:', err);
  process.exit(1);
});
