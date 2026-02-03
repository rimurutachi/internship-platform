"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const internship_service_1 = require("../services/internship.service");
// Load environment variables
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
/**
 * Main job function
 */
async function processReminders() {
    console.log(`[${new Date().toISOString()}] Starting reminder processor...`);
    try {
        const processedCount = await internship_service_1.InternshipsEnhancedService.processScheduledReminders();
        console.log(`[${new Date().toISOString()}] Reminder processor completed successfully.`);
        console.log(`[${new Date().toISOString()}] Processed ${processedCount} reminders.`);
        // Exit with success code
        process.exit(0);
    }
    catch (error) {
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
exports.default = processReminders;
//# sourceMappingURL=reminderProcessor.js.map