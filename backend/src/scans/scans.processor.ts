import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { spawn, ChildProcess } from 'child_process';
import { parseStringPromise } from 'xml2js';
import { ScansGateway } from './scans.gateway';
import * as fs from 'fs';
import * as path from 'path';

@Processor('scans')
export class ScansProcessor extends WorkerHost implements OnModuleDestroy {
  private readonly logger = new Logger(ScansProcessor.name);
  private readonly activeProcesses = new Map<string, ChildProcess>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly scansGateway: ScansGateway,
  ) {
    super();
  }

  async process(job: Job<{ scanId: string; target: string; type: string }>) {
    const { scanId, target, type } = job.data;
    const currentAttempt = job.attemptsMade + 1;
    const maxAttempts = job.opts.attempts || 1;

    this.logger.log(
      `[Job ${job.id} - Tentativa ${currentAttempt}/${maxAttempts}] Iniciando scan ${type} contra: ${target}`,
    );

    await this.prisma.scan.update({
      where: { id: scanId },
      data: { status: 'PROCESSING' },
    });

    this.scansGateway.emitScanUpdate(scanId, 'PROCESSING');

    try {
      let result: any;
      let summary: any = null;

      if (type === 'WEB') {
        result = await this.runNikto(target, scanId);
      } else {
        result = await this.runNmap(target, scanId);

        const openPorts: string[] = [];
        try {
          const ports = result?.nmaprun?.host?.[0]?.ports?.[0]?.port || [];
          ports.forEach((p: any) => {
            const portId = `${p.$.portid}/${p.$.protocol}`;
            if (p.state?.[0]?.$.state === 'open') {
              openPorts.push(portId);
            }
          });
        } catch {
          // Summary fallback silencioso
        }
        summary = { openPorts };
      }

      await this.prisma.scan.update({
        where: { id: scanId },
        data: {
          status: 'COMPLETED',
          result: result as any,
          summary: summary as any,
          finishedAt: new Date(),
        },
      });

      this.logger.log(`[Job ${job.id}] Scan finalizado com sucesso.`);
      this.scansGateway.emitScanUpdate(scanId, 'COMPLETED');
    } catch (error) {
      const hasMoreAttempts = currentAttempt < maxAttempts;

      this.logger.error(
        `[Job ${job.id}] Erro na tentativa ${currentAttempt}/${maxAttempts}: ${error.message}`,
      );

      if (hasMoreAttempts) {
        await this.prisma.scan.update({
          where: { id: scanId },
          data: {
            logs: `[Tentativa ${currentAttempt}/${maxAttempts}] Falha temporária: ${error.message}. Reprocessando...`,
          },
        });
      } else {
        await this.failScan(
          scanId,
          `[Falha após ${currentAttempt} tentativas]: ${error.message}`,
        );
        this.scansGateway.emitScanUpdate(scanId, 'FAILED');
      }

      // Propaga o erro para o BullMQ gerenciar o retry e backoff
      throw error;
    }
  }

  private async failScan(id: string, log: string) {
    await this.prisma.scan.update({
      where: { id },
      data: { status: 'FAILED', logs: log, finishedAt: new Date() },
    });
  }

  // --- ENGINE NMAP ---
  private runNmap(target: string, scanId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const nmap = spawn('nmap', ['-sV', '-T4', '-oX', '-', '--no-stylesheet', target]);
      this.activeProcesses.set(scanId, nmap);

      let stdout = '';
      let stderr = '';

      nmap.stdout.on('data', (d) => (stdout += d.toString()));
      nmap.stderr.on('data', (d) => (stderr += d.toString()));

      nmap.on('error', (err) => {
        this.activeProcesses.delete(scanId);
        reject(new Error(`Falha ao executar Nmap: ${err.message}`));
      });

      nmap.on('close', async (code) => {
        this.activeProcesses.delete(scanId);
        if (code !== 0) {
          return reject(new Error(`Nmap finalizou com erro (code ${code}): ${stderr}`));
        }
        try {
          const parsed = await parseStringPromise(stdout);
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Erro ao parsear XML do Nmap: ${e.message}`));
        }
      });
    });
  }

  // --- ENGINE NIKTO ---
  private runNikto(target: string, scanId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const tempFile = path.join('/tmp', `nikto_${scanId}.xml`);
      const nikto = spawn('nikto', [
        '-h',
        target,
        '-o',
        tempFile,
        '-Format',
        'xml',
        '-maxtime',
        '180s',
        '-Tuning',
        '123b',
      ]);

      this.activeProcesses.set(scanId, nikto);

      let stderrLog = '';
      nikto.stderr.on('data', (d) => (stderrLog += d.toString()));

      nikto.on('error', (err) => {
        this.activeProcesses.delete(scanId);
        this.logger.error(`Falha ao iniciar Nikto: ${err.message}`);
        reject(new Error(`O comando 'nikto' não foi encontrado ou falhou.`));
      });

      nikto.on('close', async (code) => {
        this.activeProcesses.delete(scanId);

        if (!fs.existsSync(tempFile)) {
          return reject(new Error(`Nikto falhou (code ${code}). Erro: ${stderrLog}`));
        }

        try {
          const fileContent = await fs.promises.readFile(tempFile, 'utf8');
          const xmlRaw = await parseStringPromise(fileContent);

          const scanDetails = xmlRaw?.niktoscan?.scandetails?.[0];
          if (!scanDetails) {
            throw new Error('Formato XML do Nikto inválido ou vazio.');
          }

          const rawItems = scanDetails.item || [];
          const vulnerabilities = rawItems.map((item: any) => ({
            id: item?.$?.id || '0',
            method: item?.$?.method || 'UNKNOWN',
            osvdb: item?.$?.osvdbid || '0',
            msg: item?.description?.[0] || 'Sem descrição',
            url: item?.uri?.[0] || '/',
          }));

          const cleanResult = {
            host: scanDetails?.$?.targethostname || target,
            ip: scanDetails?.$?.targetip,
            port: scanDetails?.$?.sitename,
            banner: scanDetails?.$?.banner || 'Banner não detectado',
            vulnerabilities,
          };

          resolve(cleanResult);
        } catch (e) {
          reject(new Error(`Erro ao processar XML do Nikto: ${e.message}`));
        } finally {
          if (fs.existsSync(tempFile)) {
            try {
              fs.unlinkSync(tempFile);
            } catch (err) {
              this.logger.error(`Erro ao deletar arquivo temporário: ${err.message}`);
            }
          }
        }
      });
    });
  }

  // --- PREVENÇÃO DE PROCESSOS ZUMBIS (ENCERRAMENTO LIMPO) ---
  onModuleDestroy() {
    if (this.activeProcesses.size > 0) {
      this.logger.warn(
        `Finalizando ${this.activeProcesses.size} processos filhos ativos devido ao shutdown...`,
      );
      for (const [scanId, proc] of this.activeProcesses.entries()) {
        try {
          if (proc && !proc.killed) {
            proc.kill('SIGTERM');
            this.logger.log(`Processo filho para scanId ${scanId} (PID: ${proc.pid}) finalizado.`);
          }
        } catch (err) {
          this.logger.error(`Erro ao finalizar processo PID ${proc.pid}: ${err.message}`);
        }
      }
      this.activeProcesses.clear();
    }
  }
}