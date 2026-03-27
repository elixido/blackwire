import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const serverRoot = path.join(projectRoot, 'server');

function readNumber(value: string | undefined, fallback: number) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: readNumber(process.env.PORT, 3000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:4173',
  betaMode: process.env.BETA_MODE !== 'false',
  sessionCookieName: process.env.SESSION_COOKIE_NAME ?? 'blackwire_session',
  sessionTtlDays: readNumber(process.env.SESSION_TTL_DAYS, 30),
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  databaseUrl: process.env.DATABASE_URL ?? '',
  databaseSsl: process.env.DATABASE_SSL !== 'false',
  jsonLimit: process.env.JSON_LIMIT ?? '8mb',
  allowedImageBytes: readNumber(process.env.ALLOWED_IMAGE_BYTES, 3_145_728),
  mailFrom: process.env.MAIL_FROM ?? 'relay@blackwire.local',
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY ?? '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET ?? 'runner-avatars',
  projectRoot,
  serverRoot,
  dataDir: path.join(serverRoot, 'data'),
  mailboxDir: path.join(serverRoot, 'data', 'mailbox'),
  logsDir: path.join(serverRoot, 'data', 'logs')
} as const;
