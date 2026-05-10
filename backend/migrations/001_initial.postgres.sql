-- Migration 001: Initial Schema
-- PostgreSQL schema for the Monthly Financial Control System

CREATE TABLE IF NOT EXISTS periods (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK(month >= 1 AND month <= 12),
    closed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(year, month)
);

CREATE TABLE IF NOT EXISTS category_groups (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('revenue', 'investment', 'expense')),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES category_groups(id),
    name TEXT NOT NULL,
    expense_type TEXT CHECK(expense_type IN ('fixed', 'variable', 'extra', 'additional') OR expense_type IS NULL),
    sort_order INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, name)
);

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    period_id INTEGER NOT NULL REFERENCES periods(id),
    category_id INTEGER NOT NULL REFERENCES categories(id),
    date DATE NOT NULL,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'investment', 'expense')),
    note TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS monthly_summaries (
    id SERIAL PRIMARY KEY,
    period_id INTEGER NOT NULL UNIQUE REFERENCES periods(id),
    revenue_total INTEGER NOT NULL DEFAULT 0,
    investment_total INTEGER NOT NULL DEFAULT 0,
    fixed_expense_total INTEGER NOT NULL DEFAULT 0,
    variable_expense_total INTEGER NOT NULL DEFAULT 0,
    extra_expense_total INTEGER NOT NULL DEFAULT 0,
    additional_expense_total INTEGER NOT NULL DEFAULT 0,
    balance INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_period ON transactions(period_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_categories_group ON categories(group_id);
