import cron from "node-cron";
import axios from "axios";

/**
 * AI Service Keep-Alive Job
 * 
 * Purpose: Prevents Render free tier from spinning down AI service
 * Schedule: Every 10 minutes
 * 
 * Why: Render free instances auto-shutdown after 15 minutes of inactivity.
 * This job pings the AI service health check to keep it alive.
 * 
 * Note: Only runs in production environment
 */
export const startAIServiceKeepAlive = () => {
  const aiServiceUrl = process.env.AI_SERVICE_URL;
  
  // Only run in production to avoid unnecessary pings in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('⏭️ AI Service Keep-Alive: Skipped (not production)');
    return;
  }
  
  if (!aiServiceUrl) {
    console.warn('⚠️ AI Service Keep-Alive: AI_SERVICE_URL not configured');
    return;
  }

  // Run every 10 minutes (prevents 15-minute auto-shutdown)
  const job = cron.schedule("*/10 * * * *", async () => {
    try {
      const startTime = Date.now();
      const response = await axios.get(`${aiServiceUrl}/health`, {
        timeout: 5000, // 5-second timeout
        headers: {
          'User-Agent': 'Intern-Galing-Backend-KeepAlive/1.0'
        }
      });
      
      const duration = Date.now() - startTime;
      
      if (response.status === 200) {
        console.log(`💚 [AI Keep-Alive] Service healthy (${duration}ms) | Status: ${response.data.status}`);
      } else {
        console.warn(`⚠️ [AI Keep-Alive] Unexpected status: ${response.status}`);
      }
    } catch (error: any) {
      console.error(`❌ [AI Keep-Alive] Health check failed:`, {
        message: error.message,
        code: error.code,
        url: aiServiceUrl
      });
    }
  });

  console.log(`🚀 AI Service Keep-Alive scheduled - pings every 10 minutes`);
  console.log(`📍 Target: ${aiServiceUrl}/health`);
  
  // Run immediately on startup to verify configuration
  setTimeout(async () => {
    console.log('🔍 [AI Keep-Alive] Initial health check...');
    try {
      const response = await axios.get(`${aiServiceUrl}/health`, { timeout: 5000 });
      console.log(`✅ [AI Keep-Alive] Initial check SUCCESS | Service: ${response.data.service}`);
    } catch (error: any) {
      console.error(`❌ [AI Keep-Alive] Initial check FAILED: ${error.message}`);
    }
  }, 2000); // Wait 2 seconds after server startup
  
  return job;
};

