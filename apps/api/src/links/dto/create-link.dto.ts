import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLinkDto {
  @ApiProperty({ example: 'uuid-of-product' })
  @IsUUID()
  product_id!: string;

  @ApiProperty({ example: 'uuid-of-campaign' })
  @IsUUID()
  campaign_id!: string;
}
