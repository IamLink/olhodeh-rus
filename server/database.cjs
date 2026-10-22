const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

const MIGRATIONS = [
  `CREATE TABLE users (
    id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin','physician','physio','psychologist','nutritionist')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE astronauts (
    id TEXT PRIMARY KEY, full_name TEXT NOT NULL, mission TEXT NOT NULL DEFAULT '',
    mission_start TEXT, mission_end TEXT, return_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Acompanhamento', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE measurements (
    id TEXT PRIMARY KEY, astronaut_id TEXT NOT NULL REFERENCES astronauts(id) ON DELETE CASCADE,
    indicator TEXT NOT NULL CHECK(indicator IN ('heart_rate','spo2','bone_density','muscle_mass','balance','motor_coordination')),
    value REAL NOT NULL, unit TEXT NOT NULL, measured_at TEXT NOT NULL,
    origin TEXT NOT NULL CHECK(origin IN ('manual','device','import')), notes TEXT NOT NULL DEFAULT '',
    created_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX measurements_astronaut_time ON measurements(astronaut_id, measured_at DESC);
  CREATE TABLE recovery_plans (
    id TEXT PRIMARY KEY, astronaut_id TEXT NOT NULL REFERENCES astronauts(id) ON DELETE CASCADE,
    goals TEXT NOT NULL, plan TEXT NOT NULL, responsible TEXT NOT NULL,
    next_review TEXT, status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','paused','completed')),
    created_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE rehab_sessions (
    id TEXT PRIMARY KEY, astronaut_id TEXT NOT NULL REFERENCES astronauts(id) ON DELETE CASCADE,
    plan_id TEXT REFERENCES recovery_plans(id) ON DELETE SET NULL, activity TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK(duration_minutes > 0), completed_at TEXT NOT NULL,
    observations TEXT NOT NULL DEFAULT '', professional TEXT NOT NULL,
    created_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE wellbeing_entries (
    id TEXT PRIMARY KEY, astronaut_id TEXT NOT NULL REFERENCES astronauts(id) ON DELETE CASCADE,
    occurred_at TEXT NOT NULL, stress INTEGER CHECK(stress BETWEEN 1 AND 10),
    anxiety INTEGER CHECK(anxiety BETWEEN 1 AND 10), mood TEXT NOT NULL DEFAULT '',
    sleep TEXT NOT NULL DEFAULT '', social_readaptation TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '', professional TEXT NOT NULL,
    created_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE sleep_nutrition_entries (
    id TEXT PRIMARY KEY, astronaut_id TEXT NOT NULL REFERENCES astronauts(id) ON DELETE CASCADE,
    occurred_at TEXT NOT NULL, sleep_hours REAL CHECK(sleep_hours BETWEEN 0 AND 24),
    sleep_quality TEXT NOT NULL DEFAULT '', rest_schedule TEXT NOT NULL DEFAULT '',
    hydration_liters REAL CHECK(hydration_liters BETWEEN 0 AND 30), meals_per_day REAL CHECK(meals_per_day BETWEEN 0 AND 20),
    nutrition_notes TEXT NOT NULL DEFAULT '', guidance TEXT NOT NULL DEFAULT '',
    professional TEXT NOT NULL, created_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE appointments (
    id TEXT PRIMARY KEY, astronaut_id TEXT NOT NULL REFERENCES astronauts(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK(type IN ('medical','physio','psychology','nutrition')),
    scheduled_at TEXT NOT NULL, professional TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'scheduled'
      CHECK(status IN ('scheduled','confirmed','cancelled','completed')),
    notes TEXT NOT NULL DEFAULT '', created_by TEXT NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE alert_rules (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, indicator TEXT NOT NULL,
    operator TEXT NOT NULL CHECK(operator IN ('<','<=','=','>=','>')),
    threshold REAL NOT NULL, severity TEXT NOT NULL CHECK(severity IN ('info','attention','professional_review')),
    explanation TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1)),
    created_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT, actor_id TEXT NOT NULL REFERENCES users(id),
    action TEXT NOT NULL, entity TEXT NOT NULL, entity_id TEXT NOT NULL, occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE sessions (sid TEXT PRIMARY KEY, sess TEXT NOT NULL, expired INTEGER NOT NULL);
  CREATE INDEX sessions_expired ON sessions(expired);
  INSERT INTO app_meta(key,value) VALUES ('schema_version','1');`
];

function openDatabase(filename) {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  const db = new Database(filename);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)');
  const applied = new Set(db.prepare('SELECT version FROM schema_migrations').all().map((row) => row.version));
  MIGRATIONS.forEach((sql, index) => {
    const version = index + 1;
    if (applied.has(version)) return;
    db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO schema_migrations(version) VALUES (?)').run(version);
    })();
  });
  return db;
}

module.exports = { openDatabase };
