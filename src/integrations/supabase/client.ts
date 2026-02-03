import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://eidcxqxjmraargwhrdai.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpZGN4cXhqbXJhYXJnd2hyZGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMDk5MDQsImV4cCI6MjA3NzY4NTkwNH0.N3rGabdTCz5IjdJlUw58nBpC7m4aIVJnP5r_brT8W5Y";

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  console.warn("Supabase environment variables are missing! Using hardcoded fallbacks for production stability.");
}

// 1. Cliente Autenticado (Para login e funções de admin que exigem senha)
export const supabase = createClient<Database>(SUPABASE_URL || "", SUPABASE_PUBLISHABLE_KEY || "", {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// 2. Cliente Público Blindado (Para VSL e Uploads de emergência - IGNORA JWS/JWT)
export const supabasePublic = createClient<Database>(SUPABASE_URL || "", SUPABASE_PUBLISHABLE_KEY || "", {
  auth: {
    persistSession: false, // Não guarda sessão
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storage: { // Storage "fake" para garantir que ele nunca pegue tokens do navegador
      getItem: () => null,
      setItem: () => { },
      removeItem: () => { }
    }
  }
});