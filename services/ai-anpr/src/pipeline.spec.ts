import { AnprPipeline } from './pipeline';
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { AnprEngine, RecognitionResult } from './engine';
import { BackendRecognitionClient, RecognitionRequest, RecognitionEventResponse, ParkingSessionResponse } from './backend-client';

class TestEngine implements AnprEngine {
  async recognize(): Promise<RecognitionResult> {
    return {
      raw_plate: '51h-987.65',
      confidence_score: 98.4,
      detected_vehicle_type: 'CAR_SEDAN',
      inference_time_ms: 55,
      ai_model_version: 'test-model',
      plate_crop_url: 'https://storage.test/plate.jpg',
    };
  }
}

class TestClient extends BackendRecognitionClient {
  async createRecognitionEvent(): Promise<RecognitionEventResponse> {
    return { event: { id: 'event-1' }, matched_vehicle: null, action: 'CONTINUE' };
  }

  async createParkingSession(): Promise<ParkingSessionResponse> {
    return { session_id: 'session-1', status: 'ACTIVE', plate_number: '51H-98765' };
  }
}

test('AnprPipeline normalizes an OCR result before sending the recognition event', async () => {
    const request: RecognitionRequest = {
      site_id: '018e5f2a-79b1-7a2e-839e-21ad87293b11',
      lane_id: '018e5f2a-79b1-7a2e-839e-21ad87293b22',
      direction: 'IN',
      image_url: 'https://storage.test/frame.jpg',
    };

    const result = await new AnprPipeline(new TestEngine(), new TestClient()).process(request);
    assert.deepEqual(result.plate, { clean_plate: '51H98765', display_plate: '51H-98765' });
    assert.equal(result.recognition.action, 'CONTINUE');
    assert.equal(result.session.session_id, 'session-1');
});
