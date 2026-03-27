import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import { config } from '../config';

export function generateNumericCode(length = 6) {
  let code = '';
  while (code.length < length) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code.slice(0, length);
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function readCookie(req: Request, name: string) {
  const raw = req.headers.cookie;
  if (!raw) {
    return null;
  }

  const parts = raw.split(';').map((entry) => entry.trim());
  for (const entry of parts) {
    const [key, ...rest] = entry.split('=');
    if (key === name) {
      return decodeURIComponent(rest.join('='));
    }
  }

  return null;
}

export function sessionExpiry(days = config.sessionTtlDays) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie(config.sessionCookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    maxAge: config.sessionTtlDays * 24 * 60 * 60 * 1000,
    path: '/'
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(config.sessionCookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    path: '/'
  });
}
