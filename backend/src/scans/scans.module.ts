import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScansService } from './scans.service';
import { ScansController } from './scans.controller';
import { ScansProcessor } from './scans.processor';

@Module({
    imports: [
        BullModule.registerQueue({
      name: 'scans',
    }),
  ],
  controllers: [ScansController],
  providers: [
    ScansService, 
    ScansProcessor 
  ],
})
export class ScansModule {}