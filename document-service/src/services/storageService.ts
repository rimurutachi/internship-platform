import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

// Minimal storage service wrapping Supabase Storage for private bucket usage.
class StorageService {
  private supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
  private bucket = env.STORAGE_BUCKET_DOCUMENTS;

  async uploadDocumentFile(params: {
    documentId: string;
    buffer: Buffer;
    fileName: string;
    contentType?: string;
  }): Promise<{ path: string; checksum: string }> {
    const { documentId, buffer, fileName, contentType } = params;
    const timestamp = Date.now();
    const cleanName = fileName.replace(/\s+/g, "_");
    const path = `${documentId}/${timestamp}_${cleanName}`;
    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(path, buffer, {
        contentType: contentType || "application/octet-stream",
        upsert: false,
      });

    if (error) {
      console.error("❌ [Storage] Upload failed", { path, error });
      throw error;
    }

    console.log("🟢 [Storage] Uploaded", { path, bytes: buffer.length, checksum });
    return { path, checksum };
  }

  async createSignedUrl(path: string, expiresInSeconds?: number) {
    const expiresIn = expiresInSeconds || env.STORAGE_SIGNED_URL_EXPIRES;
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error("❌ [Storage] Signed URL failed", { path, error });
      throw error;
    }

    return data.signedUrl;
  }

  async removeFile(path: string) {
    const { error } = await this.supabase.storage.from(this.bucket).remove([path]);
    if (error) {
      console.error("❌ [Storage] Delete failed", { path, error });
      throw error;
    }
    console.log("🗑️ [Storage] Deleted", { path });
  }
}

export const storageService = new StorageService();
export default storageService;
