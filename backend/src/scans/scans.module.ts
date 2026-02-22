import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScansService } from './scans.service';
import { ScansController } from './scans.controller';
import { ScansProcessor } from './scans.processor';
import { ScansGateway } from './scans.gateway';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [
        PrismaModule,
        BullModule.registerQueue({
            name: 'scans',
        }),
    ],
    controllers: [ScansController],
    providers: [
        ScansService, 
        ScansProcessor, 
        ScansGateway
    ],
})
export class ScansModule {}