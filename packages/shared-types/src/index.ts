// Common Response Wrapper
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: Array<{ field?: string; issue: string }>;
    timestamp: string;
    trace_id?: string;
  };
  meta?: {
    page?: number;
    limit?: number;
    total_records?: number;
    total_pages?: number;
  };
}

// User & IAM Types
export type UserType = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'MANAGER' | 'STAFF' | 'CASHIER' | 'CUSTOMER';

export interface User {
  id: string;
  tenant_id?: string | null;
  email?: string;
  phone_number?: string;
  full_name: string;
  avatar_url?: string;
  user_type: UserType;
  is_active: boolean;
  is_mfa_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Tenant / Organization
export interface Organization {
  id: string;
  code: string;
  name: string;
  tax_code?: string;
  contact_email: string;
  contact_phone: string;
  address?: string;
  subscription_status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
  max_sites: number;
  max_lanes: number;
  max_cameras: number;
  settings: Record<string, any>;
  created_at: string;
}

// Parking Site & Infrastructure
export type SiteType = 'MALL' | 'RESIDENTIAL' | 'OFFICE' | 'HOSPITAL' | 'AIRPORT' | 'PUBLIC';

export interface ParkingSite {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  site_type: SiteType;
  address: string;
  latitude?: number;
  longitude?: number;
  total_capacity: number;
  car_capacity: number;
  motorcycle_capacity: number;
  is_active: boolean;
}

// Lane & Hardware
export type LaneType = 'ENTRY' | 'EXIT' | 'BIDIRECTIONAL';
export type LaneOperatingMode = 'AUTO_AI' | 'MANUAL_STAFF' | 'EMERGENCY_OPEN' | 'CLOSED';

export interface ParkingLane {
  id: string;
  site_id: string;
  edge_node_id?: string;
  lane_code: string;
  lane_name: string;
  lane_type: LaneType;
  operating_mode: LaneOperatingMode;
  is_active: boolean;
}

// Vehicle & Registration
export type VehicleType = 'MOTORCYCLE' | 'CAR_SEDAN' | 'CAR_SUV' | 'TRUCK' | 'BUS' | 'EV_CAR' | 'BICYCLE';

export interface Vehicle {
  id: string;
  tenant_id: string;
  owner_user_id?: string;
  clean_plate: string;
  display_plate: string;
  vehicle_type: VehicleType;
  brand?: string;
  model?: string;
  color?: string;
  vehicle_status: 'ACTIVE' | 'BLOCKED' | 'STOLEN_ALERT';
}

// Parking Sessions (Core Movement)
export type SessionStatus = 'ACTIVE' | 'PENDING_PAYMENT' | 'COMPLETED' | 'REVIEW_REQUIRED' | 'ABNORMAL';
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'WAIVED' | 'REFUNDED';

export interface ParkingSession {
  id: string;
  tenant_id: string;
  site_id: string;
  vehicle_id?: string;
  subscription_id?: string;
  clean_plate_entry: string;
  display_plate_entry: string;
  entry_time: string;
  entry_lane_id: string;
  entry_image_url: string;
  entry_plate_crop_url: string;
  clean_plate_exit?: string;
  display_plate_exit?: string;
  exit_time?: string;
  exit_lane_id?: string;
  exit_image_url?: string;
  exit_plate_crop_url?: string;
  duration_minutes?: number;
  status: SessionStatus;
  calculated_fee: number;
  paid_fee: number;
  payment_status: PaymentStatus;
  is_offline_created: boolean;
  edge_sync_status: 'PENDING' | 'SYNCED' | 'CONFLICT';
  created_at: string;
  updated_at: string;
}

// AI Recognition
export interface RecognitionLog {
  id: string;
  tenant_id: string;
  site_id: string;
  lane_id: string;
  session_id?: string;
  direction: 'IN' | 'OUT';
  recognized_clean_plate?: string;
  recognized_display_plate?: string;
  confidence_score: number;
  detected_vehicle_type?: string;
  raw_image_url: string;
  cropped_plate_url: string;
  inference_time_ms: number;
  ai_model_version: string;
  is_manually_corrected: boolean;
  corrected_plate?: string;
  created_at: string;
}
