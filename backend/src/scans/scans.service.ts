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
    // 1. Métricas Simples (Contagem no Banco)
    const totalScans = await this.prisma.scan.count();
    
    const uniqueTargetsGroup = await this.prisma.scan.groupBy({
      by: ['target'],
      _count: { target: true },
    });
    const uniqueTargets = uniqueTargetsGroup.length;

    // 2. Métrica Complexa (Top Portas - Processamento em Memória)
    // Buscamos apenas os resultados dos scans completados
    const completedScans = await this.prisma.scan.findMany({
      where: { status: 'COMPLETED', result: { not: Prisma.DbNull } },
      select: { result: true }, // Trazemos apenas o campo JSON
      take: 100, // Limite para não estourar memória em produção (MVP)
    });

    const portCounts: Record<string, number> = {};

    // Percorre cada scan, extrai as portas do JSON bagunçado e conta
    completedScans.forEach((scan) => {
      try {
        const resultAny = scan.result as any;
        // Navegação segura no JSON do Nmap
        const ports = resultAny?.nmaprun?.host?.[0]?.ports?.[0]?.port || [];
        
        ports.forEach((p: any) => {
          const portId = p.$.portid + '/' + p.$.protocol; // ex: "80/tcp"
          if (p.state?.[0]?.$.state === 'open') {
             portCounts[portId] = (portCounts[portId] || 0) + 1;
          }
        });
      } catch (e) {
        // Ignora JSON malformado
      }
    });

    // Transforma o objeto em array, ordena e pega os top 5
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
    // 1. Cria no banco vinculando ao usuário
    const scan = await this.prisma.scan.create({
      data: {
        target,
        type,
        status: 'PENDING',
        userId: userId,
      },
    });

    // 2. Fila...
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