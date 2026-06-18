"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Ensure environment variables are loaded exactly once on first import
dotenv_1.default.config();
const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY'
];
function getEnv(name) {
    const value = process.env[name];
    if (!value || value.trim().length === 0) {
        throw new Error(`${name} is required.`);
    }
    return value;
}
exports.env = {
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
