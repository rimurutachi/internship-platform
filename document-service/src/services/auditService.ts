import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

interface AuditLogEntry {
  documentId?: string;
  userId: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

class AuditService {
  async logAction(entry: AuditLogEntry) {
    const { documentId, userId, action, ipAddress, userAgent, metadata } = entry;

    try {
      console.log(`📝 [Audit] Logging action`, {
        documentId: documentId ? documentId.substring(0, 8) : "N/A",
        action,
        userId: userId ? userId.substring(0, 8) : "N/A",
      });

      const { error } = await supabase.from("document_audit_log").insert({
        document_id: documentId,
        user_id: userId,
        action,
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
        metadata: metadata || {},
        timestamp: new Date().toISOString(),
      });

      if (error) {
        console.error("❌ [Audit] Log error", error);
        throw error;
      }

      console.log(`✅ [Audit] Logged`, { action });
    } catch (error) {
      // Don't throw; audit failures shouldn't block operations
      console.error("⚠️ [Audit] Failed to log action (non-fatal)", error);
    }
  }

  async getDocumentAudit(documentId: string, limit: number = 100) {
    try {
      const { data, error } = await supabase
        .from("document_audit_log")
        .select("*, user:users!user_id(id, first_name, last_name, email)")
        .eq("document_id", documentId)
        .order("timestamp", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error("❌ [Audit] Get audit error", error);
      throw error;
    }
  }

  async getUserAudit(userId: string, limit: number = 100) {
    try {
      const { data, error } = await supabase
        .from("document_audit_log")
        .select("*")
        .eq("user_id", userId)
        .order("timestamp", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error("❌ [Audit] Get user audit error", error);
      throw error;
    }
  }

  async getAuditStats(documentId: string) {
    try {
      const { data, error, count } = await supabase
        .from("document_audit_log")
        .select("action", { count: "exact" })
        .eq("document_id", documentId);

      if (error) throw error;

      // Count by action
      const stats: { [key: string]: number } = {};
      (data || []).forEach((log: any) => {
        stats[log.action] = (stats[log.action] || 0) + 1;
      });

      return {
        total_actions: count || 0,
        actions_by_type: stats,
      };
    } catch (error) {
      console.error("❌ [Audit] Get stats error", error);
      throw error;
    }
  }
}

export const auditService = new AuditService();
export default auditService;
