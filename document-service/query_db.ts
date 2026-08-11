import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(__dirname, ".env.production") });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function run() {
  console.log("Fetching docs...");
  const { data: docs } = await supabase.from('documents').select('id, title, status, owner_id');
  console.log('DOCS:', JSON.stringify(docs, null, 2));
  
  console.log("Fetching access...");
  const { data: access } = await supabase.from('document_access_control').select('document_id, user_id, permission_level');
  console.log('ACCESS:', JSON.stringify(access, null, 2));
}

run().catch(console.error);
