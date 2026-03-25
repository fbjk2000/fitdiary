import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// REPLACE these with your actual credentials from Supabase
const supabaseUrl = 'https://sxypfuvyegmxulqzglqn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4eXBmdXZ5ZWdteHVscXpnbHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDk0MzQsImV4cCI6MjA4OTk4NTQzNH0.86EWsjZCVQa22k0nX0mbiQ87UtHwtVMBnvp36vfyQok';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});