const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://porrpkougyolayfzzmyn.supabase.co';
// Using the service_role key provided by the user to bypass RLS
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvcnJwa291Z3lvbGF5Znp6bXluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDI1MDM0NywiZXhwIjoyMDg1ODI2MzQ3fQ.XRrAZW_vrGuSS4Gl-V5tz5-iotaoZnjXY3EMCpcn2vc';

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
