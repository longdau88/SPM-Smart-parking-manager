import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EdgeIngestionService } from './edge-ingestion.service';
import { EdgeEventReceiptEntity } from './entities/edge-event-receipt.entity';
import { EdgeDeviceHeartbeatEntity } from './entities/edge-device-heartbeat.entity';
import { ParkingSiteEntity } from '../parking/entities/parking-site.entity';
import { ParkingLaneEntity } from '../parking/entities/parking-lane.entity';
import { RecognitionEventService } from '../vehicle/services/recognition-event.service';
import { ParkingSessionService } from '../session/services/parking-session.service';
import { RealtimeGateway } from './realtime.gateway';

describe('EdgeIngestionService', () => {
  let service: EdgeIngestionService;
  const receiptRepository = { findOne: jest.fn(), create: jest.fn(), save: jest.fn(), find: jest.fn() };
  const heartbeatRepository = { create: jest.fn(), save: jest.fn(), find: jest.fn() };
  const siteRepository = { findOne: jest.fn() };
  const laneRepository = { findOne: jest.fn() };
  const recognitionService = { create: jest.fn() };
  const sessionService = { createEntry: jest.fn(), exitCheck: jest.fn() };
  const realtime = { emitSite: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        EdgeIngestionService,
        { provide: getRepositoryToken(EdgeEventReceiptEntity), useValue: receiptRepository },
        { provide: getRepositoryToken(EdgeDeviceHeartbeatEntity), useValue: heartbeatRepository },
        { provide: getRepositoryToken(ParkingSiteEntity), useValue: siteRepository },
        { provide: getRepositoryToken(ParkingLaneEntity), useValue: laneRepository },
        { provide: RecognitionEventService, useValue: recognitionService },
        { provide: ParkingSessionService, useValue: sessionService },
        { provide: RealtimeGateway, useValue: realtime },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(undefined) } },
      ],
    }).compile();
    service = module.get(EdgeIngestionService);
    receiptRepository.create.mockImplementation((value) => value);
    receiptRepository.save.mockImplementation((value) => Promise.resolve({ id: 'receipt-1', ...value }));
    heartbeatRepository.create.mockImplementation((value) => value);
    heartbeatRepository.save.mockImplementation((value) => Promise.resolve(value));
    siteRepository.findOne.mockResolvedValue({ id: '00000000-0000-4000-8000-000000000001' });
    laneRepository.findOne.mockResolvedValue({ id: '00000000-0000-4000-8000-000000000002' });
    receiptRepository.findOne.mockResolvedValue(null);
  });

  it('returns duplicate for a replayed edge event', async () => {
    receiptRepository.findOne.mockResolvedValue({ id: 'receipt-1', edge_event_id: 'edge-1' });
    const result = await service.ingest({
      edge_event_id: 'edge-1',
      tenant_id: 'tenant-1',
      site_id: 'site-1',
      lane_id: 'lane-1',
      event_type: 'lane.loop_state',
      payload: {},
    });
    expect(result.duplicate).toBe(true);
  });

  it('creates recognition and entry session for edge detection', async () => {
    receiptRepository.findOne.mockResolvedValue(null);
    recognitionService.create.mockResolvedValue({ event: { id: 'recognition-1' } });
    sessionService.createEntry.mockResolvedValue({ session_id: 'session-1' });
    const result = await service.ingest({
      edge_event_id: '00000000-0000-4000-8000-000000000010',
      tenant_id: '00000000-0000-4000-8000-000000000011',
      site_id: '00000000-0000-4000-8000-000000000001',
      lane_id: '00000000-0000-4000-8000-000000000002',
      event_type: 'lane.detected',
      direction: 'IN',
      clean_plate: '51H98765',
      display_plate: '51H-987.65',
      payload: { confidence: 98, timestamp: '2026-11-20T10:00:00Z' },
    });
    expect(result.duplicate).toBe(false);
    expect(recognitionService.create).toHaveBeenCalledWith(expect.objectContaining({
      edge_event_id: '00000000-0000-4000-8000-000000000010',
      clean_plate: '51H98765',
    }), '00000000-0000-4000-8000-000000000011');
    expect(sessionService.createEntry).toHaveBeenCalled();
  });

  it('handles a replayed batch without duplicating sessions', async () => {
    const calls: Promise<unknown>[] = [];
    for (let i = 0; i < 50; i++) {
      const edgeId = `00000000-0000-4000-8000-${i.toString().padStart(12, '0')}`;
      receiptRepository.findOne.mockResolvedValueOnce(null);
      calls.push(service.ingest({
        edge_event_id: edgeId,
        tenant_id: '00000000-0000-4000-8000-000000000011',
        site_id: '00000000-0000-4000-8000-000000000001',
        lane_id: '00000000-0000-4000-8000-000000000002',
        event_type: 'lane.loop_state',
        payload: { loop1: true },
      }));
    }
    await Promise.all(calls);
    expect(receiptRepository.save).toHaveBeenCalledTimes(50);
  });

  it('updates edge heartbeat state and emits realtime event', async () => {
    await service.updateHeartbeat(
      '00000000-0000-4000-8000-000000000011',
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000002',
      { device_id: '00000000-0000-4000-8000-000000000003', state: 'ONLINE' },
    );
    expect(heartbeatRepository.save).toHaveBeenCalled();
    expect(realtime.emitSite).toHaveBeenCalledWith(
      '00000000-0000-4000-8000-000000000011',
      '00000000-0000-4000-8000-000000000001',
      'cabin.event',
      expect.objectContaining({ type: 'EDGE_HEARTBEAT', state: 'ONLINE' }),
    );
  });
});
