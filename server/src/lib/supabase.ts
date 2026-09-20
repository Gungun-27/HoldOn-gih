import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = process.env.SUPABASE_URL || 'https://zoaobozgtqpmmurbbyly.supabase.co';
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvYW9ib3pndHFwbW11cmJieWx5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTgzODk5MSwiZXhwIjoyMTA1NDE0OTkxfQ.3b7Z-9R0mlsChu8J1j7sURLDfmNOmMACJpMAl7BPQL8';

const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
