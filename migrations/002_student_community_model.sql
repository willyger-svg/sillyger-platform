-- ============================================================================
-- SILLYGER (SG) Automated Migration: 002_student_community_model.sql
-- Purpose: Remove mandatory division/track selection so all students join as
-- one unified learning community ("SG Student Community"), with optional
-- learning_interest note.
-- ============================================================================

ALTER TABLE public.members
    ALTER COLUMN track DROP NOT NULL,
    ALTER COLUMN track SET DEFAULT 'SG Student Community';

ALTER TABLE public.members
    ADD COLUMN IF NOT EXISTS learning_interest TEXT DEFAULT '';

UPDATE public.members
SET track = 'SG Student Community'
WHERE track IS NULL OR btrim(track) = '';
