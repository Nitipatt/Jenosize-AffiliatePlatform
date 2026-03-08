import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { LinksService } from './links.service';
import { CreateLinkDto } from './dto/create-link.dto';

@ApiTags('Links')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate affiliate link for campaign' })
  @ApiResponse({ status: 201, description: 'Link generated successfully' })
  async create(@Body() dto: CreateLinkDto) {
    return this.linksService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all links' })
  @ApiResponse({ status: 200, description: 'List of links' })
  async findAll() {
    return this.linksService.findAll();
  }
}
