export type SlotStatus = 'EMPTY' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
export type SlotType = 'STANDARD' | 'VIP' | 'HANDICAPPED' | 'EV_CHARGING';

export interface ParkingSlot {
  slot_id: string;
  slot_number: string;
  slot_type: SlotType;
  occupancy_status: SlotStatus;
  coordinates?: { x: number; y: number; polygon?: number[][] };
  last_status_changed_at?: string;
}

export interface ParkingZone {
  zone_id: string;
  zone_code: string;
  zone_name: string;
  allowed_vehicle_type: string;
  capacity: number;
  slots: ParkingSlot[];
}

export interface ParkingFloor {
  floor_id: string;
  floor_code: string;
  floor_name: string;
  level_order: number;
  total_slots: number;
  occupied_slots: number;
  zones: ParkingZone[];
}

interface LayoutResponse {
  data?: ParkingFloor[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

export async function fetchParkingLayout(siteId: string): Promise<ParkingFloor[]> {
  const token = typeof window === 'undefined' ? null : localStorage.getItem('spm_token');
  const response = await fetch(`${API_URL}/parking-sites/${siteId}/layout`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Không thể tải sơ đồ bãi xe (HTTP ${response.status})`);
  }

  const payload = (await response.json()) as LayoutResponse;
  if (!Array.isArray(payload.data)) {
    throw new Error('Dữ liệu sơ đồ bãi xe không hợp lệ');
  }

  return payload.data;
}
