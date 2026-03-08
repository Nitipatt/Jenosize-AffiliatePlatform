import { IsString, IsUrl, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiPropertyOptional({
    description: 'Shopee or Lazada product URL (Legacy single-URL support)',
    example: 'https://shopee.co.th/product/123/456',
  })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'source_url must be a valid URL' })
  source_url?: string;

  @ApiPropertyOptional({
    description: 'Shopee product URL for dual-platform comparison',
    example: 'https://shopee.co.th/product/123/456',
  })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'shopee_url must be a valid URL' })
  shopee_url?: string;

  @ApiPropertyOptional({
    description: 'Lazada product URL for dual-platform comparison',
    example: 'https://www.lazada.co.th/products/item-123.html',
  })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'lazada_url must be a valid URL' })
  lazada_url?: string;
}
