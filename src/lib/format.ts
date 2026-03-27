import type { ApplicationStatus, Job, RiskLevel, ThreatLevel } from '../types';

export function formatNuyen(value: number): string {
  return new Intl.NumberFormat('de-DE').format(value);
}

export function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}

export function toInputDateTime(value: string): string {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function fromInputDateTime(value: string): string {
  return new Date(value).toISOString();
}

export function threatTone(level: ThreatLevel): 'mint' | 'pink' | 'amber' | 'red' {
  if (level === 'Low') {
    return 'mint';
  }
  if (level === 'Moderate') {
    return 'amber';
  }
  if (level === 'High') {
    return 'pink';
  }
  return 'red';
}

export function riskScore(level: RiskLevel): number {
  if (level === 'Initiate') {
    return 25;
  }
  if (level === 'Experienced') {
    return 50;
  }
  if (level === 'Professional') {
    return 75;
  }
  return 100;
}

export function applicationLabel(status: ApplicationStatus): string {
  if (status === 'pending') {
    return 'PENDING';
  }
  if (status === 'accepted') {
    return 'ACCEPTED';
  }
  return 'REJECTED';
}

export function acceptedSlots(job: Job): number {
  return job.applications.filter((entry) => entry.status === 'accepted').length;
}

export function openSlots(job: Job): number {
  return Math.max(job.playerSlots - acceptedSlots(job), 0);
}

export function statusClock(date: string): string {
  const now = Date.now();
  const target = new Date(date).getTime();
  const diff = target - now;
  if (diff <= 0) {
    return 'LIVE';
  }

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${hours}H ${minutes.toString().padStart(2, '0')}M`;
}

export function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
}

export function makeId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function serializeTags(values: string[]): string {
  return values.join(', ');
}
