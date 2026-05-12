-- Migration 002: Balance Snapshot
-- PostgreSQL schema for periodic balance snapshots

CREATE TABLE IF NOT EXISTS balance_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_income NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_expense NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_credit NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_debit NUMERIC(15,2) NOT NULL DEFAULT 0,
    month_count INTEGER NOT NULL DEFAULT 0,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
