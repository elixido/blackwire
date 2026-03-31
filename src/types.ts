export type ThreatLevel = 'Low' | 'Moderate' | 'High' | 'Lethal';
export type RiskLevel = 'Initiate' | 'Experienced' | 'Professional' | 'Legend';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export interface SocialHandles {
  discord: string;
  contactEmail: string;
  preferredContact: string;
  availability: string;
}

export interface User {
  id: string;
  email: string | null;
  displayName: string;
  handles: SocialHandles;
  notes: string;
  createdAt: string;
  verified: boolean;
}

export interface Runner {
  id: string;
  ownerId: string;
  streetName: string;
  realName: string;
  age: string;
  metatype: string;
  archetype: string;
  specialties: string[];
  riskLevel: RiskLevel;
  summary: string;
  avatar: string;
}

export interface Application {
  id: string;
  jobId: string;
  runnerId: string;
  applicantId: string;
  status: ApplicationStatus;
  createdAt: string;
}

export interface Job {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  payout: number;
  threatLevel: ThreatLevel;
  scheduledAt: string;
  scheduledTimeZone?: string;
  site: string;
  playerSlots: number;
  notes: string;
  requirements: string[];
  status: 'open' | 'closed';
  applications: Application[];
}

export interface MailMessage {
  id: string;
  userId: string;
  email: string;
  type: 'security-code' | 'welcome' | 'password-reset';
  subject: string;
  body: string;
  code: string | null;
  sentAt: string;
}

export interface StoredState {
  users: User[];
  runners: Runner[];
  jobs: Job[];
  mailbox: MailMessage[];
  currentUserId: string | null;
}

export interface JobDraft {
  title: string;
  description: string;
  payout: number;
  threatLevel: ThreatLevel;
  scheduledAt: string;
  scheduledTimeZone?: string;
  site: string;
  playerSlots: number;
  notes: string;
  requirements: string[];
  status: 'open' | 'closed';
}

export interface RunnerDraft {
  streetName: string;
  realName: string;
  age: string;
  metatype: string;
  archetype: string;
  specialties: string[];
  riskLevel: RiskLevel;
  summary: string;
  avatar: string;
}

export interface RegisterInput {
  email: string;
  displayName: string;
  password: string;
  handles: SocialHandles;
  notes: string;
}

export interface ResetPasswordInput {
  email: string;
  code: string;
  password: string;
}

export interface ActionResult {
  ok: boolean;
  code: string;
  message: string;
  email?: string;
}

export interface MailRelayResult extends ActionResult {
  mailbox: MailMessage[];
  verified: boolean;
  accountExists: boolean;
}
