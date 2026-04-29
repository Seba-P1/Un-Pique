const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
    process.exit(1);
}

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
