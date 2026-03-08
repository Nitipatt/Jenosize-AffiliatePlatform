import { IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCampaignDto {
  @ApiProperty({ example: 'Summer Deal 2025' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'summer-deal-2025' })
  @IsString()
  utm_campaign!: string;

  @ApiProperty({ example: '2025-06-01T00:00:00.000Z' })
  @IsDateString()
  start_at!: string;

  @ApiProperty({ example: '2025-08-31T23:59:59.000Z' })
  @IsDateString()
  end_at!: string;
}
