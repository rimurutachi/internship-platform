/**
 * Internship Automation Job
 * 
 * Handles automated status transitions for internships:
 * - Marks internships as 'completed' when end date is reached
 * - Updates student status to 'pending_graduation' when internship completes with approved evaluation
 * - Sends notifications for upcoming end dates and missing evaluations
 * 
 * Run via: npx ts-node src/jobs/internshipAutomation.ts
 * Or schedule via cron: 0 1 * * * (daily at 1 AM)
 */

import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

interface AutomationStats {
  internshipsCompleted: number;
  studentsPendingGraduation: number;
  notificationsSent: number;
  errors: string[];
}

/**
 * Process internship automations
 */
async function processInternshipAutomation(): Promise<AutomationStats> {
  const stats: AutomationStats = {
    internshipsCompleted: 0,
    studentsPendingGraduation: 0,
    notificationsSent: 0,
    errors: [],
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString().split('T')[0];

  console.log(`[${new Date().toISOString()}] Processing internship automations for date: ${todayISO}`);

  try {
    // 1. Find active internships that have ended (end_date <= today)
    const { data: endedInternships, error: fetchError } = await supabase
      .from('internships')
      .select(`
        id,
        student_id,
        advisor_id,
        supervisor_id,
        end_date,
        status,
        student:users!student_id(id, first_name, last_name, email, status)
      `)
      .eq('status', 'active')
      .lte('end_date', todayISO);

    if (fetchError) {
      stats.errors.push(`Failed to fetch ended internships: ${fetchError.message}`);
      console.error('Fetch error:', fetchError);
      return stats;
    }

    console.log(`Found ${endedInternships?.length || 0} internships that have ended`);

    // Process each ended internship
    for (const internship of endedInternships || []) {
      try {
        // Update internship status to 'completed'
        const { error: updateError } = await supabase
          .from('internships')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', internship.id);

        if (updateError) {
          stats.errors.push(`Failed to complete internship ${internship.id}: ${updateError.message}`);
          continue;
        }

        stats.internshipsCompleted++;
        console.log(`✅ Internship ${internship.id} marked as completed`);

        // Check if student has approved final evaluation
        const { data: approvedEval } = await supabase
          .from('evaluations')
          .select('id')
          .eq('internship_id', internship.id)
          .eq('status', 'approved')
          .eq('evaluation_type', 'final')
          .limit(1)
          .single();

        // If evaluation approved, update student to pending_graduation
        const student = Array.isArray(internship.student) ? internship.student[0] : internship.student;
        if (approvedEval && student?.status === 'active') {
          const { error: studentUpdateError } = await supabase
            .from('users')
            .update({
              status: 'pending_graduation',
              updated_at: new Date().toISOString(),
            })
            .eq('id', internship.student_id);

          if (!studentUpdateError) {
            stats.studentsPendingGraduation++;
            console.log(`✅ Student ${internship.student_id} marked as pending_graduation`);

            // Notify student
            await supabase.from('notifications').insert({
              user_id: internship.student_id,
              type: 'internship_completed',
              title: 'Internship Completed!',
              message: 'Congratulations! Your internship has been completed. Your status has been updated to pending graduation.',
              data: { internship_id: internship.id },
            });
            stats.notificationsSent++;
          }
        } else if (!approvedEval) {
          // No approved evaluation - notify advisor
          await supabase.from('notifications').insert({
            user_id: internship.advisor_id,
            type: 'evaluation_required',
            title: 'Evaluation Required',
            message: `Internship for ${student?.first_name} ${student?.last_name} has ended but final evaluation is not yet approved.`,
            data: { 
              internship_id: internship.id,
              student_id: internship.student_id,
            },
          });
          stats.notificationsSent++;
          console.log(`⚠️ Notified advisor about missing evaluation for internship ${internship.id}`);
        }

        // Log activity
        await supabase.from('activity_logs').insert({
          user_id: internship.student_id,
          action: 'internship_auto_completed',
          entity_type: 'internship',
          entity_id: internship.id,
          details: {
            automation: true,
            end_date: internship.end_date,
            evaluation_approved: !!approvedEval,
          },
        });

      } catch (err: any) {
        stats.errors.push(`Error processing internship ${internship.id}: ${err.message}`);
      }
    }

    // 2. Send reminders for internships ending in 7 days
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    const sevenDaysISO = sevenDaysLater.toISOString().split('T')[0];

    const { data: upcomingInternships } = await supabase
      .from('internships')
      .select(`
        id,
        student_id,
        advisor_id,
        supervisor_id,
        end_date,
        student:users!student_id(first_name, last_name)
      `)
      .eq('status', 'active')
      .eq('end_date', sevenDaysISO);

    for (const internship of upcomingInternships || []) {
      const student = Array.isArray(internship.student) ? internship.student[0] : internship.student;
      
      // Check if reminder already sent today
      const { data: existingReminder } = await supabase
        .from('internship_reminders')
        .select('id')
        .eq('internship_id', internship.id)
        .eq('reminder_type', 'approaching_end_date')
        .gte('created_at', todayISO)
        .limit(1)
        .single();

      if (!existingReminder) {
        // Send reminder to supervisor about upcoming evaluation
        await supabase.from('notifications').insert({
          user_id: internship.supervisor_id,
          type: 'evaluation_reminder',
          title: 'Final Evaluation Due Soon',
          message: `Internship for ${student?.first_name} ${student?.last_name} ends in 7 days. Please prepare the final evaluation.`,
          data: { internship_id: internship.id },
        });

        // Record reminder
        await supabase.from('internship_reminders').insert({
          internship_id: internship.id,
          reminder_type: 'approaching_end_date',
          scheduled_for: new Date().toISOString(),
          is_sent: true,
          sent_at: new Date().toISOString(),
        });

        stats.notificationsSent++;
        console.log(`📧 Sent 7-day reminder for internship ${internship.id}`);
      }
    }

  } catch (error: any) {
    stats.errors.push(`General automation error: ${error.message}`);
    console.error('Automation error:', error);
  }

  return stats;
}

/**
 * Main job function
 */
async function main(): Promise<void> {
  console.log(`[${new Date().toISOString()}] Starting internship automation job...`);

  try {
    const stats = await processInternshipAutomation();

    console.log(`[${new Date().toISOString()}] Internship automation completed.`);
    console.log(`  - Internships completed: ${stats.internshipsCompleted}`);
    console.log(`  - Students pending graduation: ${stats.studentsPendingGraduation}`);
    console.log(`  - Notifications sent: ${stats.notificationsSent}`);
    
    if (stats.errors.length > 0) {
      console.log(`  - Errors: ${stats.errors.length}`);
      stats.errors.forEach(err => console.error(`    ❌ ${err}`));
    }

    // Exit with success code
    process.exit(0);
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Internship automation failed:`, error.message);
    console.error(error.stack);

    // Exit with error code
    process.exit(1);
  }
}

// Run the job if executed directly
if (require.main === module) {
  main();
}

// Export for testing or scheduled execution
export { processInternshipAutomation };
export default main;
