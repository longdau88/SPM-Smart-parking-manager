import { RecognitionResult } from './engine';
import { NormalizedPlate } from './plate';

export interface RecognitionRequest {
  site_id: string;
  lane_id: string;
  direction: 'IN' | 'OUT';
  image_url: string;
  plate_crop_url?: string;
}

export interface RecognitionEventResponse {
  event: Record<string, unknown>;
  matched_vehicle: Record<string, unknown> | null;
  action: 'CONTINUE' | 'MANUAL_REVIEW';
}

export interface ParkingSessionResponse {
  session_id: string;
  status: string;
  plate_number: string;
  duration_minutes?: number;
  total_fee?: number;
}

export class BackendRecognitionClient {
  constructor(
    private readonly baseUrl = process.env.BACKEND_API_URL ?? 'http://localhost:8000/api/v1',
    private readonly token = process.env.BACKEND_API_TOKEN,
    private readonly tenantId = process.env.BACKEND_TENANT_ID,
  ) {}

  async createRecognitionEvent(
    request: RecognitionRequest,
    result: RecognitionResult,
    plate: NormalizedPlate,
  ): Promise<RecognitionEventResponse> {
    if (!this.tenantId) throw new Error('Thiếu BACKEND_TENANT_ID');
    const response = await fetch(`${this.baseUrl}/recognition-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Id': this.tenantId,
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: JSON.stringify({
        site_id: request.site_id,
        lane_id: request.lane_id,
        direction: request.direction,
        clean_plate: plate.clean_plate,
        display_plate: plate.display_plate,
        confidence_score: result.confidence_score,
        detected_vehicle_type: result.detected_vehicle_type,
        raw_image_url: request.image_url,
        cropped_plate_url: result.plate_crop_url,
        inference_time_ms: result.inference_time_ms,
        ai_model_version: result.ai_model_version,
      }),
    });

    const payload = (await response.json()) as { data?: RecognitionEventResponse; message?: string };
    if (!response.ok || !payload.data) {
      throw new Error(payload.message ?? `Backend recognition event failed (HTTP ${response.status})`);
    }
    return payload.data;
  }

  async createParkingSession(
    request: RecognitionRequest,
    result: RecognitionResult,
    plate: NormalizedPlate,
    recognition: RecognitionEventResponse,
  ): Promise<ParkingSessionResponse> {
    const eventId = typeof recognition.event.id === 'string' ? recognition.event.id : undefined;
    const endpoint = request.direction === 'IN' ? 'entry' : 'exit-check';
    const body = request.direction === 'IN'
      ? {
          site_id: request.site_id,
          lane_id: request.lane_id,
          clean_plate: plate.clean_plate,
          display_plate: plate.display_plate,
          entry_image_url: request.image_url,
          entry_plate_crop_url: result.plate_crop_url,
          recognition_id: eventId,
        }
      : {
          site_id: request.site_id,
          lane_id: request.lane_id,
          clean_plate: plate.clean_plate,
          display_plate: plate.display_plate,
          exit_image_url: request.image_url,
          exit_plate_crop_url: result.plate_crop_url,
          recognition_id: eventId,
        };
    if (!this.tenantId) throw new Error('Thiếu BACKEND_TENANT_ID');
    const response = await fetch(`${this.baseUrl}/parking-sessions/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Id': this.tenantId,
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as { data?: ParkingSessionResponse; message?: string };
    if (!response.ok || !payload.data) {
      throw new Error(payload.message ?? `Parking session failed (HTTP ${response.status})`);
    }
    return payload.data;
  }
}
