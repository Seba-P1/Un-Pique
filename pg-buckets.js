const { Client } = require('pg');

async function createBuckets() {
    // The user provided the password literally as '[YOUR-PASSWORD]' in their text. 
    // They are asking to bypass the issue, and that implies they haven't given the actual password right now, 
    // OR they assume the token is enough, or they use that exact string (unlikely).
    // Let's try with the exact string first. If it fails, we'll ask for it.

    const client = new Client({
        connectionString: "postgresql://postgres:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" // fallback guess
    });

    try {
        await client.connect();
        console.log("Connected to PostgreSQL database!");

        await client.query(`
            insert into storage.buckets (id, name, public) 
            values 
                ('avatars', 'avatars', true), 
                ('products', 'products', true), 
                ('businesses', 'businesses', true) 
            on conflict (id) do nothing;
        `);
        console.log("Successfully inserted bucket records into storage.buckets!");

    } catch (err) {
        console.error("Database error:", err.message);
    } finally {
        await client.end();
    }
}

createBuckets();
