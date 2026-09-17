const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

let dbInstance = null;

function initDb(customPath) {
  if (dbInstance && !customPath) {
    return dbInstance;
  }

  const dbPath = customPath || path.join(__dirname, 'data', 'links.db');

  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(dbPath);

  // Enable WAL mode for high performance concurrency
  if (dbPath !== ':memory:') {
    db.exec('PRAGMA journal_mode = WAL;');
  }

  // Schema creation
  db.exec(`
    CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL COLLATE NOCASE,
      original_url TEXT NOT NULL,
      clicks INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      last_clicked_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_links_slug ON links(slug);
  `);

  dbInstance = db;

  return db;
}

function getDb() {
  if (!dbInstance) {
    return initDb();
  }
  return dbInstance;
}

function createLink({ slug, originalUrl }) {
  const db = getDb();
  const createdAt = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO links (slug, original_url, clicks, created_at)
    VALUES (?, ?, 0, ?)
  `);
  
  stmt.run(slug, originalUrl, createdAt);

  return getLinkBySlug(slug);
}

function getLinkBySlug(slug) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT id, slug, original_url, clicks, created_at, last_clicked_at
    FROM links
    WHERE slug = ?
  `);
  return stmt.get(slug);
}

function incrementClicks(slug) {
  const db = getDb();
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    UPDATE links
    SET clicks = clicks + 1, last_clicked_at = ?
    WHERE slug = ?
  `);
  const result = stmt.run(now, slug);
  if (result.changes > 0) {
    return getLinkBySlug(slug);
  }
  return null;
}

function getAllLinks() {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT id, slug, original_url, clicks, created_at, last_clicked_at
    FROM links
    ORDER BY id DESC
  `);
  return stmt.all();
}

function deleteLink(slug) {
  const db = getDb();
  const stmt = db.prepare(`
    DELETE FROM links
    WHERE slug = ?
  `);
  const result = stmt.run(slug);
  return result.changes > 0;
}

function isSlugAvailable(slug) {
  const existing = getLinkBySlug(slug);
  return !existing;
}

module.exports = {
  initDb,
  getDb,
  createLink,
  getLinkBySlug,
  incrementClicks,
  getAllLinks,
  deleteLink,
  isSlugAvailable,
};
