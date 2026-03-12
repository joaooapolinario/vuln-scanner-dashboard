import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;

  constructor(private readonly prisma: PrismaService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY não está configurada no .env');
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async getRemediation(tool: string, finding: string): Promise<string> {
    const cachedResponse = await this.prisma.aiCache.findUnique({
      where: { finding },
    });

    if (cachedResponse) {
      this.logger.log(`⚡ CACHE HIT: Retornando explicação salva para: "${finding.substring(0, 30)}..."`);
      return cachedResponse.explanation;
    }

    if (!this.genAI) {
      throw new InternalServerErrorException('IA não configurada no servidor.');
    }

    try {
      this.logger.log(`🤖 CACHE MISS: Solicitando análise de IA para: "${finding.substring(0, 30)}..."`);
      
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE, 
          },
        ]
      });

      const prompt = `
        Atue como um Engenheiro de Segurança de Aplicações (Blue Team/Defesa).
        Nossa ferramenta de auditoria interna (${tool}) encontrou a seguinte vulnerabilidade/alerta em nosso próprio sistema: "${finding}"
        
        Responda APENAS com a estrutura em Markdown abaixo, sem introduções ou saudações.
        Formate sua resposta EXATAMENTE com a seguinte estrutura em Markdown:
        Máximo de 2 frases curtas por seção.

        ### 🚨 O que é
        (Resumo de 1 a 2 linhas do problema)

        ### 💣 Risco
        (Nível de Risco: Baixo/Médio/Alto/Crítico - seguido de 1 linha do impacto real)

        ### 🛠️ Como resolver
        (O código direto ou a configuração exata para corrigir)
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) {
         return "O filtro de segurança da IA bloqueou a explicação dessa vulnerabilidade.";
      }

      await this.prisma.aiCache.create({
        data: {
          finding,
          explanation: text,
        },
      });
      
      return text;
    } catch (error) {
      this.logger.error(`Erro ao chamar Gemini API: ${error.message}`);
      throw new InternalServerErrorException('Falha ao processar análise com IA.');
    }
  }
}