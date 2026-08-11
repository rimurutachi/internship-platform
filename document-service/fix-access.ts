import { createClient } from '@supabase/supabase-js';
import { env } from './src/config/env';

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function retroFixAccessControl() {
  console.log('🔍 Starting retroactive fix for in_review documents...');
  
  // 1. Find all documents that are in 'in_review' status
  const { data: docs, error: docErr } = await supabase
    .from('documents')
    .select('id, owner_id, title')
    .eq('status', 'in_review');
    
  if (docErr) throw docErr;
  console.log(`Found ${docs?.length || 0} documents in review.`);
  
  if (!docs || docs.length === 0) return;
  
  let fixedCount = 0;
  
  for (const doc of docs) {
    // 2. Check if access control already exists for this document
    const { data: existingAccess } = await supabase
      .from('document_access_control')
      .select('id')
      .eq('document_id', doc.id);
      
    if (!existingAccess || existingAccess.length === 0) {
      console.log(`⚠️ Document "${doc.title}" is missing access control. Fixing...`);
      
      // Find the student's active/pending internship
      const { data: internship } = await supabase
        .from('internships')
        .select('advisor_id')
        .eq('student_id', doc.owner_id)
        .in('status', ['active', 'pending'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (internship?.advisor_id) {
        // Grant view access to the advisor
        const { error: insertErr } = await supabase
          .from('document_access_control')
          .insert({
            document_id: doc.id,
            user_id: internship.advisor_id,
            permission_level: 'view',
            granted_by: doc.owner_id
          });
          
        if (insertErr) {
          console.error(`❌ Failed to fix document ${doc.id}:`, insertErr);
        } else {
          console.log(`✅ Granted access to advisor ${internship.advisor_id}`);
          fixedCount++;
        }
      } else {
        console.warn(`⚠️ No active internship found for student ${doc.owner_id}`);
      }
    } else {
      console.log(`✅ Document "${doc.title}" already has access control.`);
    }
  }
  
  console.log(`🎉 Retroactive fix complete! Fixed ${fixedCount} documents.`);
}

retroFixAccessControl().catch(console.error);
