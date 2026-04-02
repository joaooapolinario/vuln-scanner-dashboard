import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ScanType } from '@prisma/client';

@Injectable()
export class ScansService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('scans') private readonly scanQueue: Queue,

  ) {}

  async getStats() {
    const totalScans = await this.prisma.scan.count();
    
    const uniqueTargetsGroup = await this.prisma.scan.groupBy({
      by: ['target'],
      _count: { target: true },
    });
    const uniqueTargets = uniqueTargetsGroup.length;

    const completedScans = await this.prisma.scan.findMany({
      where: { status: 'COMPLETED', type: 'NETWORK', summary: { not: Prisma.DbNull } },
      select: { summary: true }, 
      take: 1000, 
    });

    const portCounts: Record<string, number> = {};

    completedScans.forEach((scan) => {
      const summary = scan.summary as any;
      if (summary?.openPorts) {
        summary.openPorts.forEach((port: string) => {
          portCounts[port] = (portCounts[port] || 0) + 1;
        });
      }
    });

    const topPorts = Object.entries(portCounts)
      .map(([port, count]) => ({ port, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalScans,
      uniqueTargets,
      topPorts,
    };
  }

  async create(target: string, type: ScanType, userId?: string) {
    const scan = await this.prisma.scan.create({
      data: {
        target,
        type,
        status: 'PENDING',
        userId: userId,
      },
    });

    await this.scanQueue.add('perform-nmap-scan', {
      scanId: scan.id,
      target: scan.target,
      type: scan.type
    });

    return scan;
  }

  async findAll() {
    return this.prisma.scan.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.scan.findUnique({
      where: { id },
    });
  }
}