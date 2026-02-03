import { useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase';

interface UploadParams {
  file: File;
  documentId: string;
  signatureId: string;
  documentName: string;
}

export function useScannedUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const supabase = createSupabaseClient();

  const uploadFile = async ({
    file,
    documentId,
    signatureId,
    documentName,
  }: UploadParams) => {
    try {
      setIsLoading(true);
      setProgress(0);

      console.log('🔵 [useScannedUpload] Starting upload', {
        fileName: file.name,
        fileSize: file.size,
        documentId: documentId.substring(0, 8),
      });

      // Step 1: Upload to Supabase Storage
      const timestamp = new Date().getTime();
      const fileExtension = file.name.split('.').pop();
      const storagePath = `documents/${documentId}/scanned/${signatureId}-${timestamp}.${fileExtension}`;

      console.log('💾 [useScannedUpload] Uploading to Supabase Storage:', storagePath);

      setProgress(20);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('❌ [useScannedUpload] Storage upload failed:', uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      console.log('✅ [useScannedUpload] Uploaded to storage:', uploadData.path);

      setProgress(50);

      // Step 2: Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(storagePath);

      const fileUrl = urlData.publicUrl;
      console.log('🔗 [useScannedUpload] Generated public URL');

      setProgress(70);

      // Step 3: Update document_signatures with scanned file info
      const { data: updateData, error: updateError } = await supabase
        .from('document_signatures')
        .update({
          scanned_file_url: fileUrl,
          scanned_uploaded_at: new Date().toISOString(),
          scanned_uploaded_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', signatureId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ [useScannedUpload] Database update failed:', updateError);
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      console.log('✅ [useScannedUpload] Updated signature record with scanned file');

      setProgress(90);

      // Step 4: Create verification attempt record for audit
      const { error: auditError } = await supabase
        .from('signature_verification_attempts')
        .insert({
          signature_id: signatureId,
          document_id: documentId,
          verified_by: (await supabase.auth.getUser()).data.user?.id,
          verification_result: 'pending_review',
          verification_reason: 'Scanned document uploaded by signer',
        });

      if (auditError) {
        console.warn('⚠️ [useScannedUpload] Audit log creation failed (non-critical):', auditError);
        // Don't throw - this is non-critical
      } else {
        console.log('📝 [useScannedUpload] Audit entry created');
      }

      setProgress(100);

      console.log('✅ [useScannedUpload] Complete upload and verification setup', {
        signatureId: signatureId.substring(0, 8),
        fileUrl,
        timestamp: updateData.scanned_uploaded_at,
      });

      return updateData;
    } catch (error) {
      console.error('❌ [useScannedUpload] Error:', error);
      throw error;
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  return {
    uploadFile,
    isLoading,
    progress,
  };
}
