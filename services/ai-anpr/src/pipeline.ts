import { AnprEngine, ImageInput } from './engine';
import { BackendRecognitionClient, RecognitionRequest } from './backend-client';
import { normalizePlate } from './plate';

export interface AnprPipelineResult {
  plate: ReturnType<typeof normalizePlate>;
  recognition: Awaited<ReturnType<BackendRecognitionClient['createRecognitionEvent']>>;
  session: Awaited<ReturnType<BackendRecognitionClient['createParkingSession']>>;
}

export class AnprPipeline {
  constructor(
    private readonly engine: AnprEngine,
    private readonly backendClient: BackendRecognitionClient,
  ) {}

  async process(request: RecognitionRequest): Promise<AnprPipelineResult> {
    const image = new URL(request.image_url);
    if (!['http:', 'https:'].includes(image.protocol)) {
      throw new Error('image_url phải là URL HTTP hoặc HTTPS');
    }

    const result = await this.engine.recognize({
      image_url: request.image_url,
      plate_crop_url: request.plate_crop_url,
    } satisfies ImageInput);
    const plate = normalizePlate(result.raw_plate);
    const recognition = await this.backendClient.createRecognitionEvent(request, result, plate);
    const session = await this.backendClient.createParkingSession(request, result, plate, recognition);
    return { plate, recognition, session };
  }
}
