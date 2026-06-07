/**
 * SQLite database for TechGuard-specific data
 * (schedules, rules, overrides, profiles, content filters, dns logs, screen time)
 */

import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/techguard.db')

let db

export function getDb() {
  if (!db) {
    const dir = path.dirname(DB_PATH)
    fs.mkdirSync(dir, { recursive: true })

    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initSchema()
  }
  return db
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      name TEXT NOT NULL DEFAULT 'New rule',
      days TEXT NOT NULL DEFAULT '[1,2,3,4,5]',
      access_start TEXT NOT NULL DEFAULT '07:00',
      access_end TEXT NOT NULL DEFAULT '21:00',
      enabled INTEGER NOT NULL DEFAULT 1,
      priority INTEGER NOT NULL DEFAULT 10,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS overrides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(profile_id, date)
    );

    CREATE TABLE IF NOT EXISTS content_filters (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      action TEXT NOT NULL DEFAULT 'allow',
      enabled INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS dns_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      client_ip TEXT,
      device_mac TEXT,
      device_name TEXT,
      domain TEXT NOT NULL,
      service TEXT,
      category TEXT,
      icon TEXT,
      blocked INTEGER NOT NULL DEFAULT 0,
      profile_id TEXT
    );

    CREATE TABLE IF NOT EXISTS screen_time_budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      daily_minutes INTEGER NOT NULL DEFAULT 120,
      enabled INTEGER NOT NULL DEFAULT 0,
      reset_hour INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(profile_id)
    );

    CREATE TABLE IF NOT EXISTS daily_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      device_mac TEXT NOT NULL,
      date TEXT NOT NULL,
      minutes_used REAL NOT NULL DEFAULT 0,
      last_updated TEXT DEFAULT (datetime('now')),
      UNIQUE(profile_id, device_mac, date)
    );

    CREATE INDEX IF NOT EXISTS idx_rules_profile ON rules(profile_id);
    CREATE INDEX IF NOT EXISTS idx_overrides_profile ON overrides(profile_id, date);
    CREATE INDEX IF NOT EXISTS idx_filters_profile ON content_filters(profile_id);
    CREATE INDEX IF NOT EXISTS idx_dns_logs_ts ON dns_logs(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_dns_logs_device ON dns_logs(device_mac);
    CREATE INDEX IF NOT EXISTS idx_dns_logs_service ON dns_logs(service);
    CREATE INDEX IF NOT EXISTS idx_daily_usage_lookup ON daily_usage(profile_id, device_mac, date);
  `)

  // Seed default profiles if empty
  const count = db.prepare('SELECT COUNT(*) as c FROM profiles').get()
  if (count.c === 0) {
    const insert = db.prepare('INSERT INTO profiles (id, name) VALUES (?, ?)')
    insert.run('default', 'Default')
    insert.run('adult', 'Adults')
    insert.run('kids', 'Kids')
  }
}