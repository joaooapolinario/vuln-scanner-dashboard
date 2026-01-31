import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ScansService } from './scans.service';
import { AuthGuard } from '../auth/auth.guard';


@Controller('scans')
export class ScansController {
  constructor(private readonly scansService: ScansService) {}

  @Get('stats')
  async getStats() {
    return this.scansService.getStats()
  }

  @UseGuards(AuthGuard)
  @Post()
  async createScan(@Body('target') target: string, @Request() req) {
    const userId = req.user.sub; 
    
    return this.scansService.create(target, userId);
  }

  @Get()
  async findAll() {
    return this.scansService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.scansService.findOne(id);
  }
}
