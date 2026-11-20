export interface ImageInput {
  image_url: string;
  plate_crop_url?: string;
}

export interface RecognitionResult {
  raw_plate: string;
  confidence_score: number;
  detected_vehicle_type: string;
  inference_time_ms: number;
  ai_model_version: string;
  plate_crop_url: string;
}

export interface AnprEngine {
  recognize(input: ImageInput): Promise<RecognitionResult>;
}

export class MockAnprEngine implements AnprEngine {
  async recognize(input: ImageInput): Promise<RecognitionResult> {
    const url = new URL(input.image_url);
    const rawPlate = url.searchParams.get('plate');
    if (!rawPlate) {
      throw new Error('Mock ANPR yêu cầu image_url có query ?plate=51H-987.65');
    }

    return {
      raw_plate: rawPlate,
      confidence_score: 99,
      detected_vehicle_type: 'CAR_SEDAN',
      inference_time_ms: 1,
      ai_model_version: 'mock-anpr-v1',
      plate_crop_url: input.plate_crop_url ?? input.image_url,
    };
  }
}

export function createAnprEngine(): AnprEngine {
  const engine = process.env.ANPR_ENGINE ?? 'mock';
  if (engine === 'mock') return new MockAnprEngine();
  throw new Error(`ANPR engine '${engine}' chưa được tích hợp; hãy cấu hình adapter model thật`);
}
