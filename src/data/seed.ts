import type { Job, MailMessage, Runner, User } from '../types';
import { createPortraitDataUrl } from '../lib/portraits';

export interface SeedUser extends Omit<User, 'email'> {
  email: string;
  password: string;
  securityCode: string | null;
  securityCodeSentAt: string | null;
  welcomeSentAt: string | null;
}

export interface SeedState {
  currentUserId: string | null;
  mailbox: MailMessage[];
  users: SeedUser[];
  runners: Runner[];
  jobs: Job[];
}

export const seedState: SeedState = {
  currentUserId: null,
  mailbox: [],
  users: [
    {
      id: 'user-kill-switch',
      email: 'killswitch@blackwire.net',
      displayName: 'K1LL_SWITCH',
      password: 'blackwire',
      createdAt: '2026-03-12T18:20:00.000Z',
      verified: true,
      securityCode: null,
      securityCodeSentAt: null,
      welcomeSentAt: '2026-03-12T18:25:00.000Z',
      notes: 'SR6 only. Long-form sessions preferred. Saturdays after 18:00 CET.',
      handles: {
        discord: 'killswitch#2082',
        instagram: '@killswitch_shadow',
        other: 'JackPoint relay on request'
      }
    },
    {
      id: 'user-zero-sum',
      email: 'zero-sum@blackwire.net',
      displayName: 'XERO_SUM',
      password: 'blackwire',
      createdAt: '2026-03-08T11:00:00.000Z',
      verified: true,
      securityCode: null,
      securityCodeSentAt: null,
      welcomeSentAt: '2026-03-08T11:05:00.000Z',
      notes: 'Prefers matrix-heavy runs and late evening slots.',
      handles: {
        discord: 'zerosum#0442',
        instagram: '@xerosum_shadow',
        other: 'Signal relay available on request'
      }
    },
    {
      id: 'user-neon-veil',
      email: 'neon-veil@blackwire.net',
      displayName: 'NEON_VEIL',
      password: 'blackwire',
      createdAt: '2026-03-04T13:40:00.000Z',
      verified: true,
      securityCode: null,
      securityCodeSentAt: null,
      welcomeSentAt: '2026-03-04T13:44:00.000Z',
      notes: 'Happy to GM extraction, stealth and social jobs. No weekday marathons.',
      handles: {
        discord: 'neonveil#6701',
        instagram: '@neonveil_art',
        other: 'Instagram @neonveil_art'
      }
    }
  ],
  runners: [
    {
      id: 'runner-neuro-mancer',
      ownerId: 'user-kill-switch',
      streetName: 'NEURO_MANCER',
      realName: 'Tomas R.',
      age: '28',
      metatype: 'Elf',
      archetype: 'Decker',
      specialties: ['Icebreaking', 'Cyberware', 'Signal Hijack'],
      riskLevel: 'Professional',
      summary: 'Matrix infiltration, intrusion mapping, quiet overwatch.',
      avatar: createPortraitDataUrl('Neuro Mancer', '#a9ffdf', '#6ffff0')
    },
    {
      id: 'runner-signal-lost',
      ownerId: 'user-kill-switch',
      streetName: 'SIGNAL_LOST',
      realName: '',
      age: '31',
      metatype: 'Human',
      archetype: 'Face',
      specialties: ['Data Mining', 'Negotiation', 'Deep Web'],
      riskLevel: 'Experienced',
      summary: 'Broker, social entry, false credentials, post-run cleanup.',
      avatar: createPortraitDataUrl('Signal Lost', '#f8ffb6', '#c8ff6a')
    },
    {
      id: 'runner-ghost-walker',
      ownerId: 'user-zero-sum',
      streetName: 'GHOST_WALKER',
      realName: 'Mira Voss',
      age: '34',
      metatype: 'Ork',
      archetype: 'Street Samurai',
      specialties: ['Blade Specialist', 'Reflex Boost', 'Stealth'],
      riskLevel: 'Professional',
      summary: 'Close-quarters pressure with silent entry discipline.',
      avatar: createPortraitDataUrl('Ghost Walker', '#ff51fa', '#a900a9')
    },
    {
      id: 'runner-hex-code',
      ownerId: 'user-neon-veil',
      streetName: 'HEX_CODE',
      realName: 'Ari Sol',
      age: '24',
      metatype: 'Human',
      archetype: 'Mage',
      specialties: ['Ritual Support', 'Counterspelling', 'Drone Pilot'],
      riskLevel: 'Experienced',
      summary: 'Hybrid utility caster with backup drone surveillance.',
      avatar: createPortraitDataUrl('Hex Code', '#f8ffb6', '#ff51fa')
    }
  ],
  jobs: [
    {
      id: 'job-aztechnology-data-siphon',
      ownerId: 'user-neon-veil',
      title: 'AZTECHNOLOGY DATA SIPHON',
      description:
        'Extraction run into the Seattle Pyramid. Objective is a silent data copy, local wipe and clean exfil before the midnight handoff.',
      payout: 25000,
      threatLevel: 'Lethal',
      scheduledAt: '2026-03-29T18:30:00.000Z',
      site: 'Seattle Pyramid',
      playerSlots: 4,
      notes: 'Stealth first. Matrix support strongly preferred. Session estimated at 6 to 8 hours.',
      requirements: ['Decking', 'Stealth', 'SR6', 'Saturday'],
      status: 'open',
      applications: [
        {
          id: 'application-azt-1',
          jobId: 'job-aztechnology-data-siphon',
          runnerId: 'runner-neuro-mancer',
          applicantId: 'user-kill-switch',
          status: 'accepted',
          createdAt: '2026-03-20T08:30:00.000Z'
        },
        {
          id: 'application-azt-2',
          jobId: 'job-aztechnology-data-siphon',
          runnerId: 'runner-ghost-walker',
          applicantId: 'user-zero-sum',
          status: 'pending',
          createdAt: '2026-03-21T10:15:00.000Z'
        }
      ]
    },
    {
      id: 'job-oribi-retribution',
      ownerId: 'user-zero-sum',
      title: 'ORIBI EXPRESS RETRIBUTION',
      description:
        'Convoy interception in the Barrens. Expect rapid deployment, angry security and a hard time limit before the cargo leaves district.',
      payout: 12500,
      threatLevel: 'High',
      scheduledAt: '2026-03-30T16:00:00.000Z',
      site: 'Puyallup Barrens',
      playerSlots: 3,
      notes: 'Bring a driver or rigger. Heavy ordnance allowed.',
      requirements: ['Combat', 'Driver', 'Evening'],
      status: 'open',
      applications: []
    },
    {
      id: 'job-night-market-security',
      ownerId: 'user-kill-switch',
      title: 'NIGHT_MARKET SECURITY',
      description:
        'Short notice protective detail for an exchange in Renraku Arcade. Mostly crowd control, but it could escalate fast.',
      payout: 8000,
      threatLevel: 'Moderate',
      scheduledAt: '2026-03-27T17:00:00.000Z',
      site: 'Renraku Arcade',
      playerSlots: 2,
      notes: 'Good fit for fresh characters. Four hours planned.',
      requirements: ['Combat', 'Short Session'],
      status: 'open',
      applications: [
        {
          id: 'application-night-1',
          jobId: 'job-night-market-security',
          runnerId: 'runner-hex-code',
          applicantId: 'user-neon-veil',
          status: 'accepted',
          createdAt: '2026-03-24T11:40:00.000Z'
        }
      ]
    }
  ]
};
