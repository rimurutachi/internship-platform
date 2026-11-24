import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface DocumentNotificationDTO {
  user_id: string;
  type: string;
  title: string;
  message: string;
  action_url?: string;
  reference_id?: string;
  reference_type?: string;
  metadata?: Record<string, any>;
}

function buildFallbackRow(dto: DocumentNotificationDTO) {
  const row: Record<string, any> = {
    user_id: dto.user_id,
    type: dto.type,
    title: dto.title,
    message: dto.message,
    action_url: dto.action_url || null,
    reference_type: dto.reference_type || null,
    metadata: dto.metadata || {},
    is_read: false,
  };

  if (dto.reference_id && UUID_REGEX.test(dto.reference_id)) {
    row.reference_id = dto.reference_id;
  }

  return row;
}

class DocumentNotificationClient {
  /**
   * Sends a single notification via backend internal API for real-time Socket.io delivery,
   * falling back to direct Supabase insert if backend is unreachable.
   */
  async sendNotification(dto: DocumentNotificationDTO): Promise<void> {
    if (!dto?.user_id) return;
    await this.sendBulkNotifications([dto]);
  }

  /**
   * Sends bulk notifications via backend internal API for real-time Socket.io delivery,
   * falling back to direct Supabase insert if backend is unreachable.
   */
  async sendBulkNotifications(dtos: DocumentNotificationDTO[]): Promise<void> {
    const valid = (dtos || []).filter(
      (n) => n && n.user_id && n.type && n.title && n.message
    );
    if (valid.length === 0) return;

    try {
      await axios.post(
        `${env.BACKEND_URL}/api/communications/notifications/internal`,
        { notifications: valid },
        {
          headers: {
            "Content-Type": "application/json",
            "x-internal-service-key": env.INTERNAL_SERVICE_KEY,
          },
          timeout: 3000,
        }
      );
      return;
    } catch (err: any) {
      console.warn(
        "⚠️ [NotificationClient] Backend internal push failed, falling back to Supabase insert:",
        err?.message || err
      );
    }

    try {
      const rows = valid.map(buildFallbackRow);
      const { error } = await supabase.from("notifications").insert(rows);
      if (error) {
        console.error(
          "❌ [NotificationClient] Fallback Supabase insert failed:",
          error.message
        );
      }
    } catch (fallbackErr: any) {
      console.error(
        "❌ [NotificationClient] Fallback error:",
        fallbackErr?.message || fallbackErr
      );
    }
  }

  /**
   * Returns all active/pending student IDs assigned to an advisor
   * (both via internships table and pre-assigned profile_data.assigned_advisor_id).
   */
  async getAdvisorStudentIds(advisorId: string): Promise<string[]> {
    try {
      const [{ data: internships }, { data: preAssignedStudents }] =
        await Promise.all([
          supabase
            .from("internships")
            .select("student_id")
            .eq("advisor_id", advisorId)
            .in("status", ["active", "pending"]),
          supabase
            .from("users")
            .select("id")
            .eq("role", "student")
            .eq("status", "active")
            .filter("profile_data->>assigned_advisor_id", "eq", advisorId),
        ]);

      const ids = new Set<string>();
      (internships || []).forEach((i: any) => {
        if (i?.student_id) ids.add(i.student_id);
      });
      (preAssignedStudents || []).forEach((s: any) => {
        if (s?.id) ids.add(s.id);
      });

      return Array.from(ids);
    } catch (err: any) {
      console.error(
        "⚠️ [NotificationClient] getAdvisorStudentIds failed:",
        err?.message || err
      );
      return [];
    }
  }

  /**
   * Resolves the assigned advisor ID for a student (checks active/pending internship,
   * then falls back to profile_data.assigned_advisor_id).
   */
  async getStudentAdvisorId(studentId: string): Promise<string | null> {
    try {
      const { data: internship } = await supabase
        .from("internships")
        .select("advisor_id")
        .eq("student_id", studentId)
        .in("status", ["active", "pending"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (internship?.advisor_id) {
        return internship.advisor_id;
      }

      const { data: student } = await supabase
        .from("users")
        .select("profile_data")
        .eq("id", studentId)
        .maybeSingle();

      return student?.profile_data?.assigned_advisor_id || null;
    } catch (err: any) {
      console.error(
        "⚠️ [NotificationClient] getStudentAdvisorId failed:",
        err?.message || err
      );
      return null;
    }
  }

  /**
   * Fetches user display name and role.
   */
  async getUserDisplayNameAndRole(
    userId: string
  ): Promise<{ name: string; role: string }> {
    try {
      const { data } = await supabase
        .from("users")
        .select("first_name, last_name, role")
        .eq("id", userId)
        .maybeSingle();

      const fullName = data
        ? `${data.first_name || ""} ${data.last_name || ""}`.trim()
        : "";
      return {
        name: fullName || "A user",
        role: data?.role || "student",
      };
    } catch {
      return { name: "A user", role: "student" };
    }
  }
}

export const notificationClient = new DocumentNotificationClient();
export default notificationClient;

