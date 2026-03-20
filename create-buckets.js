const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://porrpkougyolayfzzmyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvcnJwa291Z3lvbGF5Znp6bXluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNTAzNDcsImV4cCI6MjA4NTgyNjM0N30.jz2VmPXcMJ5jEZKyLU-bDnr0yg-nO2VaK_URxdvF3FE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createBuckets() {
    console.log("Creating missing Supabase Storage buckets...");
    const requiredBuckets = ['avatars', 'products', 'businesses'];

    for (const bucket of requiredBuckets) {
        console.log(`Attempting to create bucket: ${bucket}...`);
        const { data, error } = await supabase.storage.createBucket(bucket, {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
            fileSizeLimit: 10485760 // 10MB
        });

        if (error) {
            console.error(`Failed to create ${bucket}:`, error.message);
        } else {
            console.log(`Successfully created ${bucket}!`);
        }
    }
}

createBuckets();
