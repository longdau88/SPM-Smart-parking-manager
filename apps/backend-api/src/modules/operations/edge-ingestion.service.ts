import { ConflictException, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as mqtt from 'mqtt';
import { Repository } from 'typeorm';
import { ParkingLaneEntity } from '../parking/entities/parking-lane.entity';
import { ParkingSiteEntity } from '../parking/entities/parking-site.entity';
import { ParkingSessionService } from '../session/services/parking-session.service';
import { RecognitionEventService } from '../vehicle/services/recognition-event.service';
import { EdgeDeviceHeartbeatEntity } from './entities/edge-device-heartbeat.entity';
import { EdgeEventReceiptEntity } from './entities/edge-event-receipt.entity';
import { RealtimeGateway } from './realtime.gateway';

export interface EdgeEventInput {
  edge_event_id: string;
  tenant_id: string;
  site_id: string;
  lane_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  direction?: 'IN' | 'OUT';
  clean_plate?: string;
  display_plate?: string;
}

@Injectable()
export class EdgeIngestionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EdgeIngestionService.name);
  private mqttClient: mqtt.MqttClient | null = null;

  constructor(
    @InjectRepository(EdgeEventReceiptEntity)
    private readonly receiptRepository: Repository<EdgeEventReceiptEntity>,
    @InjectRepository(EdgeDeviceHeartbeatEntity)
    private readonly heartbeatRepository: Repository<EdgeDeviceHeartbeatEntity>,
    @InjectRepository(ParkingSiteEntity)
    private readonly siteRepository: Repository<ParkingSiteEntity>,
    @InjectRepository(ParkingLaneEntity)
    private readonly laneRepository: Repository<ParkingLaneEntity>,
    private readonly recognitionService: RecognitionEventService,
    private readonly sessionService: ParkingSessionService,
    private readonly realtime: RealtimeGateway,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    const broker = this.config.get<string>('MQTT_BROKER');
    if (!broker) {
      this.logger.log('MQTT ingestion disabled: MQTT_BROKER is not configured');
      return;
    }
    const clientId = this.config.get<string>('MQTT_INGESTION_CLIENT_ID') ?? `spm-cloud-${process.pid}`;
    const username = this.config.get<string>('MQTT_USERNAME');
    const password = this.config.get<string>('MQTT_PASSWORD');
    this.mqttClient = mqtt.connect(broker, {
      clientId,
      clean: false,
      reconnectPeriod: 2000,
      username,
      password,
    });
    this.mqttClient.on('connect', () => {
      this.mqttClient?.subscribe('spm/+/+/lane/+/event/detected', { qos: 1 });
      this.mqttClient?.subscribe('spm/+/+/device/+/telemetry', { qos: 1 });
      this.logger.log('MQTT ingestion subscribed');
    });
    this.mqttClient.on('message', (topic, payload) => {
      void this.handleMqttTopic(topic, payload);
    });
  }

  onModuleDestroy() {
    this.mqttClient?.end(true);
  }

  private async handleMqttTopic(topic: string, payload: Buffer) {
    const parts = topic.split('/');
    if (parts.length < 6) return;
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(payload.toString('utf8')) as Record<string, unknown>;
    } catch {
      this.logger.warn(`Invalid MQTT JSON on ${topic}`);
      return;
    }
    const [, tenantId, siteId, , laneId, eventKind] = parts;
    if (topic.includes('/telemetry')) {
      if (typeof body.device_id !== 'string') body.device_id = laneId;
      await this.updateHeartbeat(tenantId, siteId, null, body);
      return;
    }
    if (parts[3] !== 'lane') return;
    const eventId = typeof body.edge_event_id === 'string' ? body.edge_event_id : null;
    if (!eventId) {
      this.logger.warn(`MQTT event without edge_event_id on ${topic}`);
      return;
    }
    await this.ingest({
      edge_event_id: eventId,
      tenant_id: tenantId,
      site_id: siteId,
      lane_id: laneId,
      event_type: typeof body.event_type === 'string' ? body.event_type : eventKind,
      payload: body,
      direction: body.direction === 'OUT' ? 'OUT' : body.direction === 'IN' ? 'IN' : undefined,
      clean_plate: typeof body.clean_plate === 'string' ? body.clean_plate : typeof body.plate === 'string' ? body.plate : undefined,
      display_plate: typeof body.display_plate === 'string' ? body.display_plate : undefined,
    });
  }

  async ingest(input: EdgeEventInput) {
    const existing = await this.receiptRepository.findOne({ where: { edge_event_id: input.edge_event_id } });
    if (existing) return { duplicate: true, receipt: existing };

    const site = await this.siteRepository.findOne({ where: { id: input.site_id, tenant_id: input.tenant_id } });
    if (!site) throw new ConflictException('Edge event site does not belong to tenant');
    const lane = await this.laneRepository.findOne({ where: { id: input.lane_id, site_id: input.site_id } });
    if (!lane) throw new ConflictException('Edge event lane does not belong to site');

    if (input.clean_plate && input.direction) {
      const plate = input.clean_plate.toUpperCase().replace(/[\s.-]/g, '');
      const recognition = await this.recognitionService.create({
        edge_event_id: input.edge_event_id,
        site_id: input.site_id,
        lane_id: input.lane_id,
        direction: input.direction,
        clean_plate: plate,
        display_plate: input.display_plate,
        confidence_score: Number(input.payload.confidence_score ?? input.payload.confidence ?? 0),
        detected_vehicle_type: typeof input.payload.detected_vehicle_type === 'string' ? input.payload.detected_vehicle_type : undefined,
        raw_image_url: typeof input.payload.raw_image_url === 'string' ? input.payload.raw_image_url : 'edge://offline/frame',
        cropped_plate_url: typeof input.payload.cropped_plate_url === 'string' ? input.payload.cropped_plate_url : 'edge://offline/plate',
        inference_time_ms: Number(input.payload.inference_time_ms ?? 0),
        ai_model_version: typeof input.payload.ai_model_version === 'string' ? input.payload.ai_model_version : 'EDGE-OFFLINE',
      }, input.tenant_id);

      if (input.direction === 'IN') {
        await this.sessionService.createEntry({
          site_id: input.site_id,
          lane_id: input.lane_id,
          clean_plate: plate,
          display_plate: input.display_plate ?? input.clean_plate,
          entry_image_url: 'edge://offline/frame',
          entry_plate_crop_url: 'edge://offline/plate',
          recognition_id: recognition.event.id,
          is_offline_event: true,
          entry_time: typeof input.payload.timestamp === 'string' ? input.payload.timestamp : undefined,
        }, input.tenant_id);
      } else {
        await this.sessionService.exitCheck({
          site_id: input.site_id,
          lane_id: input.lane_id,
          clean_plate: plate,
          display_plate: input.display_plate,
          exit_image_url: 'edge://offline/frame',
          exit_plate_crop_url: 'edge://offline/plate',
          recognition_id: recognition.event.id,
          exit_time: typeof input.payload.timestamp === 'string' ? input.payload.timestamp : undefined,
        }, input.tenant_id);
      }
    }

    this.realtime.emitSite(input.tenant_id, input.site_id, 'cabin.event', {
      type: 'EDGE_EVENT',
      edge_event_id: input.edge_event_id,
      event_type: input.event_type,
      lane_id: input.lane_id,
      direction: input.direction,
      clean_plate: input.clean_plate,
    });
    let receipt: EdgeEventReceiptEntity;
    try {
      receipt = await this.receiptRepository.save(this.receiptRepository.create({
        edge_event_id: input.edge_event_id,
        tenant_id: input.tenant_id,
        site_id: input.site_id,
        lane_id: input.lane_id,
        event_type: input.event_type,
        status: 'ACCEPTED',
        payload: input.payload,
      }));
    } catch (error) {
      const raced = await this.receiptRepository.findOne({ where: { edge_event_id: input.edge_event_id } });
      if (raced) return { duplicate: true, receipt: raced };
      throw error;
    }
    return { duplicate: false, receipt };
  }

  async updateHeartbeat(tenantId: string, siteId: string, laneId: string | null, payload: Record<string, unknown>) {
    const deviceId = typeof payload.device_id === 'string' ? payload.device_id : laneId;
    if (!deviceId) return null;
    const heartbeat = await this.heartbeatRepository.save(this.heartbeatRepository.create({
      device_id: deviceId,
      tenant_id: tenantId,
      site_id: siteId,
      lane_id: laneId,
      state: payload.state === 'OFFLINE' ? 'OFFLINE' : 'ONLINE',
      last_seen_at: new Date(),
      metadata: payload,
    }));
    this.realtime.emitSite(tenantId, siteId, 'cabin.event', {
      type: 'EDGE_HEARTBEAT',
      device_id: deviceId,
      state: heartbeat.state,
      last_seen_at: heartbeat.last_seen_at,
    });
    return heartbeat;
  }

  async findReceipts(tenantId: string, limit = 50) {
    return this.receiptRepository.find({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' },
      take: Math.min(limit, 100),
    });
  }

  async findHeartbeats(tenantId: string) {
    return this.heartbeatRepository.find({ where: { tenant_id: tenantId }, order: { last_seen_at: 'DESC' } });
  }
}
