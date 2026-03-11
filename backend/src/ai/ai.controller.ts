import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { AuthGuard } from '../auth/auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RemediateDto } from './dto/remediate.dto';

@ApiTags('Inteligência Artificial')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('remediate')
  @ApiOperation({ summary: 'Gera uma explicação e correção para uma vulnerabilidade usando IA' })
  async remediate(@Body() body: RemediateDto) {
    const explanation = await this.aiService.getRemediation(body.tool, body.finding);
    return {
      success: true,
      data: explanation,
    };
  }
}