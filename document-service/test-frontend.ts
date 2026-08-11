import { createClient } from '@supabase/supabase-js';
import { env } from './src/config/env';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load frontend env for ANON key
dotenv.config({ path: path.resolve(__dirname, '../frontend/.env.local') });

// Use ANON key to simulate frontend RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

async function test() {
  const markusEmail = 'bsit.student2@cvsu.edu.ph';
  // We can't auth.getUser() without a token, so we'll just sign in
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: markusEmail,
    password: 'password123' // default for test accounts usually
  });
  
  if (authErr) {
    console.error('Auth error:', authErr.message);
    return;
  }
  
  console.log('Signed in as:', authData.user.id);
  
  const { data: internship, error } = await supabase
    .from("internships")
    .select("advisor_id")
    .eq("student_id", authData.user.id)
    .in("status", ["active", "pending"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
    
  console.log('Query result:', internship);
  if (error) {
    console.error('Query error:', error);
  }
}

test().catch(console.error);
