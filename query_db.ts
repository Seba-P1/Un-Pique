import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.join(__dirname, '.env');
let supabaseUrl = 'YOUR_URL';
let supabaseKey = 'YOUR_KEY';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('EXPO_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('EXPO_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseKey = line.split('=')[1].trim();
    }
  }
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- DB Queries ---');
  const { data: stories, error } = await supabase.from('stories').select('*').limit(1);
  console.log('Story columns available to anon:', stories ? Object.keys(stories[0] || {}) : error);

  const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
  console.log('Storage Buckets:', buckets?.map(b => b.name) || bErr);
}
run();
