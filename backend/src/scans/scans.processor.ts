import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { spawn } from 'child_process';
import { parseStringPromise } from 'xml2js';
import { ScansGateway } from './scans.gateway';
import * as fs from 'fs';
import * as path from 'path';

@Processor('scans')
export class ScansProcessor extends WorkerHost {
  private readonly logger = new Logger(ScansProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scansGateway: ScansGateway,
  ) {
    super();
  }

  async process(job: Job<{ scanId: string; target: string; type: string }>) {
    const { scanId, target, type } = job.data;
    this.logger.log(`[Job ${job.id}] Iniciando scan ${type} contra: ${target}`);

    // Validação Básica (Sanitization)
    // Para WEB, permitimos : e / (ex: http://alvo.com)
    const isSafeTarget = /^[a-zA-Z0-9.:\/-]+$/.test(target);
    
    if (!isSafeTarget) {
      await this.failScan(scanId, `Alvo suspeito rejeitado: ${target}`);
      return;
    }

    await this.prisma.scan.update({
      where: { id: scanId },
      data: { status: 'PROCESSING' },
    });

    this.scansGateway.emitScanUpdate(scanId, 'PROCESSING');

    try {
      let result;

      if (type === 'WEB') {
        result = await this.runNikto(target, scanId);
      } else {
        result = await this.runNmap(target);
      }

      await this.prisma.scan.update({
        where: { id: scanId },
        data: {
          status: 'COMPLETED',
          result: result as any,
          finishedAt: new Date(),
        },
      });
      this.logger.log(`[Job ${job.id}] Scan finalizado.`);
      this.scansGateway.emitScanUpdate(scanId, 'COMPLETED');

    } catch (error) {
      this.logger.error(`[Job ${job.id}] Erro: ${error.message}`);
      await this.failScan(scanId, error.message);
      this.scansGateway.emitScanUpdate(scanId, 'FAILED');
    }
  }

  private async failScan(id: string, log: string) {
    await this.prisma.scan.update({
      where: { id },
      data: { status: 'FAILED', logs: log, finishedAt: new Date() },
    });
  }

  // --- ENGINE NMAP ---
  private runNmap(target: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const nmap = spawn('nmap', ['-sV', '-T4', '-oX', '-', '--no-stylesheet', target]);
      let stdout = '';
      let stderr = '';
      nmap.stdout.on('data', (d) => stdout += d.toString());
      nmap.stderr.on('data', (d) => stderr += d.toString());
      nmap.on('close', async (code) => {
        if (code !== 0) return reject(new Error(`Nmap error: ${stderr}`));
        try { resolve(await parseStringPromise(stdout)); } 
        catch (e) { reject(new Error(`XML Parse error: ${e.message}`)); }
      });
    });
  }

  // --- ENGINE NIKTO ---
  private runNikto(target: string, scanId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // MUDANÇA: Extensão .xml
      const tempFile = path.join('/tmp', `nikto_${scanId}.xml`);
      
      // MUDANÇA: Usamos -Format xml (universalmente suportado)
      // Removemos o -h e usamos apenas o target direto se preferir, ou mantemos -h
      // -Tuning 123b: Modo "Rápido" (apenas testes comuns)
      // -maxtime 180s: Limita o scan a 3 minutos (para não travar o servidor)
      // se for fazer varredura completa, remover o maxtime e o tuning
      const nikto = spawn('nikto', ['-h', target, '-o', tempFile, '-Format', 'xml', '-maxtime', '180s', '-Tuning', '123b']);

      let stderrLog = '';
      nikto.stderr.on('data', (d) => stderrLog += d.toString());

      nikto.on('error', (err) => {
        this.logger.error(`Falha CRÍTICA ao iniciar Nikto: ${err.message}`);
        reject(new Error(`O comando 'nikto' não foi encontrado.`));
      });

      nikto.on('close', async (code) => {
        if (!fs.existsSync(tempFile)) {
           // Se falhar e não gerar arquivo, rejeita
           return reject(new Error(`Nikto falhou. Erro: ${stderrLog}`));
        }

        try {
          const fileContent = fs.readFileSync(tempFile, 'utf8');
          
          // 1. Converte XML para Objeto JS Bruto
          const xmlRaw = await parseStringPromise(fileContent);
          
          // Limpa arquivo
          fs.unlinkSync(tempFile);

          // 2. Mapeamento (Adapter): Transforma o XML feio no JSON bonito que o Frontend espera
          // O XML do Nikto geralmente tem a estrutura: <niktoscan><scandetails><item>...</item></scandetails></niktoscan>
          
          const scanDetails = xmlRaw?.niktoscan?.scandetails?.[0];
          
          if (!scanDetails) {
             throw new Error("Formato XML do Nikto inválido ou vazio.");
          }

          const rawItems = scanDetails.item || [];

          // Mapeia as vulnerabilidades
          const vulnerabilities = rawItems.map((item: any) => ({
            id: item?.$?.id || "0",
            method: item?.$?.method || "UNKNOWN",
            osvdb: item?.$?.osvdbid || "0",
            msg: item?.description?.[0] || "Sem descrição",
            url: item?.uri?.[0] || "/"
          }));

          // Monta o objeto final limpo
          const cleanResult = {
            host: scanDetails?.$?.targethostname || target,
            ip: scanDetails?.$?.targetip,
            port: scanDetails?.$?.sitename, // Nikto põe porta/site aqui as vezes
            banner: scanDetails?.$?.banner || "Banner não detectado",
            vulnerabilities: vulnerabilities
          };

          resolve(cleanResult);

        } catch (e) {
          reject(new Error(`Erro ao processar XML do Nikto: ${e.message}`));
        }
      });
    });
  }
  
}