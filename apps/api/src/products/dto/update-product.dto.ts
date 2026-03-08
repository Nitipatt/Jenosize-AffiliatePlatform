import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'New Product Title', description: 'The new title of the product' })
  @IsOptional()
  @IsString()
  title?: string;
}
