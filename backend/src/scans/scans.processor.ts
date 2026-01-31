import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { spawn } from 'child_process';
import { parseStringPromise } from 'xml2js';

@Processor('scans')
export class ScansProcessor extends WorkerHost {
  private readonly logger = new Logger(ScansProcessor.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job<{ scanId: string; target: string }>) {
    const { scanId, target } = job.data;
    this.logger.log(`[Job ${job.id}] Iniciando Nmap contra: ${target}`);

    // 1. Validação de Segurança Básica (Sanitization)
    // Permite apenas letras, números, pontos, traços e underscores.
    const isSafeTarget = /^[a-zA-Z0-9.-]+$/.test(target);
    
    if (!isSafeTarget) {
      const errorMsg = `Alvo suspeito rejeitado: ${target}`;
      this.logger.warn(errorMsg);
      await this.prisma.scan.update({
        where: { id: scanId },
        data: { status: 'FAILED', logs: errorMsg, finishedAt: new Date() },
      });
      return;
    }

    // 2. Atualiza Status
    await this.prisma.scan.update({
      where: { id: scanId },
      data: { status: 'PROCESSING' },
    });

    try {
      const result = await this.runNmap(target);

      // 3. Sucesso: Salva o JSON convertido
      await this.prisma.scan.update({
        where: { id: scanId },
        data: {
          status: 'COMPLETED',
          result: result as any, // O Prisma aceita o objeto JSON direto
          finishedAt: new Date(),
        },
      });
      this.logger.log(`[Job ${job.id}] Scan finalizado com sucesso.`);

    } catch (error) {
      this.logger.error(`[Job ${job.id}] Falha no scan: ${error.message}`);
      await this.prisma.scan.update({
        where: { id: scanId },
        data: {
          status: 'FAILED',
          logs: error.message,
          finishedAt: new Date(),
        },
      });
    }
  }

  // Método privado para encapsular a complexidade do child_process
  private runNmap(target: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // Flags utilizadas:
      // -sV: Detecção de versão de serviços
      // -T4: Timing agressivo (mais rápido)
      // -oX -: Output em XML para o stdout (o traço significa stdout)
      // --no-stylesheet: Reduz lixo no XML
      const nmap = spawn('nmap', ['-sV', '-T4', '-oX', '-', '--no-stylesheet', target]);

      let stdoutData = '';
      let stderrData = '';

      // Coleta dados do fluxo de saída
      nmap.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      // Coleta erros (nota: Nmap imprime status no stderr as vezes, nem sempre é erro fatal)
      nmap.stderr.on('data', (data) => {
        stderrData += data.toString();
      });

      nmap.on('close', async (code) => {
        if (code !== 0) {
          return reject(new Error(`Nmap exited with code ${code}. Stderr: ${stderrData}`));
        }

        try {
          // Converte o XML do Nmap para objeto JavaScript (JSON)
          const result = await parseStringPromise(stdoutData);
          resolve(result);
        } catch (parseError) {
          reject(new Error(`Erro ao parsear XML do Nmap: ${parseError.message}`));
        }
      });

      nmap.on('error', (err) => {
        reject(new Error(`Falha ao iniciar processo Nmap: ${err.message}`));
      });
    });
  }
}