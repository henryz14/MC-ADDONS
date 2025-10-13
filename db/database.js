const Database = require("better-sqlite3");
const path = require("path");

// Base de datos persistente en archivo
const dbPath = path.join(__dirname, "addons.db");
const db = new Database(dbPath);

// Crear tabla si no existe
db.prepare(`
  CREATE TABLE IF NOT EXISTS addons (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    author TEXT,
    description TEXT,
    type TEXT,
    fileHash TEXT UNIQUE,
    fileName TEXT,
    originalName TEXT,
    filePath TEXT,
    size INTEGER,
    images TEXT,
    uploadDate TEXT,
    downloads INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0
  )
`).run();

module.exports = db;
