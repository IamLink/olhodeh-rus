const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('@neondatabase/serverless');

function compile(sql, args) {
  let statement = sql
    .replace(/username\s*=\s*\?/i, 'LOWER(username) = LOWER(?)')
    .replace(/\b(full_name|username)\s+COLLATE\s+NOCASE/gi, 'LOWER($1)')
    .replace(/\s+COLLATE\s+NOCASE/gi, '')
    .replace(/\bdate\(([^()]+)\)/gi, 'CAST($1 AS DATE)')
    .replace(/\bCURRENT_TIMESTAMP\b/gi, 'CURRENT_TIMESTAMP::TEXT');
  const input = args.length === 1 && args[0] && typeof args[0] === 'object' && !Array.isArray(args[0])
    ? args[0]
    : null;
  const values = [];
  if (input) {
    const indexes = new Map();
    statement = statement.replace(/@([A-Za-z][A-Za-z0-9_]*)/g, (_match, name) => {
      if (!indexes.has(name)) {
        indexes.set(name, values.length + 1);
        values.push(input[name] ?? null);
      }
      return `$${indexes.get(name)}`;
    });
  } else {
    statement = statement.replace(/\?/g, () => {
      values.push(args[values.length] ?? null);
      return `$${values.length}`;
    });
  }
  return { statement, values };
}

function database(client, pool = null) {
  const query = async (sql, args) => {
    const { statement, values } = compile(sql, args);
    return values.length ? client.query(statement, values) : client.query(statement);
  };
  return {
    dialect: 'postgres',
    prepare(sql) {
      return {
        async get(...args) { return (await query(sql, args)).rows[0]; },
        async all(...args) { return (await query(sql, args)).rows; },
        async run(...args) { return { changes: (await query(sql, args)).rowCount }; }
      };
    },
    async exec(sql) { await client.query(sql); },
    async transaction(work) {
      if (!pool) throw new Error('Transações aninhadas não são suportadas.');
      const connection = await pool.connect();
      try {
        await connection.query('BEGIN');
        const result = await work(database(connection));
        await connection.query('COMMIT');
        return result;
      } catch (error) {
        await connection.query('ROLLBACK');
        throw error;
      } finally {
        connection.release();
      }
    },
    close() { return pool ? pool.end() : Promise.resolve(); }
  };
}

async function openPostgresDatabase(connectionString) {
  if (!connectionString) throw new Error('DATABASE_URL não foi configurada.');
  const pool = new Pool({ connectionString, max: 5, connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000 });
  pool.on('error', (error) => console.error('Conexão PostgreSQL indisponível:', error.code || 'DATABASE_ERROR'));
  const db = database(pool, pool);
  try {
    await pool.query('SELECT 1');
    await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::TEXT)');
    const applied = await db.prepare('SELECT version FROM schema_migrations').all();
    if (!applied.some((row) => Number(row.version) === 1)) {
      const sql = fs.readFileSync(path.join(__dirname, 'migrations', '001-initial.sql'), 'utf8');
      await db.transaction(async (tx) => {
        await tx.exec(sql);
        await tx.prepare('INSERT INTO schema_migrations(version) VALUES (?)').run(1);
      });
    }
    return db;
  } catch (error) {
    await pool.end();
    throw error;
  }
}

module.exports = { openPostgresDatabase };
