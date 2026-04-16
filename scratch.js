import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
  const { data, error } = await supabase.from('guest_usage').select('*');
  console.dir(data, { depth: null });
  if (error) console.error(error);
}

run();
