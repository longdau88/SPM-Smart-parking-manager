export type LaneDirection = 'IN' | 'OUT';
export type SessionStatus = 'ACTIVE' | 'PENDING_PAYMENT' | 'COMPLETED';

export interface ActiveSession {
  id: string;
  clean_plate_entry: string;
  display_plate_entry: string;
  entry_time: string;
  status: SessionStatus;
  calculated_fee: number;
}

export interface LaneEvent {
  id: string;
  direction: LaneDirection;
  plate: string;
  confidence: number;
  time: string;
  status: 'APPROVED' | 'REVIEW';
}

export interface SessionResult {
  session_id: string;
  plate_number: string;
  status: SessionStatus;
  action_required?: string;
  total_fee?: number;
  duration_text?: string;
  payment_status?: string;
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

function authHeaders() {
  const token = localStorage.getItem('spm_token');
  const tenant = import.meta.env.VITE_TENANT_ID ?? localStorage.getItem('spm_tenant_id');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(tenant ? { 'X-Tenant-Id': tenant } : {}),
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...init?.headers },
  });
  const payload = (await response.json()) as { data?: T; message?: string };
  if (!response.ok || payload.data === undefined) {
    throw new Error(payload.message ?? `API request failed (${response.status})`);
  }
  return payload.data;
}

export async function fetchActiveSessions(siteId: string): Promise<ActiveSession[]> {
  return request<ActiveSession[]>(`/parking-sessions/sites/${siteId}/active`);
}

export async function createEntry(input: {
  site_id: string;
  lane_id: string;
  clean_plate: string;
}): Promise<SessionResult> {
  return request('/parking-sessions/entry', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      display_plate: input.clean_plate.toUpperCase(),
      entry_image_url: 'https://storage.spm.io/demo/entry.jpg',
      entry_plate_crop_url: 'https://storage.spm.io/demo/plate.jpg',
    }),
  });
}

export async function checkExit(input: {
  site_id: string;
  lane_id: string;
  clean_plate: string;
}): Promise<SessionResult> {
  return request('/parking-sessions/exit-check', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      display_plate: input.clean_plate.toUpperCase(),
      exit_image_url: 'https://storage.spm.io/demo/exit.jpg',
      exit_plate_crop_url: 'https://storage.spm.io/demo/plate-exit.jpg',
    }),
  });
}

export async function createInvoice(sessionId: string): Promise<{ invoice_id: string; amount: number; vietqr_payload: string }> {
  return request(`/payments/sessions/${sessionId}/invoice`, {
    method: 'POST',
    body: JSON.stringify({ payment_method: 'VIETQR' }),
  });
}

export async function confirmCash(invoiceId: string): Promise<SessionResult> {
  return request('/payments/cash-confirm', {
    method: 'POST',
    body: JSON.stringify({ invoice_id: invoiceId, operator_note: 'Staff cabin F4 confirmation' }),
  });
}

export async function controlBarrier(laneId: string, siteId: string, action: 'OPEN' | 'CLOSE', reason?: string): Promise<Record<string, unknown>> {
  return request(`/operations/barriers/${laneId}/control`, {
    method: 'POST',
    body: JSON.stringify({ site_id: siteId, action, reason }),
  });
}

export const DEMO_SESSIONS: ActiveSession[] = [
  { id: 'demo-1', clean_plate_entry: '51H98765', display_plate_entry: '51H-987.65', entry_time: new Date(Date.now() - 45 * 60000).toISOString(), status: 'ACTIVE', calculated_fee: 0 },
  { id: 'demo-2', clean_plate_entry: '59A12345', display_plate_entry: '59A-123.45', entry_time: new Date(Date.now() - 130 * 60000).toISOString(), status: 'ACTIVE', calculated_fee: 0 },
];
