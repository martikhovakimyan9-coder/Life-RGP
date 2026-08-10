import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pkujrsmrhhzriloxvcxo.supabase.co';
const SUPABASE_ANON_KEY = 'EyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrdWpyc21yaGh6cmlsb3h2Y3hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyOTgxMjksImV4cCI6MjEwMTg3NDEyOX0.sxM2Oz0pRv2UWDQyai743UvjFRpCAs3KBHi90pZmods';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
