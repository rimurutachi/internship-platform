/**
 * Notification Cleanup Job
 * 
 * Implements the hybrid approach for notification management:
 * - Keeps notifications for a reasonable period (configurable retention)
 * - Cleans up old notifications to prevent database bloat
 * - Maintains per-user notification limits
 * 
 * Run via: npx ts-node src/jobs/notificationCleanup.ts
 * Or schedule via cron: 0 2 * * * (daily at 2 AM)
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

// Configuration for notification retention (in days)
const RETENTION_CONFIG = {
  // Critical notifications (evaluation approved, internship completed)
  critical: 90,
  // Important notifications (reports submitted, evaluation submitted)
  important: 30,
  // Transient notifications (new messages, reminders)
  transient: 7,
  // Default for unclassified notifications
  default: 30,
};

// Maximum notifications to keep per user
const MAX_NOTIFICATIONS_PER_USER = 100;

// Notification type classifications
const NOTIFICATION_TYPES = {
  critical: [
    'evaluation_approved',
    'internship_completed',
    'internship_active',
    'final_grade_released',
  ],
  important: [
    'evaluation_submitted',
    'weekly_report_submitted',
    'weekly_report_approved',
    'weekly_report_rejected',
    'internship_cancelled',
  ],
  transient: [
    'message_received',
    'internship_reminder',
    'approaching_end_date',
    'pending_documents',
    'pending_weekly_report',
    'evaluation_due',
    'system',
  ],
};

interface CleanupStats {
  oldNotificationsDeleted: number;
  excessNotificationsDeleted: number;
  errors: string[];
}

/**
 * Get retention period for a notification type
 */
function getRetentionDays(notificationType: string): number {
  if (NOTIFICATION_TYPES.critical.includes(notificationType)) {
    return RETENTION_CONFIG.critical;
  }
  if (NOTIFICATION_TYPES.important.includes(notificationType)) {
    return RETENTION_CONFIG.important;
  }
  if (NOTIFICATION_TYPES.transient.includes(notificationType)) {
    return RETENTION_CONFIG.transient;
  }
  return RETENTION_CONFIG.default;
}

/**
 * Delete old notifications based on retention policy
 */
async function deleteOldNotifications(): Promise<number> {
  let totalDeleted = 0;

  // Process each notification category
  for (const [category, types] of Object.entries(NOTIFICATION_TYPES)) {
    const retentionDays = RETENTION_CONFIG[category as keyof typeof RETENTION_CONFIG];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    for (const type of types) {
      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .eq('type', type)
        .lt('created_at', cutoffDate.toISOString())
        .select('id');

      if (error) {
        console.error(`Failed to delete ${type} notifications:`, error.message);
        continue;
      }

      const deletedCount = data?.length || 0;
      if (deletedCount > 0) {
        console.log(`🗑️ Deleted ${deletedCount} old "${type}" notifications (>${retentionDays} days)`);
        totalDeleted += deletedCount;
      }
    }
  }

  // Also delete any very old notifications (>90 days) regardless of type
  const veryOldDate = new Date();
  veryOldDate.setDate(veryOldDate.getDate() - 90);

  const { data: veryOldData, error: veryOldError } = await supabase
    .from('notifications')
    .delete()
    .lt('created_at', veryOldDate.toISOString())
    .select('id');

  if (!veryOldError && veryOldData?.length) {
    console.log(`🗑️ Deleted ${veryOldData.length} very old notifications (>90 days)`);
    totalDeleted += veryOldData.length;
  }

  return totalDeleted;
}

/**
 * Enforce per-user notification limits
 */
async function enforceUserLimits(): Promise<number> {
  let totalDeleted = 0;

  // Get users with more than MAX notifications
  const { data: userCounts, error: countError } = await supabase
    .from('notifications')
    .select('user_id')
    .limit(10000); // Fetch all to count manually

  if (countError) {
    console.error('Failed to fetch notification counts:', countError.message);
    return 0;
  }

  // Count notifications per user
  const counts: { [userId: string]: number } = {};
  for (const row of userCounts || []) {
    counts[row.user_id] = (counts[row.user_id] || 0) + 1;
  }

  // Process users over the limit
  for (const [userId, count] of Object.entries(counts)) {
    if (count > MAX_NOTIFICATIONS_PER_USER) {
      const excess = count - MAX_NOTIFICATIONS_PER_USER;

      // Delete oldest notifications for this user (keep is_read=false notifications if possible)
      const { data: toDelete, error: fetchError } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .order('is_read', { ascending: false }) // Delete read ones first
        .order('created_at', { ascending: true }) // Then oldest
        .limit(excess);

      if (fetchError) {
        console.error(`Failed to fetch excess notifications for user ${userId}:`, fetchError.message);
        continue;
      }

      if (toDelete && toDelete.length > 0) {
        const idsToDelete = toDelete.map(n => n.id);
        const { error: deleteError } = await supabase
          .from('notifications')
          .delete()
          .in('id', idsToDelete);

        if (!deleteError) {
          console.log(`🗑️ Deleted ${idsToDelete.length} excess notifications for user ${userId.substring(0, 8)}...`);
          totalDeleted += idsToDelete.length;
        }
      }
    }
  }

  return totalDeleted;
}

/**
 * Main cleanup job function
 */
async function processNotificationCleanup(): Promise<CleanupStats> {
  const stats: CleanupStats = {
    oldNotificationsDeleted: 0,
    excessNotificationsDeleted: 0,
    errors: [],
  };

  console.log(`[${new Date().toISOString()}] Starting notification cleanup job...`);
  console.log('Configuration:');
  console.log(`  - Critical notifications: ${RETENTION_CONFIG.critical} days`);
  console.log(`  - Important notifications: ${RETENTION_CONFIG.important} days`);
  console.log(`  - Transient notifications: ${RETENTION_CONFIG.transient} days`);
  console.log(`  - Max per user: ${MAX_NOTIFICATIONS_PER_USER}`);

  try {
    // Step 1: Delete old notifications based on retention policy
    console.log('\n📋 Step 1: Deleting old notifications...');
    stats.oldNotificationsDeleted = await deleteOldNotifications();
    console.log(`✅ Deleted ${stats.oldNotificationsDeleted} old notifications`);

    // Step 2: Enforce per-user limits
    console.log('\n📋 Step 2: Enforcing per-user limits...');
    stats.excessNotificationsDeleted = await enforceUserLimits();
    console.log(`✅ Deleted ${stats.excessNotificationsDeleted} excess notifications`);

    // Step 3: Log summary
    const totalDeleted = stats.oldNotificationsDeleted + stats.excessNotificationsDeleted;
    console.log(`\n✅ Notification cleanup completed successfully!`);
    console.log(`   Total notifications deleted: ${totalDeleted}`);

  } catch (error: any) {
    stats.errors.push(error.message);
    console.error(`❌ Notification cleanup failed:`, error.message);
  }

  return stats;
}

// Run the job if executed directly
if (require.main === module) {
  processNotificationCleanup()
    .then((stats) => {
      console.log('\nCleanup stats:', JSON.stringify(stats, null, 2));
      process.exit(stats.errors.length > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { processNotificationCleanup, RETENTION_CONFIG, MAX_NOTIFICATIONS_PER_USER };
