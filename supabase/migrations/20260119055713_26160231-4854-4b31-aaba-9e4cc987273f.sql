-- Add page_key column to identify which page/section the video belongs to
ALTER TABLE public.vsl_video ADD COLUMN IF NOT EXISTS page_key TEXT NOT NULL DEFAULT 'home_vsl';

-- Add unique constraint to ensure one video per page
ALTER TABLE public.vsl_video ADD CONSTRAINT unique_page_key UNIQUE (page_key);

-- Update existing video to home_vsl
UPDATE public.vsl_video SET page_key = 'home_vsl' WHERE page_key IS NULL OR page_key = '';