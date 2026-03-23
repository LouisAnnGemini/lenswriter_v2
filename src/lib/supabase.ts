import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getSupabaseConfig = () => {
  const stored = localStorage.getItem('supabase_config');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return null;
    }
  }
  return null;
};

const config = getSupabaseConfig();
const supabaseUrl = config?.url || import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = config?.key || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const updateSupabaseConfig = (url: string, key: string) => {
  localStorage.setItem('supabase_config', JSON.stringify({ url, key }));
  window.location.reload(); // Reload to re-initialize the client
};
