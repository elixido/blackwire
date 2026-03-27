import fs from 'node:fs';
import bcrypt from 'bcryptjs';
import { Pool, type PoolClient, type QueryResultRow } from 'pg';
import { config } from '../config';
import { hashToken } from '../lib/auth';
import { getStorageObjectUrl } from '../lib/supabase';
import { seedState } from '../../../src/data/seed';
import type { Application, Job, MailMessage, Runner, StoredState, User } from '../../../src/types';

interface CountRow {
  count: string | number;
}

export interface UserRow {
  id: string;
  email: string;
  display_name: string;
  password_hash: string;
  handles_discord: string;
  handles_instagram: string;
  handles_other: string;
  notes: string;
  created_at: string;
  verified: boolean;
  verification_code: string | null;
  verification_sent_at: string | null;
  welcome_sent_at: string | null;
  timezone: string;
  role: string;
  is_hidden: boolean;
  is_suspended: boolean;
}

export interface RunnerRow {
  id: string;
  owner_id: string;
  street_name: string;
  real_name: string;
  age: string;
  metatype: string;
  archetype: string;
  specialties_json: string;
  risk_level: Runner['riskLevel'];
  summary: string;
  avatar_path: string;
  created_at: string;
  updated_at: string;
  is_hidden: boolean;
}

export interface JobRow {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  payout: number;
  threat_level: Job['threatLevel'];
  scheduled_at: string;
  scheduled_timezone: string;
  site: string;
  player_slots: number;
  notes: string;
  requirements_json: string;
  status: Job['status'];
  created_at: string;
  updated_at: string;
  is_hidden: boolean;
}

export interface ApplicationRow {
  id: string;
  job_id: string;
  runner_id: string;
  applicant_id: string;
  status: Application['status'];
  created_at: string;
  updated_at: string;
}

export interface SessionUserRow extends UserRow {
  session_id: string;
  expires_at: string;
}

interface MailRow {
  id: string;
  user_id: string;
  email: string;
  type: MailMessage['type'];
  subject: string;
  body: string;
  code: string | null;
  sent_at: string;
}

function ensureDirectories() {
  fs.mkdirSync(config.dataDir, { recursive: true });
  fs.mkdirSync(config.mailboxDir, { recursive: true });
  fs.mkdirSync(config.logsDir, { recursive: true });
}

ensureDirectories();

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : false
});

async function queryOne<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  const result = await pool.query<T>(text, values);
  return result.rows[0];
}

async function queryAll<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  const result = await pool.query<T>(text, values);
  return result.rows;
}

async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function parseStringArray(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : [];
  } catch {
    return [];
  }
}

function toClientUser(row: UserRow, currentUserId: string | null): User {
  return {
    id: row.id,
    email: row.id === currentUserId ? row.email : null,
    displayName: row.display_name,
    handles: {
      discord: row.handles_discord,
      instagram: row.handles_instagram,
      other: row.handles_other
    },
    notes: row.notes,
    createdAt: row.created_at,
    verified: Boolean(row.verified)
  };
}

async function toAvatarUrl(value: string) {
  if (!value) {
    return '';
  }

  if (value.startsWith('data:image/') || /^https?:\/\//i.test(value)) {
    return value;
  }

  return getStorageObjectUrl(value);
}

async function toClientRunner(row: RunnerRow): Promise<Runner> {
  return {
    id: row.id,
    ownerId: row.owner_id,
    streetName: row.street_name,
    realName: row.real_name,
    age: row.age,
    metatype: row.metatype,
    archetype: row.archetype,
    specialties: parseStringArray(row.specialties_json),
    riskLevel: row.risk_level,
    summary: row.summary,
    avatar: await toAvatarUrl(row.avatar_path)
  };
}

function toClientApplication(row: ApplicationRow): Application {
  return {
    id: row.id,
    jobId: row.job_id,
    runnerId: row.runner_id,
    applicantId: row.applicant_id,
    status: row.status,
    createdAt: row.created_at
  };
}

function toClientJob(row: JobRow, applications: Application[]): Job {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description,
    payout: Number(row.payout),
    threatLevel: row.threat_level,
    scheduledAt: row.scheduled_at,
    scheduledTimeZone: row.scheduled_timezone,
    site: row.site,
    playerSlots: Number(row.player_slots),
    notes: row.notes,
    requirements: parseStringArray(row.requirements_json),
    status: row.status,
    applications
  };
}

export async function getUserById(userId: string) {
  return (
    await queryOne<UserRow>('SELECT * FROM users WHERE id = $1 LIMIT 1', [userId])
  ) as UserRow | undefined;
}

export async function getUserByEmail(email: string) {
  return (
    await queryOne<UserRow>('SELECT * FROM users WHERE lower(email) = lower($1) LIMIT 1', [email])
  ) as UserRow | undefined;
}

export async function getUserByIdentifier(identifier: string) {
  return (
    await queryOne<UserRow>(
      `
        SELECT *
        FROM users
        WHERE lower(email) = lower($1)
          OR lower(display_name) = lower($1)
        LIMIT 1
      `,
      [identifier]
    )
  ) as UserRow | undefined;
}

export async function getRunnerById(runnerId: string) {
  return (
    await queryOne<RunnerRow>('SELECT * FROM runners WHERE id = $1 LIMIT 1', [runnerId])
  ) as RunnerRow | undefined;
}

export async function getJobById(jobId: string) {
  return (await queryOne<JobRow>('SELECT * FROM jobs WHERE id = $1 LIMIT 1', [jobId])) as
    | JobRow
    | undefined;
}

export async function getApplicationById(applicationId: string) {
  return (
    await queryOne<ApplicationRow>('SELECT * FROM applications WHERE id = $1 LIMIT 1', [applicationId])
  ) as ApplicationRow | undefined;
}

export async function listMailMessagesForEmail(email: string) {
  return (await queryAll<MailRow>(
    `
      SELECT *
      FROM mail_messages
      WHERE lower(email) = lower($1)
      ORDER BY sent_at DESC
      LIMIT 10
    `,
    [email]
  )) as MailRow[];
}

export async function resolveSessionUser(rawToken: string | null) {
  if (!rawToken) {
    return null;
  }

  return (
    await queryOne<SessionUserRow>(
      `
        SELECT
          s.id AS session_id,
          s.expires_at,
          u.*
        FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = $1
          AND s.expires_at > $2
        LIMIT 1
      `,
      [hashToken(rawToken), new Date().toISOString()]
    )
  ) as SessionUserRow | null;
}

export async function buildStateForUser(currentUserId: string | null): Promise<StoredState> {
  if (!currentUserId) {
    return {
      users: [],
      runners: [],
      jobs: [],
      mailbox: [],
      currentUserId: null
    };
  }

  const [userRows, runnerRows, jobRows, applicationRows] = await Promise.all([
    queryAll<UserRow>(
      `
        SELECT *
        FROM users
        WHERE is_hidden = false
          AND is_suspended = false
        ORDER BY created_at DESC
      `
    ),
    queryAll<RunnerRow>(
      `
        SELECT r.*
        FROM runners r
        JOIN users u ON u.id = r.owner_id
        WHERE r.is_hidden = false
          AND u.is_hidden = false
          AND u.is_suspended = false
        ORDER BY r.created_at DESC
      `
    ),
    queryAll<JobRow>(
      `
        SELECT j.*
        FROM jobs j
        JOIN users u ON u.id = j.owner_id
        WHERE j.is_hidden = false
          AND u.is_hidden = false
          AND u.is_suspended = false
        ORDER BY j.scheduled_at ASC
      `
    ),
    queryAll<ApplicationRow>(
      `
        SELECT a.*
        FROM applications a
        JOIN jobs j ON j.id = a.job_id
        JOIN users u ON u.id = j.owner_id
        WHERE j.is_hidden = false
          AND u.is_hidden = false
          AND u.is_suspended = false
        ORDER BY a.created_at ASC
      `
    )
  ]);

  const applicationsByJob = new Map<string, Application[]>();
  for (const row of applicationRows) {
    const entry = applicationsByJob.get(row.job_id) ?? [];
    entry.push(toClientApplication(row));
    applicationsByJob.set(row.job_id, entry);
  }

  return {
    users: userRows.map((row) => toClientUser(row, currentUserId)),
    runners: await Promise.all(runnerRows.map(toClientRunner)),
    jobs: jobRows.map((row) => toClientJob(row, applicationsByJob.get(row.id) ?? [])),
    mailbox: [],
    currentUserId
  };
}

export async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      handles_discord TEXT NOT NULL DEFAULT '',
      handles_instagram TEXT NOT NULL DEFAULT '',
      handles_other TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL,
      verified BOOLEAN NOT NULL DEFAULT false,
      verification_code TEXT,
      verification_sent_at TIMESTAMPTZ,
      welcome_sent_at TIMESTAMPTZ,
      timezone TEXT NOT NULL DEFAULT 'Europe/Berlin',
      role TEXT NOT NULL DEFAULT 'user',
      is_hidden BOOLEAN NOT NULL DEFAULT false,
      is_suspended BOOLEAN NOT NULL DEFAULT false
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      user_agent TEXT NOT NULL DEFAULT '',
      ip_address TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS runners (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      street_name TEXT NOT NULL,
      real_name TEXT NOT NULL DEFAULT '',
      age TEXT NOT NULL DEFAULT '',
      metatype TEXT NOT NULL,
      archetype TEXT NOT NULL,
      specialties_json TEXT NOT NULL DEFAULT '[]',
      risk_level TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      avatar_path TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL,
      is_hidden BOOLEAN NOT NULL DEFAULT false
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      payout INTEGER NOT NULL DEFAULT 0,
      threat_level TEXT NOT NULL,
      scheduled_at TIMESTAMPTZ NOT NULL,
      scheduled_timezone TEXT NOT NULL DEFAULT 'Europe/Berlin',
      site TEXT NOT NULL,
      player_slots INTEGER NOT NULL DEFAULT 1,
      notes TEXT NOT NULL DEFAULT '',
      requirements_json TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'open',
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL,
      is_hidden BOOLEAN NOT NULL DEFAULT false
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      runner_id TEXT NOT NULL REFERENCES runners(id) ON DELETE CASCADE,
      applicant_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL,
      UNIQUE (job_id, runner_id),
      UNIQUE (job_id, applicant_id)
    );

    CREATE TABLE IF NOT EXISTS mail_messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      type TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      code TEXT,
      sent_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      link TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL,
      read_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      reporter_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'open',
      created_at TIMESTAMPTZ NOT NULL
    );
  `);

  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS handles_discord TEXT NOT NULL DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS handles_instagram TEXT NOT NULL DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS handles_other TEXT NOT NULL DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMPTZ;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS welcome_sent_at TIMESTAMPTZ;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Europe/Berlin';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false;

    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_agent TEXT NOT NULL DEFAULT '';
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ip_address TEXT NOT NULL DEFAULT '';

    ALTER TABLE runners ADD COLUMN IF NOT EXISTS real_name TEXT NOT NULL DEFAULT '';
    ALTER TABLE runners ADD COLUMN IF NOT EXISTS age TEXT NOT NULL DEFAULT '';
    ALTER TABLE runners ADD COLUMN IF NOT EXISTS summary TEXT NOT NULL DEFAULT '';
    ALTER TABLE runners ADD COLUMN IF NOT EXISTS avatar_path TEXT NOT NULL DEFAULT '';
    ALTER TABLE runners ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    ALTER TABLE runners ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;

    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS scheduled_timezone TEXT NOT NULL DEFAULT 'Europe/Berlin';
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT '';
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS requirements_json TEXT NOT NULL DEFAULT '[]';
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open';
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;

    ALTER TABLE applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      link TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL,
      read_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      reporter_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'open',
      created_at TIMESTAMPTZ NOT NULL
    );
  `);

  const countRow = (await queryOne<CountRow>('SELECT COUNT(*) AS count FROM users')) ?? { count: 0 };
  if (Number(countRow.count) > 0) {
    return;
  }

  await withTransaction(async (client) => {
    for (const user of seedState.users) {
      await client.query(
        `
          INSERT INTO users (
            id,
            email,
            display_name,
            password_hash,
            handles_discord,
            handles_instagram,
            handles_other,
            notes,
            created_at,
            verified,
            verification_code,
            verification_sent_at,
            welcome_sent_at,
            timezone,
            role,
            is_hidden,
            is_suspended
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
          )
        `,
        [
          user.id,
          user.email.toLowerCase(),
          user.displayName,
          bcrypt.hashSync(user.password, 10),
          user.handles.discord,
          user.handles.instagram,
          user.handles.other,
          user.notes,
          user.createdAt,
          user.verified,
          user.securityCode,
          user.securityCodeSentAt,
          user.welcomeSentAt,
          'Europe/Berlin',
          'user',
          false,
          false
        ]
      );
    }

    for (const runner of seedState.runners) {
      await client.query(
        `
          INSERT INTO runners (
            id,
            owner_id,
            street_name,
            real_name,
            age,
            metatype,
            archetype,
            specialties_json,
            risk_level,
            summary,
            avatar_path,
            created_at,
            updated_at,
            is_hidden
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
          )
        `,
        [
          runner.id,
          runner.ownerId,
          runner.streetName,
          runner.realName,
          runner.age,
          runner.metatype,
          runner.archetype,
          JSON.stringify(runner.specialties),
          runner.riskLevel,
          runner.summary,
          runner.avatar,
          new Date().toISOString(),
          new Date().toISOString(),
          false
        ]
      );
    }

    for (const job of seedState.jobs) {
      await client.query(
        `
          INSERT INTO jobs (
            id,
            owner_id,
            title,
            description,
            payout,
            threat_level,
            scheduled_at,
            scheduled_timezone,
            site,
            player_slots,
            notes,
            requirements_json,
            status,
            created_at,
            updated_at,
            is_hidden
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
          )
        `,
        [
          job.id,
          job.ownerId,
          job.title,
          job.description,
          job.payout,
          job.threatLevel,
          job.scheduledAt,
          'Europe/Berlin',
          job.site,
          job.playerSlots,
          job.notes,
          JSON.stringify(job.requirements),
          job.status,
          new Date().toISOString(),
          new Date().toISOString(),
          false
        ]
      );

      for (const application of job.applications) {
        await client.query(
          `
            INSERT INTO applications (
              id,
              job_id,
              runner_id,
              applicant_id,
              status,
              created_at,
              updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `,
          [
            application.id,
            application.jobId,
            application.runnerId,
            application.applicantId,
            application.status,
            application.createdAt,
            application.createdAt
          ]
        );
      }
    }
  });
}

export async function removeSessionByToken(rawToken: string | null) {
  if (!rawToken) {
    return;
  }

  await pool.query('DELETE FROM sessions WHERE token_hash = $1', [hashToken(rawToken)]);
}
