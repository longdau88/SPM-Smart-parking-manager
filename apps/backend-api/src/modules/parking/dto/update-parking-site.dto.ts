import { PartialType } from '@nestjs/swagger';
import { CreateParkingSiteDto } from './create-parking-site.dto';

export class UpdateParkingSiteDto extends PartialType(CreateParkingSiteDto) {}
