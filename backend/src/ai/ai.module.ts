import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { PrismaModule } from '../prisma/prisma.module'
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [ PrismaModule, JwtModule ],
  providers: [AiService],
  controllers: [AiController]
})
export class AiModule {}
