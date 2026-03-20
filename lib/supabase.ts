// Supabase Client Configuration
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://porrpkougyolayfzzmyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvcnJwa291Z3lvbGF5Znp6bXluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNTAzNDcsImV4cCI6MjA4NTgyNjM0N30.jz2VmPXcMJ5jEZKyLU-bDnr0yg-nO2VaK_URxdvF3FE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
