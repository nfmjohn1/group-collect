import { createClient } from '@supabase/supabase-js';
import { ENV } from '@/shared/constants';

// Initialize Supabase client
export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY);

export default supabase;
