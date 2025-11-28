
import dotenv from 'dotenv';
import path from 'path';
import InternshipsEnhancedService from '../services/internshipsEnhancedService';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Main job function
 */
async function processReminders(): Promise<void> {
  console.log(`[${new Date().toISOString()}] Starting reminder processor...`);

  try {
    const processedCount = await InternshipsEnhancedService.processScheduledReminders();
    
    console.log(`[${new Date().toISOString()}] Reminder processor completed successfully.`);
    console.log(`[${new Date().toISOString()}] Processed ${processedCount} reminders.`);
    
    // Exit with success code
    process.exit(0);
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Reminder processor failed:`, error.message);
    console.error(error.stack);
    
    // Exit with error code
    process.exit(1);
  }
}

// Run the job if executed directly
if (require.main === module) {
  processReminders();
}

export default processReminders;
