const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
// Service role key - NEVER commit this. Must be in .env only.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBuckets() {
    console.log("Creating missing Supabase Storage buckets using service_role key...");
    const requiredBuckets = ['avatars', 'products', 'businesses'];

    for (const bucket of requiredBuckets) {
        console.log(`Attempting to create public bucket: ${bucket}...`);
        const { data, error } = await supabase.storage.createBucket(bucket, {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
            fileSizeLimit: 10485760 // 10MB
        });

        if (error) {
            // Error occurs if bucket already exists or other issues
            if (error.message.includes('already exists')) {
                console.log(`Bucket ${bucket} already exists. Validating public access...`);
                // Ensure it is public
                await supabase.storage.updateBucket(bucket, {
                    public: true,
                    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
                    fileSizeLimit: 10485760 // 10MB
                });
            } else {
                console.error(`Failed to create ${bucket}:`, error.message);
            }
        } else {
            console.log(`Successfully created ${bucket}!`);
        }
    }
}

createBuckets();
