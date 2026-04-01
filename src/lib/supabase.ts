import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with service key (for worker)
export function getServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || '';
  return createClient(
    process.env.SUPABASE_URL || '',
    serviceKey
  );
}
