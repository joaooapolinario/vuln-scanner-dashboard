import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [ PrismaModule ],
  providers: [AiService],
  controllers: [AiController]
})
export class AiModule {}
