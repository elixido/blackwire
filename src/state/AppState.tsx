import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren
} from 'react';
import type {
  ActionResult,
  ApplicationStatus,
  Job,
  JobDraft,
  MailMessage,
  MailRelayResult,
  RegisterInput,
  ResetPasswordInput,
  Runner,
  RunnerDraft,
  StoredState,
  User
} from '../types';

const EMPTY_STATE: StoredState = {
  users: [],
  runners: [],
  jobs: [],
  mailbox: [],
  currentUserId: null
};

export const BETA_MODE = import.meta.env.VITE_BETA_MODE !== 'false';

type ApiEnvelope<T extends object = object> = ActionResult & Partial<T>;

interface AppStateValue {
  isReady: boolean;
  state: StoredState;
  currentUser: User | null;
  refreshState: () => Promise<void>;
  loadMailRelay: (email: string) => Promise<MailRelayResult>;
  login: (identifier: string, password: string) => Promise<ActionResult>;
  logout: () => Promise<void>;
  register: (input: RegisterInput) => Promise<ActionResult>;
  verifyAccount: (email: string, code: string) => Promise<ActionResult>;
  resendSecurityCode: (email: string) => Promise<ActionResult>;
  requestPasswordReset: (email: string) => Promise<ActionResult>;
  resetPassword: (input: ResetPasswordInput) => Promise<ActionResult>;
  updateProfile: (input: { handles: User['handles']; notes: string }) => Promise<ActionResult>;
  createRunner: (draft: RunnerDraft) => Promise<Runner | null>;
  updateRunner: (runnerId: string, draft: RunnerDraft) => Promise<Runner | null>;
  deleteRunner: (runnerId: string) => Promise<ActionResult>;
  createJob: (draft: JobDraft) => Promise<Job | null>;
  updateJob: (jobId: string, draft: JobDraft) => Promise<Job | null>;
  deleteJob: (jobId: string) => Promise<ActionResult>;
  applyToJob: (jobId: string, runnerId: string) => Promise<ActionResult>;
  reviewApplication: (
    jobId: string,
    applicationId: string,
    status: ApplicationStatus
  ) => Promise<ActionResult>;
  getUserById: (userId: string) => User | undefined;
  getRunnerById: (runnerId: string) => Runner | undefined;
  getJobById: (jobId: string) => Job | undefined;
}

const AppStateContext = createContext<AppStateValue | null>(null);

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

function apiUrl(path: string) {
  return `${API_BASE}${path}`;
}

function normalizeState(input?: Partial<StoredState> | null): StoredState {
  return {
    users: Array.isArray(input?.users) ? input.users : [],
    runners: Array.isArray(input?.runners) ? input.runners : [],
    jobs: Array.isArray(input?.jobs) ? input.jobs : [],
    mailbox: Array.isArray(input?.mailbox) ? input.mailbox : [],
    currentUserId: typeof input?.currentUserId === 'string' ? input.currentUserId : null
  };
}

async function request<T extends object = object>(
  path: string,
  options: RequestInit = {}
): Promise<ApiEnvelope<T>> {
  try {
    const headers = new Headers(options.headers);
    const isFormData = options.body instanceof FormData;

    if (options.body && !isFormData && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(apiUrl(path), {
      credentials: 'include',
      ...options,
      headers
    });

    const text = await response.text();
    const payload = text ? (JSON.parse(text) as Record<string, unknown>) : {};

    return {
      ok: Boolean(payload.ok) && response.ok,
      code:
        typeof payload.code === 'string'
          ? payload.code
          : response.ok
            ? 'REQUEST_OK'
            : 'REQUEST_FAILED',
      message:
        typeof payload.message === 'string'
          ? payload.message
          : response.ok
            ? 'Request completed.'
            : 'Request failed.',
      ...(payload as Partial<T>)
    };
  } catch {
    return {
      ok: false,
      code: 'NETWORK_ERROR',
      message: 'The node could not be reached.'
    } as ApiEnvelope<T>;
  }
}

export function AppStateProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<StoredState>(EMPTY_STATE);
  const [isReady, setIsReady] = useState(false);

  const currentUser = state.users.find((user) => user.id === state.currentUserId) ?? null;

  const applyServerState = (nextState?: Partial<StoredState> | null) => {
    if (!nextState) {
      return;
    }

    setState((previous) => ({
      ...normalizeState(nextState),
      mailbox:
        Array.isArray(nextState.mailbox) && nextState.mailbox.length > 0
          ? nextState.mailbox
          : previous.mailbox
    }));
  };

  const refreshState = async () => {
    const result = await request<{ state: StoredState }>('/api/bootstrap');
    setState(normalizeState(result.state ?? EMPTY_STATE));
    setIsReady(true);
  };

  useEffect(() => {
    void refreshState();
  }, []);

  const loadMailRelay = async (email: string): Promise<MailRelayResult> => {
    const query = email.trim() ? `?email=${encodeURIComponent(email.trim())}` : '';
    const result = await request<{
      mailbox: MailMessage[];
      verified: boolean;
      accountExists: boolean;
    }>(`/api/dev/mailbox${query}`);

    const mailbox = Array.isArray(result.mailbox) ? result.mailbox : [];
    setState((previous) => ({ ...previous, mailbox }));

    return {
      ok: result.ok,
      code: result.code,
      message: result.message,
      mailbox,
      verified: Boolean(result.verified),
      accountExists: Boolean(result.accountExists)
    };
  };

  const login = async (identifier: string, password: string): Promise<ActionResult> => {
    const result = await request<{ state: StoredState; email?: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    });

    if (result.ok) {
      applyServerState(result.state);
    }

    return {
      ok: result.ok,
      code: result.code,
      message: result.message,
      email: typeof result.email === 'string' ? result.email : undefined
    };
  };

  const logout = async () => {
    const result = await request<{ state: StoredState }>('/api/auth/logout', {
      method: 'POST'
    });

    setState(normalizeState(result.state ?? EMPTY_STATE));
  };

  const register = async (input: RegisterInput): Promise<ActionResult> => {
    const result = await request<{ email?: string; state?: StoredState }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(input)
    });

    if (result.ok && result.state) {
      applyServerState(result.state);
    } else if (result.ok && typeof result.email === 'string') {
      await loadMailRelay(result.email);
    }

    return {
      ok: result.ok,
      code: result.code,
      message: result.message,
      email: typeof result.email === 'string' ? result.email : undefined
    };
  };

  const verifyAccount = async (email: string, code: string): Promise<ActionResult> => {
    const result = await request<{ email?: string }>('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ email, code })
    });

    if (result.ok) {
      await loadMailRelay(email);
    }

    return {
      ok: result.ok,
      code: result.code,
      message: result.message,
      email: typeof result.email === 'string' ? result.email : undefined
    };
  };

  const resendSecurityCode = async (email: string): Promise<ActionResult> => {
    const result = await request<{ email?: string }>('/api/auth/resend-code', {
      method: 'POST',
      body: JSON.stringify({ email })
    });

    if (result.ok) {
      await loadMailRelay(email);
    }

    return {
      ok: result.ok,
      code: result.code,
      message: result.message,
      email: typeof result.email === 'string' ? result.email : undefined
    };
  };

  const requestPasswordReset = async (email: string): Promise<ActionResult> => {
    const result = await request<{ email?: string }>('/api/auth/request-password-reset', {
      method: 'POST',
      body: JSON.stringify({ email })
    });

    if (typeof result.email === 'string') {
      await loadMailRelay(result.email);
    }

    return {
      ok: result.ok,
      code: result.code,
      message: result.message,
      email: typeof result.email === 'string' ? result.email : undefined
    };
  };

  const resetPassword = async (input: ResetPasswordInput): Promise<ActionResult> => {
    const result = await request<{ email?: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(input)
    });

    if (typeof result.email === 'string') {
      await loadMailRelay(result.email);
    }

    return {
      ok: result.ok,
      code: result.code,
      message: result.message,
      email: typeof result.email === 'string' ? result.email : undefined
    };
  };

  const updateProfile = async (input: {
    handles: User['handles'];
    notes: string;
  }): Promise<ActionResult> => {
    const result = await request<{ state: StoredState }>('/api/account', {
      method: 'PATCH',
      body: JSON.stringify(input)
    });

    if (result.ok) {
      applyServerState(result.state);
    }

    return {
      ok: result.ok,
      code: result.code,
      message: result.message
    };
  };

  const createRunner = async (draft: RunnerDraft): Promise<Runner | null> => {
    const result = await request<{ state: StoredState; runnerId?: string }>('/api/runners', {
      method: 'POST',
      body: JSON.stringify(draft)
    });

    if (!result.ok) {
      return null;
    }

    const nextState = normalizeState(result.state ?? EMPTY_STATE);
    setState(nextState);
    return nextState.runners.find((runner) => runner.id === result.runnerId) ?? nextState.runners[0] ?? null;
  };

  const updateRunner = async (runnerId: string, draft: RunnerDraft): Promise<Runner | null> => {
    const result = await request<{ state: StoredState }>(`/api/runners/${runnerId}`, {
      method: 'PUT',
      body: JSON.stringify(draft)
    });

    if (!result.ok) {
      return null;
    }

    const nextState = normalizeState(result.state ?? EMPTY_STATE);
    setState(nextState);
    return nextState.runners.find((runner) => runner.id === runnerId) ?? null;
  };

  const deleteRunner = async (runnerId: string): Promise<ActionResult> => {
    const result = await request<{ state: StoredState }>(`/api/runners/${runnerId}`, {
      method: 'DELETE'
    });

    if (result.ok) {
      applyServerState(result.state);
    }

    return {
      ok: result.ok,
      code: result.code,
      message: result.message
    };
  };

  const createJob = async (draft: JobDraft): Promise<Job | null> => {
    const result = await request<{ state: StoredState; jobId?: string }>('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(draft)
    });

    if (!result.ok) {
      return null;
    }

    const nextState = normalizeState(result.state ?? EMPTY_STATE);
    setState(nextState);
    return nextState.jobs.find((job) => job.id === result.jobId) ?? nextState.jobs[0] ?? null;
  };

  const updateJob = async (jobId: string, draft: JobDraft): Promise<Job | null> => {
    const result = await request<{ state: StoredState }>(`/api/jobs/${jobId}`, {
      method: 'PUT',
      body: JSON.stringify(draft)
    });

    if (!result.ok) {
      return null;
    }

    const nextState = normalizeState(result.state ?? EMPTY_STATE);
    setState(nextState);
    return nextState.jobs.find((job) => job.id === jobId) ?? null;
  };

  const deleteJob = async (jobId: string): Promise<ActionResult> => {
    const result = await request<{ state: StoredState }>(`/api/jobs/${jobId}`, {
      method: 'DELETE'
    });

    if (result.ok) {
      applyServerState(result.state);
    }

    return {
      ok: result.ok,
      code: result.code,
      message: result.message
    };
  };

  const applyToJob = async (jobId: string, runnerId: string): Promise<ActionResult> => {
    const result = await request<{ state: StoredState }>(`/api/jobs/${jobId}/applications`, {
      method: 'POST',
      body: JSON.stringify({ runnerId })
    });

    if (result.ok) {
      applyServerState(result.state);
    }

    return {
      ok: result.ok,
      code: result.code,
      message: result.message
    };
  };

  const reviewApplication = async (
    jobId: string,
    applicationId: string,
    status: ApplicationStatus
  ): Promise<ActionResult> => {
    const result = await request<{ state: StoredState }>(
      `/api/jobs/${jobId}/applications/${applicationId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status })
      }
    );

    if (result.ok) {
      applyServerState(result.state);
    }

    return {
      ok: result.ok,
      code: result.code,
      message: result.message
    };
  };

  const value: AppStateValue = {
    isReady,
    state,
    currentUser,
    refreshState,
    loadMailRelay,
    login,
    logout,
    register,
    verifyAccount,
    resendSecurityCode,
    requestPasswordReset,
    resetPassword,
    updateProfile,
    createRunner,
    updateRunner,
    deleteRunner,
    createJob,
    updateJob,
    deleteJob,
    applyToJob,
    reviewApplication,
    getUserById: (userId) => state.users.find((user) => user.id === userId),
    getRunnerById: (runnerId) => state.runners.find((runner) => runner.id === runnerId),
    getJobById: (jobId) => state.jobs.find((job) => job.id === jobId)
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error('useAppState must be used inside AppStateProvider');
  }

  return context;
}
