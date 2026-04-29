const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkBuckets() {
    console.log("Checking Supabase Storage buckets...");
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error("Error fetching buckets:", error.message);
        return;
    }

    const requiredBuckets = ['avatars', 'products', 'businesses'];
    const existingBucketNames = buckets.map(b => b.name);

    console.log("Existing buckets:", existingBucketNames.join(', ') || 'None');

    const missingBuckets = requiredBuckets.filter(b => !existingBucketNames.includes(b));

    if (missingBuckets.length > 0) {
        console.log("MISSING BUCKETS:", missingBuckets.join(', '));
    } else {
        console.log("SUCCESS: All required buckets exist.");
    }
}

checkBuckets();
