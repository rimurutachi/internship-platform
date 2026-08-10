import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(__dirname, ".env.production") });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function run() {
  const { data, error } = await supabase.from('internships').select('*').eq('student_id', 'b29964cf-4040-4846-99b6-a44f01afb2c2');
  console.log('INTERNSHIPS:', JSON.stringify({data, error}, null, 2));
}

run().catch(console.error);
