-- Migration: Analytics Tables for VSL Dashboard
-- Created: 2026-02-01

-- 1. Rastreamento de cliques em botões
CREATE TABLE public.button_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  button_id TEXT NOT NULL,
  button_label TEXT,
  page_url TEXT,
  session_id TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Eventos de visualização de vídeo
CREATE TABLE public.video_watch_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  video_id TEXT DEFAULT 'vsl_main',
  event_type TEXT NOT NULL,
  current_time_seconds INTEGER,
  duration_seconds INTEGER,
  percent_watched INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Sessões de página
CREATE TABLE public.page_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.button_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_watch_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for button_clicks
CREATE POLICY "Anyone can insert button_clicks"
ON public.button_clicks FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view button_clicks"
ON public.button_clicks FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policies for video_watch_events
CREATE POLICY "Anyone can insert video_watch_events"
ON public.video_watch_events FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view video_watch_events"
ON public.video_watch_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policies for page_sessions
CREATE POLICY "Anyone can insert page_sessions"
ON public.page_sessions FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can update own session"
ON public.page_sessions FOR UPDATE TO anon, authenticated
USING (true);

CREATE POLICY "Admins can view page_sessions"
ON public.page_sessions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Indexes for performance
CREATE INDEX idx_button_clicks_button_id ON public.button_clicks(button_id);
CREATE INDEX idx_button_clicks_created_at ON public.button_clicks(created_at);
CREATE INDEX idx_button_clicks_session_id ON public.button_clicks(session_id);
CREATE INDEX idx_video_watch_session ON public.video_watch_events(session_id);
CREATE INDEX idx_video_watch_created_at ON public.video_watch_events(created_at);
CREATE INDEX idx_page_sessions_started_at ON public.page_sessions(started_at);
