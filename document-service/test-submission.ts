import { createClient } from '@supabase/supabase-js';
import { env } from './src/config/env';

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function test() {
  console.log('Testing internships query...');
  
  // Find Markus Tan (from screenshot)
  const { data: users, error: err1 } = await supabase.from('users').select('id, email, first_name, last_name, role').ilike('first_name', '%Markus%');
  if (err1) console.error(err1);
  console.log('Users:', users);
  
  if (users && users.length > 0) {
    const markusId = users[0].id;
    
    // Check internship
    const { data: internship, error: err2 } = await supabase
      .from('internships')
      .select('advisor_id, status')
      .eq('student_id', markusId)
      .in('status', ['active', 'pending'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (err2) console.error('Internship error:', err2);
    console.log('Internship for Markus:', internship);
    
    // Check documents
    const { data: docs, error: err3 } = await supabase
      .from('documents')
      .select('id, title, status, owner_id')
      .eq('owner_id', markusId);
      
    if (err3) console.error(err3);
    console.log('Documents owned by Markus:', docs);
    
    if (docs && docs.length > 0) {
      // Check access control
      for (const doc of docs) {
        const { data: access } = await supabase
          .from('document_access_control')
          .select('*')
          .eq('document_id', doc.id);
          
        console.log(`Access control for ${doc.title}:`, access);
      }
    }
  }
}

test().catch(console.error);
