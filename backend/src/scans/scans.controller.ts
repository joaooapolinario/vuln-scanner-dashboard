import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ScansService } from './scans.service';
import { AuthGuard } from '../auth/auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateScanDto } from './dto/create-scan.dto';

@ApiTags('Scans')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('scans')
export class ScansController {
  constructor(private readonly scansService: ScansService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas globais do dashboard' })
  async getStats(@Request() req) {
    return this.scansService.getStats(req.user.sub)
  }

  @Post()
  @ApiOperation({ summary: 'Iniciar uma nova varredura (Infra ou Web)' })
  async createScan(
    @Body() createScanDto: CreateScanDto, 
    @Request() req
  ) {
    const userId = req.user.sub; 
    
    const { target, type } = createScanDto;
    
    const scanType = type || 'NETWORK';
    
    return this.scansService.create(target, scanType, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar histórico de varreduras' })
  async findAll(@Request() req) {
    return this.scansService.findAll(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar detalhes de uma varredura específica' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.scansService.findOne(id, req.user.sub);
  }
}