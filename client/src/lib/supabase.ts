import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zoaobozgtqpmmurbbyly.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvYW9ib3pndHFwbW11cmJieWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4Mzg5OTEsImV4cCI6MjEwNTQxNDk5MX0.xt8UglFiNG8VsWSswmjZ6AOI2wdTf6FcXpPZK1Erre8';

// Normalize url by stripping any /rest/v1 or trailing slash
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
