import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParkingLaneEntity } from '../entities/parking-lane.entity';
import { CreateLaneDto } from '../dto/create-lane.dto';
import { LaneOperatingMode } from '@spm/shared-types';

@Injectable()
export class ParkingLaneService {
  constructor(
    @InjectRepository(ParkingLaneEntity)
    private readonly laneRepository: Repository<ParkingLaneEntity>,
  ) {}

  async createLane(siteId: string, dto: CreateLaneDto) {
    const existing = await this.laneRepository.findOne({
      where: { site_id: siteId, lane_code: dto.lane_code.toUpperCase() },
    });

    if (existing) {
      throw new ConflictException(`Mã làn '${dto.lane_code}' đã tồn tại trong bãi xe này`);
    }

    const lane = this.laneRepository.create({
      ...dto,
      site_id: siteId,
      lane_code: dto.lane_code.toUpperCase(),
      operating_mode: dto.operating_mode || 'AUTO_AI',
      is_active: true,
    });

    return this.laneRepository.save(lane);
  }

  async findBySite(siteId: string) {
    return this.laneRepository.find({
      where: { site_id: siteId },
      order: { lane_code: 'ASC' },
    });
  }

  async updateMode(laneId: string, mode: LaneOperatingMode) {
    const lane = await this.laneRepository.findOne({ where: { id: laneId } });
    if (!lane) {
      throw new NotFoundException('Không tìm thấy làn xe');
    }

    lane.operating_mode = mode;
    return this.laneRepository.save(lane);
  }
}
