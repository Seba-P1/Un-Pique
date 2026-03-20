const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://porrpkougyolayfzzmyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvcnJwa291Z3lvbGF5Znp6bXluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNTAzNDcsImV4cCI6MjA4NTgyNjM0N30.jz2VmPXcMJ5jEZKyLU-bDnr0yg-nO2VaK_URxdvF3FE';

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
