-- ============================================================================
-- SILLYGER (SG) Automated Migration: 001_initial_schema.sql
-- Baseline schema marker (Core tables & RLS synced via idempotent schema.sql)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
