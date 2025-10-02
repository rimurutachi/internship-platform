import dotenv from 'dotenv';

// Ensure environment variables are loaded exactly once on first import
dotenv.config();

const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY'
] as const;

type RequiredVar = typeof requiredVars[number];

function getEnv(name: RequiredVar): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

export const env = {
  SUPABASE_URL: getEnv('SUPABASE_URL'),
  SUPABASE_SERVICE_KEY: getEnv('SUPABASE_SERVICE_KEY'),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  PORT: parseInt(process.env.PORT || '6001', 10),
  WEBSOCKET_PORT: parseInt(process.env.WEBSOCKET_PORT || '6000', 10),
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
};

export type AppEnv = typeof env;


