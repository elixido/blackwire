import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from '../config';
import { pool } from '../db/database';
import type { MailMessage } from '../../../src/types';

interface MailOptions {
  userId: string;
  email: string;
  type: MailMessage['type'];
  subject: string;
  body: string;
  code?: string | null;
}

function writeRelayFile(message: MailMessage) {
  const safeEmail = message.email.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `${message.sentAt.replace(/[:.]/g, '-')}-${safeEmail}-${message.type}.json`;
  const filePath = path.join(config.mailboxDir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(message, null, 2));
}

export async function enqueueMail(options: MailOptions): Promise<MailMessage> {
  const sentAt = new Date().toISOString();
  const message: MailMessage = {
    id: `mail-${randomUUID().slice(0, 8)}`,
    userId: options.userId,
    email: options.email.toLowerCase(),
    type: options.type,
    subject: options.subject,
    body: options.body,
    code: options.code ?? null,
    sentAt
  };

  await pool.query(
    `
      INSERT INTO mail_messages (
        id,
        user_id,
        email,
        type,
        subject,
        body,
        code,
        sent_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [
      message.id,
      message.userId,
      message.email,
      message.type,
      message.subject,
      message.body,
      message.code,
      message.sentAt
    ]
  );

  writeRelayFile(message);
  return message;
}

export function sendSecurityCodeMail(userId: string, email: string, displayName: string, code: string) {
  return enqueueMail({
    userId,
    email,
    type: 'security-code',
    subject: 'BLACKWIRE SECURITY CODE',
    body: `Security code for ${displayName}: ${code}`,
    code
  });
}

export function sendWelcomeMail(userId: string, email: string, displayName: string) {
  return enqueueMail({
    userId,
    email,
    type: 'welcome',
    subject: 'WELCOME TO BLACKWIRE',
    body: `Willkommen in den Schatten, ${displayName} - wir wuenschen Ihnen einen angenehmen Aufenthalt.`
  });
}

export function sendPasswordResetMail(
  userId: string,
  email: string,
  displayName: string,
  code: string
) {
  return enqueueMail({
    userId,
    email,
    type: 'password-reset',
    subject: 'BLACKWIRE PASSWORD RESET',
    body: `Password reset code for ${displayName}: ${code}`,
    code
  });
}
