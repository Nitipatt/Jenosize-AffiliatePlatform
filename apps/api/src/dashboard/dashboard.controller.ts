import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { DashboardService } from './dashboard.service';


@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Return click stats by campaign/product' })
  @ApiResponse({ status: 200, description: 'Analytics dashboard data' })
  async getStats() {
    return this.dashboardService.getStats();
  }
}
