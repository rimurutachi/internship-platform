import { createClient } from '@supabase/supabase-js';
import { env } from './src/config/env';

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function test() {
  const { data: check, error } = await supabase
    .from('document_access_control')
    .insert({
      document_id: '48e14c41-0df6-45c6-bb31-0b612347c5a9',
      user_id: '9ee419a3-7265-4cd8-bc18-239940b262bd',
      permission_level: 'view',
      granted_by: 'b29964cf-4040-4846-99b6-a44f01afb2c2'
    })
    .select();
    
  console.log('Manual insert result:', check);
  if (error) console.error('Manual insert error:', error);
}

test().catch(console.error);
