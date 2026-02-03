import { createClient } from "@supabase/supabase-js";
import { NotificationService } from "./notificationService";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const notificationService = new NotificationService();

interface ArchiveCandidate {
  id: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  created_at: string;
  evaluations_completed_at?: string;
  archive_warning_sent?: boolean;
}

export class ArchiveService {
  /**
   * Check and archive students (1 year from account creation)
   */
  async checkStudentsForArchive(): Promise<void> {
    console.log("🔍 Checking students for auto-archive...");

    try {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      // Get students created exactly 1 year ago (with 1 hour tolerance for hourly job)
      const { data: studentsToArchive, error: archiveError } = await supabase
        .from("users")
        .select("id, email, first_name, last_name, created_at")
        .eq("role", "student")
        .eq("is_archived", false)
        .lte("created_at", oneYearAgo.toISOString())
        .gte("created_at", new Date(oneYearAgo.getTime() - 3600000).toISOString()); // 1 hour tolerance

      if (archiveError) {
        console.error("Error fetching students to archive:", archiveError);
        return;
      }

      // Archive students
      for (const student of studentsToArchive || []) {
        await this.archiveUser(student.id, "student", "1 year account validity expired");
        console.log(`✅ Archived student: ${student.email}`);
      }

      // Send 7-day warnings to students approaching 1 year
      const warningDate = new Date();
      warningDate.setFullYear(warningDate.getFullYear() - 1);
      warningDate.setDate(warningDate.getDate() + 7);

      const { data: studentsForWarning, error: warningError } = await supabase
        .from("users")
        .select("id, email, first_name, last_name, created_at, profile_data")
        .eq("role", "student")
        .eq("is_archived", false)
        .lte("created_at", warningDate.toISOString())
        .gte("created_at", new Date(warningDate.getTime() - 3600000).toISOString());

      if (!warningError && studentsForWarning) {
        for (const student of studentsForWarning) {
          const hasWarning = student.profile_data?.archive_warning_sent;
          if (!hasWarning) {
            await this.sendArchiveWarning(student.id, "student", 7);
            
            // Mark warning as sent
            await supabase
              .from("users")
              .update({
                profile_data: {
                  ...student.profile_data,
                  archive_warning_sent: true,
                  archive_warning_sent_at: new Date().toISOString(),
                },
              })
              .eq("id", student.id);

            console.log(`⚠️ Sent archive warning to student: ${student.email}`);
          }
        }
      }

      console.log(`✅ Student archive check complete. Archived: ${studentsToArchive?.length || 0}`);
    } catch (error) {
      console.error("Error in checkStudentsForArchive:", error);
    }
  }

  /**
   * Check and archive advisors (1 year from account creation)
   */
  async checkAdvisorsForArchive(): Promise<void> {
    console.log("🔍 Checking advisors for auto-archive...");

    try {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      // Get advisors created exactly 1 year ago
      const { data: advisorsToArchive, error: archiveError } = await supabase
        .from("users")
        .select("id, email, first_name, last_name, created_at")
        .eq("role", "advisor")
        .eq("is_archived", false)
        .lte("created_at", oneYearAgo.toISOString())
        .gte("created_at", new Date(oneYearAgo.getTime() - 3600000).toISOString());

      if (archiveError) {
        console.error("Error fetching advisors to archive:", archiveError);
        return;
      }

      // Archive advisors
      for (const advisor of advisorsToArchive || []) {
        await this.archiveUser(advisor.id, "advisor", "1 year account validity expired");
        console.log(`✅ Archived advisor: ${advisor.email}`);
      }

      // Send 7-day warnings
      const warningDate = new Date();
      warningDate.setFullYear(warningDate.getFullYear() - 1);
      warningDate.setDate(warningDate.getDate() + 7);

      const { data: advisorsForWarning, error: warningError } = await supabase
        .from("users")
        .select("id, email, first_name, last_name, created_at, profile_data")
        .eq("role", "advisor")
        .eq("is_archived", false)
        .lte("created_at", warningDate.toISOString())
        .gte("created_at", new Date(warningDate.getTime() - 3600000).toISOString());

      if (!warningError && advisorsForWarning) {
        for (const advisor of advisorsForWarning) {
          const hasWarning = advisor.profile_data?.archive_warning_sent;
          if (!hasWarning) {
            await this.sendArchiveWarning(advisor.id, "advisor", 7);
            
            await supabase
              .from("users")
              .update({
                profile_data: {
                  ...advisor.profile_data,
                  archive_warning_sent: true,
                  archive_warning_sent_at: new Date().toISOString(),
                },
              })
              .eq("id", advisor.id);

            console.log(`⚠️ Sent archive warning to advisor: ${advisor.email}`);
          }
        }
      }

      console.log(`✅ Advisor archive check complete. Archived: ${advisorsToArchive?.length || 0}`);
    } catch (error) {
      console.error("Error in checkAdvisorsForArchive:", error);
    }
  }

  /**
   * Check and archive supervisors (1 week after completing all evaluations)
   */
  async checkSupervisorsForArchive(): Promise<void> {
    console.log("🔍 Checking supervisors for auto-archive...");

    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Get supervisors who completed evaluations 1 week ago
      const { data: supervisorsToArchive, error: archiveError } = await supabase
        .from("users")
        .select("id, email, first_name, last_name, evaluations_completed_at")
        .eq("role", "supervisor")
        .eq("is_archived", false)
        .not("evaluations_completed_at", "is", null)
        .lte("evaluations_completed_at", oneWeekAgo.toISOString())
        .gte("evaluations_completed_at", new Date(oneWeekAgo.getTime() - 3600000).toISOString());

      if (archiveError) {
        console.error("Error fetching supervisors to archive:", archiveError);
        return;
      }

      // Archive supervisors
      for (const supervisor of supervisorsToArchive || []) {
        await this.archiveUser(
          supervisor.id,
          "supervisor",
          "All student evaluations completed - 1 week grace period ended"
        );
        console.log(`✅ Archived supervisor: ${supervisor.email}`);
      }

      console.log(`✅ Supervisor archive check complete. Archived: ${supervisorsToArchive?.length || 0}`);
    } catch (error) {
      console.error("Error in checkSupervisorsForArchive:", error);
    }
  }

  /**
   * Archive a user and send notification
   */
  private async archiveUser(userId: string, role: string, reason: string): Promise<void> {
    try {
      // Archive the user
      const { error } = await supabase
        .from("users")
        .update({
          is_archived: true,
          archived_at: new Date().toISOString(),
          status: "inactive",
        })
        .eq("id", userId);

      if (error) {
        console.error(`Error archiving user ${userId}:`, error);
        return;
      }

      // Send notification
      await notificationService.createNotification({
        user_id: userId,
        type: "account_archived",
        title: "Account Archived",
        message: `Your ${role} account has been archived. ${reason}. Contact the administrator if you need to reactivate your account.`,
        action_url: "/dashboard",
        reference_type: "user",
      });

      console.log(`📧 Sent archive notification to user: ${userId}`);
    } catch (error) {
      console.error(`Error in archiveUser for ${userId}:`, error);
    }
  }

  /**
   * Send 7-day warning before archive
   */
  private async sendArchiveWarning(userId: string, role: string, daysRemaining: number): Promise<void> {
    try {
      await notificationService.createNotification({
        user_id: userId,
        type: "account_archive_warning",
        title: "Account Archive Warning",
        message: `Your ${role} account will be automatically archived in ${daysRemaining} days. Please complete any pending tasks or contact the administrator if you need an extension.`,
        action_url: "/dashboard",
        reference_type: "user",
      });
    } catch (error) {
      console.error(`Error sending archive warning to ${userId}:`, error);
    }
  }

  /**
   * Check if supervisor has completed all evaluations
   * Called after evaluation submission
   */
  async checkSupervisorEvaluationCompletion(supervisorId: string): Promise<void> {
    try {
      // Get all active internships assigned to this supervisor
      const { data: internships, error: internError } = await supabase
        .from("internships")
        .select("id")
        .eq("supervisor_id", supervisorId)
        .in("status", ["active", "completed"]);

      if (internError || !internships || internships.length === 0) {
        return;
      }

      const internshipIds = internships.map((i) => i.id);

      // Check if all internships have final evaluations
      const { data: evaluations, error: evalError } = await supabase
        .from("evaluations")
        .select("internship_id")
        .eq("supervisor_id", supervisorId)
        .eq("evaluation_type", "final")
        .in("status", ["submitted", "approved"])
        .in("internship_id", internshipIds);

      if (evalError) {
        console.error("Error checking evaluations:", evalError);
        return;
      }

      // If all internships have evaluations, mark completion
      if (evaluations && evaluations.length === internshipIds.length) {
        const { error: updateError } = await supabase
          .from("users")
          .update({
            evaluations_completed_at: new Date().toISOString(),
          })
          .eq("id", supervisorId);

        if (!updateError) {
          console.log(`✅ Marked evaluations complete for supervisor: ${supervisorId}`);
          
          // Send notification that countdown has started
          await notificationService.createNotification({
            user_id: supervisorId,
            type: "system",
            title: "All Evaluations Completed",
            message: "You have completed evaluations for all your assigned students. Your account will be archived in 1 week. Contact the administrator if you need an extension.",
            action_url: "/dashboard/supervisor",
            reference_type: "user",
          });
        }
      }
    } catch (error) {
      console.error("Error in checkSupervisorEvaluationCompletion:", error);
    }
  }

  /**
   * Run all archive checks
   */
  async runArchiveChecks(): Promise<void> {
    console.log("🤖 Running automated archive checks...");
    
    await this.checkStudentsForArchive();
    await this.checkAdvisorsForArchive();
    await this.checkSupervisorsForArchive();
    
    console.log("✅ Archive checks completed");
  }
}

// Export singleton
export const archiveService = new ArchiveService();
