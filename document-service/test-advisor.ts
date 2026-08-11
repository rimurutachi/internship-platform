import { createClient } from '@supabase/supabase-js';
import { env } from './src/config/env';

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function test() {
  const advisorId = '9ee419a3-7265-4cd8-bc18-239940b262bd'; // Edan Belgica
  
  const { data: sharedAccess, error: accessError } = await supabase
    .from('document_access_control')
    .select('document_id')
    .eq('user_id', advisorId)
    .is('revoked_at', null);
    
  console.log('Advisor shared access:', sharedAccess);
  if (accessError) console.error(accessError);
  
  if (sharedAccess && sharedAccess.length > 0) {
    const docIds = sharedAccess.map(a => a.document_id);
    
    const { data: docs, error: docError } = await supabase
      .from('documents')
      .select('*, owner:users!owner_id(id, first_name, last_name, email)')
      .in('id', docIds);
      
    if (docError) console.error(docError);
    console.log('Advisor accessible shared docs:', docs?.map(d => ({ title: d.title, owner: d.owner?.email })));
  }
}

test().catch(console.error);
