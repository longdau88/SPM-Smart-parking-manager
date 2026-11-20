import { createServer } from 'node:http';
import { AnprPipeline } from './pipeline';
import { BackendRecognitionClient } from './backend-client';
import { createAnprEngine } from './engine';

const pipeline = new AnprPipeline(createAnprEngine(), new BackendRecognitionClient());

function readJson(request: import('node:http').IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) reject(new Error('Request body vượt quá 1MB'));
    });
    request.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Request body phải là JSON hợp lệ'));
      }
    });
    request.on('error', reject);
  });
}

const server = createServer(async (request, response) => {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (request.method === 'GET' && request.url === '/health') {
    response.writeHead(200);
    response.end(JSON.stringify({ status: 'ok', service: 'ai-anpr', engine: process.env.ANPR_ENGINE ?? 'mock' }));
    return;
  }
  if (request.method !== 'POST' || request.url !== '/v1/anpr/recognize') {
    response.writeHead(404);
    response.end(JSON.stringify({ message: 'Not found' }));
    return;
  }

  try {
    const body = await readJson(request) as Record<string, unknown>;
    const required = ['site_id', 'lane_id', 'direction', 'image_url'];
    const missing = required.filter((field) => typeof body[field] !== 'string' || !body[field]);
    if (missing.length) throw new Error(`Thiếu trường: ${missing.join(', ')}`);
    if (body.direction !== 'IN' && body.direction !== 'OUT') throw new Error('direction phải là IN hoặc OUT');

    const result = await pipeline.process({
      site_id: body.site_id as string,
      lane_id: body.lane_id as string,
      direction: body.direction,
      image_url: body.image_url as string,
      plate_crop_url: typeof body.plate_crop_url === 'string' ? body.plate_crop_url : undefined,
    });
    response.writeHead(201);
    response.end(JSON.stringify({ status: 'success', data: result }));
  } catch (error) {
    response.writeHead(400);
    response.end(JSON.stringify({ status: 'error', message: error instanceof Error ? error.message : 'ANPR processing failed' }));
  }
});

server.listen(Number(process.env.PORT ?? 8100), () => {
  console.log(`ANPR service listening on http://localhost:${process.env.PORT ?? 8100}`);
});
