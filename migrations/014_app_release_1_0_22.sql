-- ==============================================================================
-- Migration 014: App Release v1.0.22 (Smart Overlay, Floating Reactions & Expandable AI)
-- ==============================================================================

INSERT INTO public.platform_settings (key, value, updated_at)
VALUES (
    'app_release',
    '{"version":"1.0.22","build_number":23,"min_version":"1.0.0","download_url":"https://github.com/willyger-svg/sillyger-platform/releases/download/v1.0.22/sillyger-app.apk","release_notes":"Toleo v1.0.22: Maboresho makubwa ya TV & Live Chat! Vidhibiti vya video kujificha (Smart Overlay) kwa ajili ya nafasi kubwa ya chati, Emojis zinazopaa hewani mubashara (Floating Reactions), na Majibu ya AI kujikunja (Soma Zaidi/Funga).","is_mandatory":false}',
    NOW()
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = NOW();
