-- Migration 002: Balance Snapshot
-- SQLite schema for periodic balance snapshots

CREATE TABLE IF NOT EXISTS balance_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total_balance REAL NOT NULL DEFAULT 0,
    total_income REAL NOT NULL DEFAULT 0,
    total_expense REAL NOT NULL DEFAULT 0,
    total_credit REAL NOT NULL DEFAULT 0,
    total_debit REAL NOT NULL DEFAULT 0,
    month_count INTEGER NOT NULL DEFAULT 0,
    calculated_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
