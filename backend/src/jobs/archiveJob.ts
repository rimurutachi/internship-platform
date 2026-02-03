import cron from "node-cron";
import { archiveService } from "../services/archiveService";

/**
 * Archive Job - Runs hourly to check for users to archive
 * Schedule: Every hour at minute 0
 */
export const startArchiveJob = () => {
  // Run every hour (at minute 0)
  const job = cron.schedule("0 * * * *", async () => {
    console.log("⏰ [Archive Job] Starting hourly archive check...");
    
    try {
      await archiveService.runArchiveChecks();
      console.log("✅ [Archive Job] Completed successfully");
    } catch (error) {
      console.error("❌ [Archive Job] Error:", error);
    }
  });

  console.log("🚀 Archive job scheduled - runs every hour");
  return job;
};

/**
 * Run archive check immediately (for testing or manual trigger)
 */
export const runArchiveCheckNow = async () => {
  console.log("🔄 Manual archive check triggered...");
  try {
    await archiveService.runArchiveChecks();
    console.log("✅ Manual archive check completed");
  } catch (error) {
    console.error("❌ Manual archive check error:", error);
    throw error;
  }
};
