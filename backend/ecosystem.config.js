/**
 * PM2 Ecosystem Configuration
 * 
 * This file configures PM2 process management for the internship platform backend.
 * 
 * To use:
 * 1. Build the backend: npm run build
 * 2. Start all processes: pm2 start ecosystem.config.js
 * 3. Monitor: pm2 monit
 * 4. View logs: pm2 logs
 * 5. Save config: pm2 save
 * 6. Setup startup: pm2 startup
 * 
 * More info: https://pm2.keymetrics.io/docs/usage/application-declaration/
 */

// Load environment variables from .env file
require('dotenv').config();

module.exports = {
  apps: [
    {
      // Main Backend Server
      name: 'internship-backend',
      script: './dist/server.js',
      instances: 1,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: process.env.NODE_ENV || 'production',
        PORT: process.env.PORT || 5000,
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
        DATABASE_URL: process.env.DATABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        REDIS_URL: process.env.REDIS_URL,
        FRONTEND_URL: process.env.FRONTEND_URL
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      // Reminder Processor Background Job
      name: 'reminder-processor',
      script: './dist/jobs/reminderProcessor.js',
      cron_restart: '*/15 * * * *', // Run every 15 minutes
      autorestart: false, // Don't auto-restart, only run on cron schedule
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: process.env.NODE_ENV || 'production',
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
        DATABASE_URL: process.env.DATABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        REDIS_URL: process.env.REDIS_URL
      },
      error_file: './logs/reminder-processor-error.log',
      out_file: './logs/reminder-processor-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
