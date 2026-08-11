import { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { AuthRequest } from "../middleware/auth";
import { env } from "../config/env";
import storageService from "../services/storageService";
import mammoth from "mammoth";
import JSZip from "jszip";
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function ensureDocumentAccess(documentId: string, userId: string, isAdmin: boolean) {
  if (isAdmin) return true;

  // Owner check
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("id, owner_id")
    .eq("id", documentId)
    .single();

  if (docError || !doc) return false;
  if (doc.owner_id === userId) return true;

  // Explicit access control check (view or higher)
  const { data: dac, error: dacError } = await supabase
    .from("document_access_control")
    .select("permission_level, expires_at, revoked_at")
    .eq("document_id", documentId)
    .eq("user_id", userId)
    .is("revoked_at", null)
    .limit(1)
    .maybeSingle();

  if (dacError) {
    console.error("❌ [Files] Access check error", dacError);
    return false;
  }

  if (!dac) return false;
  if (dac.expires_at && new Date(dac.expires_at) < new Date()) return false;

  return true;
}

export async function uploadFile(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { id: documentId } = req.params;
    const file = (req as any).file as Express.Multer.File | undefined;

    if (!file) {
      return res.status(400).json({ success: false, error: "File is required." });
    }

    const hasAccess = await ensureDocumentAccess(documentId, req.user.id, req.user.role === "admin");
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: "No permission to upload to this document." });
    }

    const { path, checksum } = await storageService.uploadDocumentFile({
      documentId,
      buffer: file.buffer,
      fileName: file.originalname,
      contentType: file.mimetype,
    });

    const isPrimary = (req.body?.is_primary ?? "false").toString() === "true";

    const { data: record, error: insertError } = await supabase
      .from("document_files")
      .insert({
        document_id: documentId,
        storage_path: path,
        file_name: file.originalname,
        file_size: file.size,
        mime_type: file.mimetype,
        checksum,
        uploaded_by: req.user.id,
        is_primary: isPrimary,
      })
      .select()
      .single();

    if (insertError) {
      console.error("❌ [Files] DB insert failed", insertError);
      // Attempt cleanup in storage
      try { await storageService.removeFile(path); } catch (_) {}
      throw insertError;
    }

    if (isPrimary) {
      let documentContent = undefined;

      // Extract text from docx if it's a Word document
      if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        try {
          const options = {
            styleMap: [
              "p[style-name='Title'] => h1:fresh",
              "p[style-name='Heading 1'] => h1:fresh",
              "p[style-name='Heading 2'] => h2:fresh",
              "p[style-name='Heading 3'] => h3:fresh",
              "p[style-name='Subtitle'] => h2:fresh",
              "p[alignment='center'] => p[style='text-align: center']:fresh",
              "p[alignment='right'] => p[style='text-align: right']:fresh",
              "p[alignment='justify'] => p[style='text-align: justify']:fresh",
              "b => strong",
              "i => em",
              "u => u",
              "strike => del"
            ]
          };

          // 1. Extract Main Body
          const result = await mammoth.convertToHtml({ buffer: file.buffer }, options);
          let mainHtml = result.value || "";

          // 2. Extract Headers and Footers via JSZip hack
          let headerHtml = "";
          let footerHtml = "";
          
          try {
            const zip = await JSZip.loadAsync(file.buffer);
            
            // Extract Header
            const headerXml = zip.file("word/header1.xml");
            if (headerXml) {
              const headerContent = await headerXml.async("string");
              const headerZip = await JSZip.loadAsync(file.buffer); // fresh copy
              headerZip.file("word/document.xml", headerContent);
              const headerZipBuffer = await headerZip.generateAsync({ type: "nodebuffer" });
              const headerResult = await mammoth.convertToHtml({ buffer: headerZipBuffer }, options);
              headerHtml = headerResult.value || "";
              console.log("📝 [Files] Extracted Header HTML");
            }

            // Extract Footer
            const footerXml = zip.file("word/footer1.xml");
            if (footerXml) {
              const footerContent = await footerXml.async("string");
              const footerZip = await JSZip.loadAsync(file.buffer); // fresh copy
              footerZip.file("word/document.xml", footerContent);
              const footerZipBuffer = await footerZip.generateAsync({ type: "nodebuffer" });
              const footerResult = await mammoth.convertToHtml({ buffer: footerZipBuffer }, options);
              footerHtml = footerResult.value || "";
              console.log("📝 [Files] Extracted Footer HTML");
            }
          } catch (zipErr) {
            console.warn("⚠️ [Files] Could not extract header/footer from zip:", zipErr);
          }

          if (mainHtml || headerHtml || footerHtml) {
            documentContent = { 
              html: mainHtml,
              headerHtml: headerHtml,
              footerHtml: footerHtml
            };
            console.log("📝 [Files] Extracted content from docx file");
          }
        } catch (extractError) {
          console.warn("⚠️ [Files] Could not extract text from docx:", extractError);
        }
      }

      const updateData: any = { 
        file_url: path, 
        file_type: file.mimetype, 
        file_size: file.size, 
        updated_at: new Date().toISOString() 
      };

      if (documentContent) {
        updateData.content = documentContent;
      }

      await supabase
        .from("documents")
        .update(updateData)
        .eq("id", documentId);
    }

    const signedUrl = await storageService.createSignedUrl(path);

    console.log("🟢 [Files] Uploaded", { documentId, path, file: file.originalname, isPrimary });

    return res.status(201).json({ success: true, data: { ...record, signed_url: signedUrl } });
  } catch (error) {
    console.error("❌ [Files] Upload error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function listFiles(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { id: documentId } = req.params;
    const hasAccess = await ensureDocumentAccess(documentId, req.user.id, req.user.role === "admin");
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: "No permission to view files." });
    }

    const { data, error } = await supabase
      .from("document_files")
      .select("*")
      .eq("document_id", documentId)
      .order("uploaded_at", { ascending: false });

    if (error) throw error;

    return res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error("❌ [Files] List error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function getSignedUrl(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { fileId } = req.params;
    const expires = parseInt((req.query.expires as string) || "", 10) || undefined;

    const { data: fileRecord, error } = await supabase
      .from("document_files")
      .select("*")
      .eq("id", fileId)
      .single();

    if (error || !fileRecord) {
      return res.status(404).json({ success: false, error: "File not found" });
    }

    const hasAccess = await ensureDocumentAccess(fileRecord.document_id, req.user.id, req.user.role === "admin");
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: "No permission to access this file." });
    }

    const signedUrl = await storageService.createSignedUrl(fileRecord.storage_path, expires);
    return res.json({ success: true, data: { signed_url: signedUrl } });
  } catch (error) {
    console.error("❌ [Files] Signed URL error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function deleteFile(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { fileId } = req.params;

    const { data: fileRecord, error } = await supabase
      .from("document_files")
      .select("*")
      .eq("id", fileId)
      .single();

    if (error || !fileRecord) {
      return res.status(404).json({ success: false, error: "File not found" });
    }

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("owner_id")
      .eq("id", fileRecord.document_id)
      .single();

    if (docError || !doc) {
      return res.status(404).json({ success: false, error: "Parent document not found" });
    }

    const isAdmin = req.user.role === "admin";
    const allowed = isAdmin || doc.owner_id === req.user.id;
    if (!allowed) {
      return res.status(403).json({ success: false, error: "No permission to delete this file." });
    }

    await storageService.removeFile(fileRecord.storage_path);

    const { error: delError } = await supabase
      .from("document_files")
      .delete()
      .eq("id", fileId);

    if (delError) throw delError;

    // If primary, clear document.file_url
    if (fileRecord.is_primary) {
      await supabase
        .from("documents")
        .update({ file_url: null, file_size: null, file_type: null, updated_at: new Date().toISOString() })
        .eq("id", fileRecord.document_id);
    }

    console.log("🗑️ [Files] Deleted", { fileId, path: fileRecord.storage_path });
    return res.json({ success: true, message: "File deleted" });
  } catch (error) {
    console.error("❌ [Files] Delete error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}
