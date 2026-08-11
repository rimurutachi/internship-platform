import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(__dirname, ".env.production") });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function run() {
  const { data, error } = await supabase.from('document_access_control').insert({
    document_id: '640c11b0-c645-4bff-8ea6-e75764f19f09',
    user_id: '9ee419a3-7265-4cd8-bc18-239940b262bd',
    permission_level: 'view',
    granted_by: 'b29964cf-4040-4846-99b6-a44f01afb2c2',
  }).select();
  console.log('INSERT RESULT:', JSON.stringify({data, error}, null, 2));
}

run().catch(console.error);
