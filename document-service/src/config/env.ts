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
  PORT: parseInt(process.env.PORT || '6000', 10),
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  STORAGE_BUCKET_DOCUMENTS: process.env.STORAGE_BUCKET_DOCUMENTS || 'documents',
  STORAGE_SIGNED_URL_EXPIRES: parseInt(process.env.STORAGE_SIGNED_URL_EXPIRES || '3600', 10),
  BLOCKCHAIN_ENABLED: process.env.BLOCKCHAIN_ENABLED === 'true',
  BLOCKCHAIN_HASH_ALGORITHM: process.env.BLOCKCHAIN_HASH_ALGORITHM || 'sha256',
};

export type AppEnv = typeof env;


