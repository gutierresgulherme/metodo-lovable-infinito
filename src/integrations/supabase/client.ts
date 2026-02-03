import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error("Supabase URL or Publishable Key is missing!");
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