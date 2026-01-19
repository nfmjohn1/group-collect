import { createClient } from '@supabase/supabase-js';
import { ENV } from '@/shared/constants';

// Validate environment variables
if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables!');
  console.error('SUPABASE_URL:', ENV.SUPABASE_URL);
  console.error('SUPABASE_ANON_KEY:', ENV.SUPABASE_ANON_KEY ? '[SET]' : '[MISSING]');
}

// Validate URL format
if (ENV.SUPABASE_URL && !ENV.SUPABASE_URL.startsWith('https://')) {
  console.error('Invalid Supabase URL format:', ENV.SUPABASE_URL);
  console.error('Expected format: https://[project-ref].supabase.co');
}

// Initialize Supabase client
export const supabase = createClient(
  ENV.SUPABASE_URL || 'https://placeholder.supabase.co',
  ENV.SUPABASE_ANON_KEY || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export default supabase;
