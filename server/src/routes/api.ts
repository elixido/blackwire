import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Router, type Request } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { config } from '../config';
import {
  buildStateForUser,
  getApplicationById,
  getJobById,
  getRunnerById,
  getUserByEmail,
  getUserByIdentifier,
  listMailMessagesForEmail,
  pool,
  removeSessionByToken,
  resolveSessionUser
} from '../db/database';
import {
  clearSessionCookie,
  createSessionToken,
  generateNumericCode,
  hashToken,
  readCookie,
  sessionExpiry,
  setSessionCookie
} from '../lib/auth';
import { asyncRoute, fail, ok } from '../lib/errors';
import { deleteManagedUpload, processAvatarInput } from '../services/images';
import {
  sendPasswordResetMail,
  sendSecurityCodeMail,
  sendWelcomeMail
} from '../services/mailer';
import type {
  ActionResult,
  ApplicationStatus,
  JobDraft,
  MailMessage,
  RegisterInput,
  ResetPasswordInput,
  RunnerDraft,
  SocialHandles
} from '../../../src/types';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    ok: false,
    code: 'RATE_LIMITED',
    message: 'Too many auth attempts. Slow the signal and try again.'
  } satisfies ActionResult
});

const writeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    ok: false,
    code: 'RATE_LIMITED',
    message: 'Too many write operations. Slow the signal and try again.'
  } satisfies ActionResult
});

const handlesSchema = z.object({
  discord: z.string().max(80).default(''),
  instagram: z.string().max(120).default(''),
  other: z.string().max(120).default('')
});

const registerSchema = z.object({
  email: z.string().email().max(160),
  displayName: z.string().min(1).max(40),
  password: z.string().min(6).max(120),
  notes: z.string().max(1000).default(''),
  handles: handlesSchema
}) satisfies z.ZodType<RegisterInput>;

const verifySchema = z.object({
  email: z.string().email().max(160),
  code: z.string().length(6)
});

const loginSchema = z.object({
  identifier: z.string().min(1).max(160),
  password: z.string().min(1).max(120)
});

const updateProfileSchema = z.object({
  notes: z.string().max(1000),
  handles: handlesSchema
});

const runnerDraftSchema = z.object({
  streetName: z.string().min(1).max(48),
  realName: z.string().max(48),
  age: z.string().max(16),
  metatype: z.string().min(1).max(32),
  archetype: z.string().min(1).max(48),
  specialties: z.array(z.string().min(1).max(32)).max(12),
  riskLevel: z.enum(['Initiate', 'Experienced', 'Professional', 'Legend']),
  summary: z.string().min(1).max(700),
  avatar: z.string().max(10_000_000)
}) satisfies z.ZodType<RunnerDraft>;

const jobDraftSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(5000),
  payout: z.number().int().min(0).max(1_000_000_000),
  threatLevel: z.enum(['Low', 'Moderate', 'High', 'Lethal']),
  scheduledAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid date.'),
  scheduledTimeZone: z.string().max(80).default('Europe/Berlin'),
  site: z.string().min(1).max(80),
  playerSlots: z.number().int().min(1).max(12),
  notes: z.string().max(2000),
  requirements: z.array(z.string().min(1).max(32)).max(12),
  status: z.enum(['open', 'closed'])
}) satisfies z.ZodType<JobDraft>;

const applicationSchema = z.object({
  runnerId: z.string().min(1).max(80)
});

const reviewSchema = z.object({
  status: z.enum(['accepted', 'rejected'])
});

const resetRequestSchema = z.object({
  email: z.string().email().max(160)
});

const resetPasswordSchema = z.object({
  email: z.string().email().max(160),
  code: z.string().length(6),
  password: z.string().min(6).max(120)
}) satisfies z.ZodType<ResetPasswordInput>;

const reportSchema = z.object({
  targetType: z.enum(['job', 'user']),
  targetId: z.string().min(1).max(80),
  reason: z.string().min(1).max(120),
  details: z.string().max(1000).default('')
});

async function getSessionUser(req: Request) {
  const token = readCookie(req, config.sessionCookieName);
  const user = await resolveSessionUser(token);
  if (!user) {
    return null;
  }

  if (user.is_hidden || user.is_suspended) {
    await removeSessionByToken(token);
    return null;
  }

  return { user, token };
}

function parseHandles(input: SocialHandles) {
  return {
    discord: input.discord.trim(),
    instagram: input.instagram.trim(),
    other: input.other.trim()
  };
}

async function acceptedSlots(jobId: string) {
  const result = await pool.query<{ count: string }>(
    `
      SELECT COUNT(*) AS count
      FROM applications
      WHERE job_id = $1
        AND status = 'accepted'
    `,
    [jobId]
  );

  return Number(result.rows[0]?.count ?? 0);
}

async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  link: string
) {
  await pool.query(
    `
      INSERT INTO notifications (
        id,
        user_id,
        type,
        title,
        body,
        link,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [
      `notification-${randomUUID().slice(0, 8)}`,
      userId,
      type,
      title,
      body,
      link,
      new Date().toISOString()
    ]
  );
}

router.get(
  '/bootstrap',
  asyncRoute(async (req, res) => {
    const session = await getSessionUser(req);
    return ok(res, 'BOOTSTRAP_READY', 'State loaded.', {
      state: await buildStateForUser(session?.user.id ?? null)
    });
  })
);

router.post(
  '/auth/register',
  authLimiter,
  asyncRoute(async (req, res) => {
    const input = registerSchema.parse(req.body);
    const email = input.email.trim().toLowerCase();
    const displayName = input.displayName.trim();

    if (await getUserByEmail(email)) {
      fail(409, 'EMAIL_ALREADY_IN_USE', 'This email address is already in use.');
    }

    if (await getUserByIdentifier(displayName)) {
      fail(409, 'DISPLAY_NAME_ALREADY_LOCKED', 'This display name is already locked.');
    }

    const now = new Date().toISOString();
    const userId = `user-${randomUUID().slice(0, 8)}`;
    const handles = parseHandles(input.handles);
    const securityCode = config.betaMode ? null : generateNumericCode();
    const verified = config.betaMode;
    const welcomeSentAt = config.betaMode ? now : null;

    await pool.query(
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
          timezone,
          role,
          is_hidden,
          is_suspended
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `,
      [
        userId,
        email,
        displayName,
        bcrypt.hashSync(input.password, 10),
        handles.discord,
        handles.instagram,
        handles.other,
        input.notes.trim(),
        now,
        verified,
        securityCode,
        securityCode ? now : null,
        'Europe/Berlin',
        'user',
        false,
        false
      ]
    );

    await pool.query(
      `
        UPDATE users
        SET welcome_sent_at = $1
        WHERE id = $2
      `,
      [welcomeSentAt, userId]
    );

    if (!config.betaMode && securityCode) {
      await sendSecurityCodeMail(userId, email, displayName, securityCode);
      return ok(res, 'SECURITY_CODE_SENT', 'A security code was sent to the relay.', {
        email
      });
    }

    const token = createSessionToken();
    await pool.query(
      `
        INSERT INTO sessions (
          id,
          user_id,
          token_hash,
          created_at,
          expires_at,
          user_agent,
          ip_address
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        `session-${randomUUID().slice(0, 8)}`,
        userId,
        hashToken(token),
        now,
        sessionExpiry(),
        req.headers['user-agent'] ?? '',
        req.ip ?? ''
      ]
    );
    setSessionCookie(res, token);

    return ok(res, 'BETA_ACCESS_GRANTED', 'Account created and unlocked for beta access.', {
      email,
      state: await buildStateForUser(userId)
    });
  })
);

router.post(
  '/auth/verify',
  authLimiter,
  asyncRoute(async (req, res) => {
    const input = verifySchema.parse(req.body);
    const email = input.email.trim().toLowerCase();
    const user = await getUserByEmail(email);

    if (!user) {
      fail(404, 'EMAIL_NOT_FOUND', 'No account was found for this email address.');
    }

    if (user.verified) {
      return ok(res, 'ACCOUNT_ALREADY_VERIFIED', 'This account is already verified.', { email });
    }

    if (user.verification_code !== input.code.trim()) {
      fail(400, 'INVALID_SECURITY_CODE', 'The security code does not match.');
    }

    const now = new Date().toISOString();
    await pool.query(
      `
        UPDATE users
        SET verified = true,
            verification_code = NULL,
            welcome_sent_at = $1
        WHERE id = $2
      `,
      [now, user.id]
    );

    await sendWelcomeMail(user.id, user.email, user.display_name);

    return ok(res, 'VERIFICATION_CONFIRMED', 'Account verification confirmed.', { email });
  })
);

router.post(
  '/auth/resend-code',
  authLimiter,
  asyncRoute(async (req, res) => {
    const input = resetRequestSchema.parse(req.body);
    const email = input.email.trim().toLowerCase();
    const user = await getUserByEmail(email);

    if (!user) {
      fail(404, 'EMAIL_NOT_FOUND', 'No account was found for this email address.');
    }

    if (user.verified) {
      fail(400, 'ACCOUNT_ALREADY_VERIFIED', 'This account is already verified.');
    }

    const now = new Date().toISOString();
    const securityCode = generateNumericCode();

    await pool.query(
      `
        UPDATE users
        SET verification_code = $1,
            verification_sent_at = $2
        WHERE id = $3
      `,
      [securityCode, now, user.id]
    );

    await sendSecurityCodeMail(user.id, user.email, user.display_name, securityCode);

    return ok(res, 'SECURITY_CODE_SENT', 'A fresh security code was sent to the relay.', { email });
  })
);

router.post(
  '/auth/login',
  authLimiter,
  asyncRoute(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const identifier = input.identifier.trim();
    const user = await getUserByIdentifier(identifier);

    if (!user || !bcrypt.compareSync(input.password, user.password_hash)) {
      fail(401, 'ACCESS_DENIED', 'Identifier or password is incorrect.');
    }

    if (!user.verified) {
      return res.status(403).json({
        ok: false,
        code: 'SECURITY_CODE_REQUIRED',
        message: 'This account must be verified before the first login.',
        email: user.email
      } satisfies ActionResult);
    }

    if (user.is_hidden || user.is_suspended) {
      fail(403, 'ACCOUNT_UNAVAILABLE', 'This account is currently unavailable.');
    }

    const token = createSessionToken();
    await pool.query(
      `
        INSERT INTO sessions (
          id,
          user_id,
          token_hash,
          created_at,
          expires_at,
          user_agent,
          ip_address
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        `session-${randomUUID().slice(0, 8)}`,
        user.id,
        hashToken(token),
        new Date().toISOString(),
        sessionExpiry(),
        req.headers['user-agent'] ?? '',
        req.ip ?? ''
      ]
    );

    setSessionCookie(res, token);

    return ok(res, 'LINK_ESTABLISHED', 'Handshake established.', {
      state: await buildStateForUser(user.id)
    });
  })
);

router.post(
  '/auth/logout',
  asyncRoute(async (req, res) => {
    const token = readCookie(req, config.sessionCookieName);
    await removeSessionByToken(token);
    clearSessionCookie(res);
    return ok(res, 'SESSION_CLOSED', 'Session closed.', {
      state: await buildStateForUser(null)
    });
  })
);

router.post(
  '/auth/request-password-reset',
  authLimiter,
  asyncRoute(async (req, res) => {
    if (config.betaMode) {
      fail(403, 'BETA_PASSWORD_RESET_DISABLED', 'Password reset is disabled during the current beta.');
    }

    const input = resetRequestSchema.parse(req.body);
    const email = input.email.trim().toLowerCase();
    const user = await getUserByEmail(email);

    if (user) {
      const code = generateNumericCode();
      const now = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      await pool.query(
        `
          INSERT INTO password_reset_tokens (
            id,
            user_id,
            code,
            created_at,
            expires_at
          ) VALUES ($1, $2, $3, $4, $5)
        `,
        [`reset-${randomUUID().slice(0, 8)}`, user.id, code, now, expiresAt]
      );

      await sendPasswordResetMail(user.id, user.email, user.display_name, code);
    }

    return ok(
      res,
      'PASSWORD_RESET_SENT',
      'If the address exists, a reset code was sent to the relay.',
      { email }
    );
  })
);

router.post(
  '/auth/reset-password',
  authLimiter,
  asyncRoute(async (req, res) => {
    if (config.betaMode) {
      fail(403, 'BETA_PASSWORD_RESET_DISABLED', 'Password reset is disabled during the current beta.');
    }

    const input = resetPasswordSchema.parse(req.body);
    const email = input.email.trim().toLowerCase();
    const user = await getUserByEmail(email);

    if (!user) {
      fail(404, 'EMAIL_NOT_FOUND', 'No account was found for this email address.');
    }

    const result = await pool.query<{ id: string }>(
      `
        SELECT id
        FROM password_reset_tokens
        WHERE user_id = $1
          AND code = $2
          AND used_at IS NULL
          AND expires_at > $3
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [user.id, input.code.trim(), new Date().toISOString()]
    );

    const tokenRow = result.rows[0];
    if (!tokenRow) {
      fail(400, 'INVALID_RESET_CODE', 'The password reset code is invalid or expired.');
    }

    const now = new Date().toISOString();
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
      bcrypt.hashSync(input.password, 10),
      user.id
    ]);
    await pool.query('UPDATE password_reset_tokens SET used_at = $1 WHERE id = $2', [now, tokenRow.id]);
    await pool.query('DELETE FROM sessions WHERE user_id = $1', [user.id]);

    return ok(res, 'PASSWORD_RESET_CONFIRMED', 'Password updated. Log in with the new key.', {
      email
    });
  })
);

router.get(
  '/dev/mailbox',
  asyncRoute(async (req, res) => {
    if (config.nodeEnv === 'production') {
      fail(404, 'NOT_AVAILABLE', 'Dev relay is disabled in production.');
    }

    const email = String(req.query.email ?? '').trim().toLowerCase();
    if (!email) {
      return ok(res, 'MAIL_RELAY_READY', 'No relay selected yet.', {
        mailbox: [] as MailMessage[],
        verified: false,
        accountExists: false
      });
    }

    const user = await getUserByEmail(email);
    const mailbox = (await listMailMessagesForEmail(email)).map((entry) => ({
      id: entry.id,
      userId: entry.user_id,
      email: entry.email,
      type: entry.type,
      subject: entry.subject,
      body: entry.body,
      code: entry.code,
      sentAt: entry.sent_at
    }));

    return ok(res, 'MAIL_RELAY_READY', 'Relay loaded.', {
      mailbox,
      verified: Boolean(user?.verified),
      accountExists: Boolean(user)
    });
  })
);

router.patch(
  '/account',
  writeLimiter,
  asyncRoute(async (req, res) => {
    const session = await getSessionUser(req);
    if (!session) {
      fail(401, 'AUTH_REQUIRED', 'Log in to update your account.');
    }

    const input = updateProfileSchema.parse(req.body);
    const handles = parseHandles(input.handles);

    await pool.query(
      `
        UPDATE users
        SET handles_discord = $1,
            handles_instagram = $2,
            handles_other = $3,
            notes = $4
        WHERE id = $5
      `,
      [handles.discord, handles.instagram, handles.other, input.notes.trim(), session.user.id]
    );

    return ok(res, 'PROFILE_UPDATED', 'Account profile updated.', {
      state: await buildStateForUser(session.user.id)
    });
  })
);

router.post(
  '/runners',
  writeLimiter,
  asyncRoute(async (req, res) => {
    const session = await getSessionUser(req);
    if (!session) {
      fail(401, 'AUTH_REQUIRED', 'Log in to create a runner dossier.');
    }

    const input = runnerDraftSchema.parse(req.body);
    const now = new Date().toISOString();
    const avatarPath = await processAvatarInput(input.avatar);
    const runnerId = `runner-${randomUUID().slice(0, 8)}`;

    await pool.query(
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
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `,
      [
        runnerId,
        session.user.id,
        input.streetName.trim().toUpperCase(),
        input.realName.trim(),
        input.age.trim(),
        input.metatype.trim(),
        input.archetype.trim(),
        JSON.stringify(input.specialties),
        input.riskLevel,
        input.summary.trim(),
        avatarPath,
        now,
        now,
        false
      ]
    );

    return ok(res, 'DOSSIER_SAVED', 'Runner dossier saved.', {
      state: await buildStateForUser(session.user.id),
      runnerId
    });
  })
);

router.put(
  '/runners/:runnerId',
  writeLimiter,
  asyncRoute(async (req, res) => {
    const session = await getSessionUser(req);
    if (!session) {
      fail(401, 'AUTH_REQUIRED', 'Log in to update a runner dossier.');
    }

    const runnerId = String(req.params.runnerId);
    const runner = await getRunnerById(runnerId);
    if (!runner || runner.owner_id !== session.user.id) {
      fail(404, 'RUNNER_NOT_FOUND', 'Runner dossier not found.');
    }

    const input = runnerDraftSchema.parse(req.body);
    const avatarPath = await processAvatarInput(input.avatar, runner.avatar_path);

    await pool.query(
      `
        UPDATE runners
        SET street_name = $1,
            real_name = $2,
            age = $3,
            metatype = $4,
            archetype = $5,
            specialties_json = $6,
            risk_level = $7,
            summary = $8,
            avatar_path = $9,
            updated_at = $10
        WHERE id = $11
      `,
      [
        input.streetName.trim().toUpperCase(),
        input.realName.trim(),
        input.age.trim(),
        input.metatype.trim(),
        input.archetype.trim(),
        JSON.stringify(input.specialties),
        input.riskLevel,
        input.summary.trim(),
        avatarPath,
        new Date().toISOString(),
        runner.id
      ]
    );

    return ok(res, 'DOSSIER_UPDATED', 'Runner dossier updated.', {
      state: await buildStateForUser(session.user.id)
    });
  })
);

router.delete(
  '/runners/:runnerId',
  writeLimiter,
  asyncRoute(async (req, res) => {
    const session = await getSessionUser(req);
    if (!session) {
      fail(401, 'AUTH_REQUIRED', 'Log in to delete a runner dossier.');
    }

    const runnerId = String(req.params.runnerId);
    const runner = await getRunnerById(runnerId);
    if (!runner || runner.owner_id !== session.user.id) {
      fail(404, 'RUNNER_NOT_FOUND', 'Runner dossier not found.');
    }

    await deleteManagedUpload(runner.avatar_path);
    await pool.query('DELETE FROM runners WHERE id = $1', [runner.id]);

    return ok(res, 'RUNNER_PURGED', 'Runner dossier deleted.', {
      state: await buildStateForUser(session.user.id)
    });
  })
);

router.post(
  '/jobs',
  writeLimiter,
  asyncRoute(async (req, res) => {
    const session = await getSessionUser(req);
    if (!session) {
      fail(401, 'AUTH_REQUIRED', 'Log in to deploy a mission.');
    }

    const input = jobDraftSchema.parse(req.body);
    const now = new Date().toISOString();
    const jobId = `job-${randomUUID().slice(0, 8)}`;

    await pool.query(
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
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `,
      [
        jobId,
        session.user.id,
        input.title.trim().toUpperCase(),
        input.description.trim(),
        input.payout,
        input.threatLevel,
        new Date(input.scheduledAt).toISOString(),
        input.scheduledTimeZone,
        input.site.trim(),
        input.playerSlots,
        input.notes.trim(),
        JSON.stringify(input.requirements),
        input.status,
        now,
        now,
        false
      ]
    );

    return ok(res, 'MISSION_SAVED', 'Mission deployed.', {
      state: await buildStateForUser(session.user.id),
      jobId
    });
  })
);

router.put(
  '/jobs/:jobId',
  writeLimiter,
  asyncRoute(async (req, res) => {
    const session = await getSessionUser(req);
    if (!session) {
      fail(401, 'AUTH_REQUIRED', 'Log in to update a mission.');
    }

    const jobId = String(req.params.jobId);
    const job = await getJobById(jobId);
    if (!job || job.owner_id !== session.user.id) {
      fail(404, 'MISSION_NOT_FOUND', 'Mission record not found.');
    }

    const input = jobDraftSchema.parse(req.body);

    await pool.query(
      `
        UPDATE jobs
        SET title = $1,
            description = $2,
            payout = $3,
            threat_level = $4,
            scheduled_at = $5,
            scheduled_timezone = $6,
            site = $7,
            player_slots = $8,
            notes = $9,
            requirements_json = $10,
            status = $11,
            updated_at = $12
        WHERE id = $13
      `,
      [
        input.title.trim().toUpperCase(),
        input.description.trim(),
        input.payout,
        input.threatLevel,
        new Date(input.scheduledAt).toISOString(),
        input.scheduledTimeZone,
        input.site.trim(),
        input.playerSlots,
        input.notes.trim(),
        JSON.stringify(input.requirements),
        input.status,
        new Date().toISOString(),
        job.id
      ]
    );

    return ok(res, 'MISSION_UPDATED', 'Mission updated.', {
      state: await buildStateForUser(session.user.id)
    });
  })
);

router.delete(
  '/jobs/:jobId',
  writeLimiter,
  asyncRoute(async (req, res) => {
    const session = await getSessionUser(req);
    if (!session) {
      fail(401, 'AUTH_REQUIRED', 'Log in to delete a mission.');
    }

    const jobId = String(req.params.jobId);
    const job = await getJobById(jobId);
    if (!job || job.owner_id !== session.user.id) {
      fail(404, 'MISSION_NOT_FOUND', 'Mission record not found.');
    }

    await pool.query('DELETE FROM jobs WHERE id = $1', [job.id]);

    return ok(res, 'MISSION_REMOVED', 'Mission removed from the board.', {
      state: await buildStateForUser(session.user.id)
    });
  })
);

router.post(
  '/jobs/:jobId/applications',
  writeLimiter,
  asyncRoute(async (req, res) => {
    const session = await getSessionUser(req);
    if (!session) {
      fail(401, 'AUTH_REQUIRED', 'Log in to apply to a mission.');
    }

    const jobId = String(req.params.jobId);
    const job = await getJobById(jobId);
    const input = applicationSchema.parse(req.body);
    const runner = await getRunnerById(input.runnerId);

    if (!job || !runner || runner.owner_id !== session.user.id) {
      fail(400, 'INVALID_APPLICATION', 'Runner dossier or mission record is invalid.');
    }

    if (job.owner_id === session.user.id) {
      fail(400, 'JOHNSON_CANNOT_APPLY', 'Johnsons cannot apply to their own missions.');
    }

    if (job.status !== 'open') {
      fail(400, 'MISSION_LOCKED', 'This mission is no longer accepting runners.');
    }

    if ((await acceptedSlots(job.id)) >= job.player_slots) {
      fail(400, 'SLOTS_FULL', 'All runner slots are already filled.');
    }

    const existing = await pool.query<{ id: string }>(
      `
        SELECT id
        FROM applications
        WHERE job_id = $1
          AND (runner_id = $2 OR applicant_id = $3)
        LIMIT 1
      `,
      [job.id, runner.id, session.user.id]
    );

    if (existing.rows[0]) {
      fail(
        409,
        'APPLICATION_ALREADY_ON_FILE',
        'You already have an application on file for this mission.'
      );
    }

    const now = new Date().toISOString();
    await pool.query(
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
      [`application-${randomUUID().slice(0, 8)}`, job.id, runner.id, session.user.id, 'pending', now, now]
    );

    await createNotification(
      job.owner_id,
      'application-pending',
      'New application received',
      `${runner.street_name} applied to ${job.title}.`,
      `/jobs/${job.id}`
    );

    return ok(res, 'APPLICATION_SENT', 'Application sent to the Johnson.', {
      state: await buildStateForUser(session.user.id)
    });
  })
);

router.patch(
  '/jobs/:jobId/applications/:applicationId',
  writeLimiter,
  asyncRoute(async (req, res) => {
    const session = await getSessionUser(req);
    if (!session) {
      fail(401, 'AUTH_REQUIRED', 'Log in to review applications.');
    }

    const jobId = String(req.params.jobId);
    const job = await getJobById(jobId);
    if (!job || job.owner_id !== session.user.id) {
      fail(404, 'MISSION_NOT_FOUND', 'Mission record not found.');
    }

    const applicationId = String(req.params.applicationId);
    const application = await getApplicationById(applicationId);
    if (!application || application.job_id !== job.id) {
      fail(404, 'APPLICATION_NOT_FOUND', 'Application record not found.');
    }

    const input = reviewSchema.parse(req.body);
    if (
      input.status === 'accepted' &&
      application.status !== 'accepted' &&
      (await acceptedSlots(job.id)) >= job.player_slots
    ) {
      fail(400, 'SLOTS_FULL', 'All runner slots are already filled.');
    }

    await pool.query(
      `
        UPDATE applications
        SET status = $1,
            updated_at = $2
        WHERE id = $3
      `,
      [input.status as ApplicationStatus, new Date().toISOString(), application.id]
    );

    await createNotification(
      application.applicant_id,
      `application-${input.status}`,
      input.status === 'accepted' ? 'Runner approved' : 'Runner declined',
      `${job.title} was marked ${input.status}.`,
      `/jobs/${job.id}`
    );

    return ok(
      res,
      input.status === 'accepted' ? 'RUNNER_APPROVED' : 'RUNNER_DECLINED',
      input.status === 'accepted'
        ? 'Runner accepted for this mission.'
        : 'Runner declined for this mission.',
      {
        state: await buildStateForUser(session.user.id)
      }
    );
  })
);

router.post(
  '/reports',
  writeLimiter,
  asyncRoute(async (req, res) => {
    const session = await getSessionUser(req);
    if (!session) {
      fail(401, 'AUTH_REQUIRED', 'Log in to file a report.');
    }

    const input = reportSchema.parse(req.body);

    await pool.query(
      `
        INSERT INTO reports (
          id,
          reporter_user_id,
          target_type,
          target_id,
          reason,
          details,
          status,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        `report-${randomUUID().slice(0, 8)}`,
        session.user.id,
        input.targetType,
        input.targetId,
        input.reason.trim(),
        input.details.trim(),
        'open',
        new Date().toISOString()
      ]
    );

    return ok(res, 'REPORT_RECEIVED', 'Report filed for moderator review.');
  })
);

export { router as apiRouter };
