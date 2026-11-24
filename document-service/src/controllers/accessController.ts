import { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { AuthRequest } from "../middleware/auth";
import { env } from "../config/env";
import auditService from "../services/auditService";
import notificationClient from "../services/notificationClient";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function ensureDocumentOwnerOrAdmin(documentId: string, userId: string, isAdmin: boolean) {
  if (isAdmin) return true;

  const { data: doc, error } = await supabase
    .from("documents")
    .select("owner_id")
    .eq("id", documentId)
    .single();

  if (error || !doc) return false;
  return doc.owner_id === userId;
}

export async function grantAccess(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { documentId } = req.params;
    const { user_id, permission_level, expires_at } = req.body;

    if (!user_id || !permission_level) {
      return res.status(400).json({
        success: false,
        error: "user_id and permission_level are required.",
      });
    }

    const validLevels = ["view", "comment", "edit", "admin"];
    if (!validLevels.includes(permission_level)) {
      return res.status(400).json({
        success: false,
        error: `permission_level must be one of: ${validLevels.join(", ")}`,
      });
    }

    const isOwnerOrAdmin = await ensureDocumentOwnerOrAdmin(documentId, req.user.id, req.user.role === "admin");
    if (!isOwnerOrAdmin) {
      return res.status(403).json({ success: false, error: "No permission to grant access." });
    }

    if (user_id === "ALL_STUDENTS") {
      if (req.user.role !== "advisor") {
        return res.status(403).json({ success: false, error: "Only advisors can share with all students." });
      }

      console.log("🔐 [Access] Granting access to ALL active students for advisor", req.user.id);

      const studentIds = await notificationClient.getAdvisorStudentIds(req.user.id);

      if (studentIds.length === 0) {
        return res.status(400).json({ success: false, error: "No active students found for this advisor." });
      }

      // Create access records for all students
      const accessRecords = studentIds.map(studentId => ({
        document_id: documentId,
        user_id: studentId,
        permission_level,
        expires_at: expires_at || null,
        granted_by: req.user!.id,
        granted_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from("document_access_control")
        .insert(accessRecords)
        .select();

      if (error) {
        console.error("❌ [Access] Grant multiple error", error);
        throw error;
      }

      await auditService.logAction({
        documentId,
        userId: req.user.id,
        action: "access_granted_to_all_students",
        metadata: { student_count: studentIds.length, level: permission_level },
      });

      // Notify all students in real time
      try {
        const [{ data: docInfo }, sharerInfo] = await Promise.all([
          supabase.from("documents").select("title").eq("id", documentId).maybeSingle(),
          notificationClient.getUserDisplayNameAndRole(req.user.id),
        ]);
        const docTitle = docInfo?.title || "a document";

        await notificationClient.sendBulkNotifications(
          studentIds.map((studentId) => ({
            user_id: studentId,
            type: "document_shared",
            title: "Document Shared With You",
            message: `${sharerInfo.name} shared "${docTitle}" with you (${permission_level} access).`,
            action_url: `/dashboard/student/documents/${documentId}`,
            reference_id: documentId,
            reference_type: "document",
            metadata: { document_id: documentId, permission_level },
          }))
        );
      } catch (notifErr) {
        console.warn("⚠️ [Access] Failed to notify students about shared document:", notifErr);
      }

      console.log(`✅ [Access] Access granted to ${studentIds.length} students`);
      return res.status(201).json({ success: true, data });
    }

    console.log("🔐 [Access] Granting access", {
      documentId: documentId.substring(0, 8),
      targetUser: user_id.substring(0, 8),
      level: permission_level,
    });

    const { data, error } = await supabase
      .from("document_access_control")
      .insert({
        document_id: documentId,
        user_id,
        permission_level,
        expires_at: expires_at || null,
        granted_by: req.user.id,
        granted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("❌ [Access] Grant error", error);
      throw error;
    }

    await auditService.logAction({
      documentId,
      userId: req.user.id,
      action: `access_granted_to_${user_id.substring(0, 8)}`,
      metadata: { target_user: user_id, level: permission_level },
    });

    if (user_id !== req.user.id) {
      try {
        const [{ data: docInfo }, sharerInfo, targetInfo] = await Promise.all([
          supabase.from("documents").select("title").eq("id", documentId).maybeSingle(),
          notificationClient.getUserDisplayNameAndRole(req.user.id),
          notificationClient.getUserDisplayNameAndRole(user_id),
        ]);
        const docTitle = docInfo?.title || "a document";

        await notificationClient.sendNotification({
          user_id,
          type: "document_shared",
          title: "Document Shared With You",
          message: `${sharerInfo.name} shared "${docTitle}" with you (${permission_level} access).`,
          action_url: `/dashboard/${targetInfo.role || "student"}/documents/${documentId}`,
          reference_id: documentId,
          reference_type: "document",
          metadata: { document_id: documentId, permission_level },
        });
      } catch (notifErr) {
        console.warn("⚠️ [Access] Failed to notify target user about shared document:", notifErr);
      }
    }

    console.log("✅ [Access] Access granted");

    return res.status(201).json({ success: true, data });
  } catch (error) {
    console.error("❌ [Access Controller] Grant error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function revokeAccess(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { accessId } = req.params;

    const { data: access, error: accessError } = await supabase
      .from("document_access_control")
      .select("document_id, user_id")
      .eq("id", accessId)
      .single();

    if (accessError || !access) {
      return res.status(404).json({ success: false, error: "Access record not found." });
    }

    const isOwnerOrAdmin = await ensureDocumentOwnerOrAdmin(
      access.document_id,
      req.user.id,
      req.user.role === "admin"
    );
    if (!isOwnerOrAdmin) {
      return res.status(403).json({ success: false, error: "No permission to revoke access." });
    }

    console.log("🔓 [Access] Revoking access", {
      accessId: accessId.substring(0, 8),
      targetUser: access.user_id.substring(0, 8),
    });

    const { error } = await supabase
      .from("document_access_control")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", accessId);

    if (error) {
      console.error("❌ [Access] Revoke error", error);
      throw error;
    }

    await auditService.logAction({
      documentId: access.document_id,
      userId: req.user.id,
      action: `access_revoked_from_${access.user_id.substring(0, 8)}`,
      metadata: { target_user: access.user_id },
    });

    console.log("✅ [Access] Access revoked");

    return res.json({ success: true, message: "Access revoked." });
  } catch (error) {
    console.error("❌ [Access Controller] Revoke error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function listDocumentAccess(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { documentId } = req.params;

    const isOwnerOrAdmin = await ensureDocumentOwnerOrAdmin(documentId, req.user.id, req.user.role === "admin");
    if (!isOwnerOrAdmin) {
      return res.status(403).json({ success: false, error: "No permission to view access." });
    }

    const { data, error } = await supabase
      .from("document_access_control")
      .select("*, user:users!user_id(id, first_name, last_name, email), granted_by_user:users!granted_by(id, first_name, last_name)")
      .eq("document_id", documentId)
      .is("revoked_at", null)
      .order("granted_at", { ascending: false });

    if (error) {
      console.error("❌ [Access] List error", error);
      throw error;
    }

    return res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error("❌ [Access Controller] List error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function getDocumentAudit(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { documentId } = req.params;
    const limit = parseInt((req.query.limit as string) || "100", 10);

    // Only owner or admin can view audit
    const isOwnerOrAdmin = await ensureDocumentOwnerOrAdmin(documentId, req.user.id, req.user.role === "admin");
    if (!isOwnerOrAdmin) {
      return res.status(403).json({ success: false, error: "No permission to view audit." });
    }

    const audit = await auditService.getDocumentAudit(documentId, limit);

    return res.json({ success: true, data: audit });
  } catch (error) {
    console.error("❌ [Access Controller] Get audit error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function getAuditStats(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { documentId } = req.params;

    const isOwnerOrAdmin = await ensureDocumentOwnerOrAdmin(documentId, req.user.id, req.user.role === "admin");
    if (!isOwnerOrAdmin) {
      return res.status(403).json({ success: false, error: "No permission to view stats." });
    }

    const stats = await auditService.getAuditStats(documentId);

    return res.json({ success: true, data: stats });
  } catch (error) {
    console.error("❌ [Access Controller] Get stats error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}
