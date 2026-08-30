import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ScansService } from './scans.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateScanDto } from './dto/create-scan.dto';

@ApiTags('Scans')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('scans')
export class ScansController {
  constructor(private readonly scansService: ScansService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas globais do dashboard' })
  async getStats(@Request() req) {
    return this.scansService.getStats(req.user.sub);
  }

  @Post()
  @Roles(Role.ADMIN, Role.ANALYST)
  @ApiOperation({ summary: 'Iniciar uma nova varredura (Infra ou Web)' })
  async createScan(@Body() createScanDto: CreateScanDto, @Request() req) {
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

  @Delete(':id')
  @Roles(Role.ADMIN, Role.ANALYST)
  @ApiOperation({ summary: 'Excluir uma varredura específica' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.scansService.delete(id, req.user.sub);
  }

  @Post('bulk-delete')
  @Roles(Role.ADMIN, Role.ANALYST)
  @ApiOperation({ summary: 'Excluir múltiplas varreduras em lote' })
  async removeMany(@Body() body: { ids: string[] }, @Request() req) {
    return this.scansService.deleteMany(body.ids || [], req.user.sub);
  }
}