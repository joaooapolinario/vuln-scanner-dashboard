import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'; // <-- Novos imports aqui

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY não está configurada no .env');
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async getRemediation(tool: string, finding: string): Promise<string> {
    if (!this.genAI) {
      throw new InternalServerErrorException('IA não configurada no servidor.');
    }

    try {
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
        
        Sua tarefa é explicar isso para nossa equipe interna de desenvolvedores para que possamos corrigir.
        Formate sua resposta EXATAMENTE com a seguinte estrutura em Markdown:

        ### 🚨 O que é isso?
        (Explicação simples e técnica do problema)

        ### 💣 Risco
        (O que um atacante pode fazer com isso. Ex: Baixo, Médio, Alto, Crítico)

        ### 🛠️ Como corrigir
        (Exemplos práticos de código ou configuração para resolver o problema)
      `;

      this.logger.log(`Solicitando análise de IA para: ${finding.substring(0, 30)}...`);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      const text = response.text();

      if (!text) {
         this.logger.warn('IA retornou vazio. Motivo:', JSON.stringify(response.candidates?.[0]?.finishReason));
         return "O filtro de segurança da IA bloqueou a explicação dessa vulnerabilidade.";
      }
      
      return text;
    } catch (error) {
      this.logger.error(`Erro ao chamar Gemini API: ${error.message}`);
      throw new InternalServerErrorException('Falha ao processar análise com IA.');
    }
  }
}