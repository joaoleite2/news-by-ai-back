import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { GoogleGenAI } from "@google/genai";

@Injectable()
export class NewsService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não está configurada no ambiente');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateNews(createNewsDto: CreateNewsDto) {
    const groundingTool = {
      googleSearch: {}
    }

    const config = {
      tools: [groundingTool],
    }
    
    console.log('Chave da API:', process.env.GEMINI_API_KEY ? 'Configurada' : 'Não configurada');
    const prompt = process.env.GEMINI_IGNITION_PROMPT;
    if(!prompt) throw new BadRequestException('Prompt não configurado');

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: JSON.stringify(createNewsDto),
        config: {
          ...config,
          systemInstruction: prompt,
          thinkingConfig: {
            thinkingBudget: -1
          }
        },
      });
      console.log('Busca feita com sucesso');
      return response.text || '';
    } catch (error) {
      console.error('Erro ao gerar conteúdo:', error);
      return false;
    }
  }

  verifyIfNewsIsJson(news: string) {
    try{
      const json = JSON.parse(news);
      console.log('Reconhecido como JSON');
      return json;
    } catch (error) {
      console.log('Não foi reconhecido como JSON');
      return false;
    }
  }
  
  async transformNewsToJson(news: string) {
    const jsonText: string | undefined = news?.split('```json')[1]?.split('```')[0];
    jsonText && console.log('possível bloco json encontrado');
    if(!jsonText) return false;
    const isJson = this.verifyIfNewsIsJson(jsonText);
    if(!isJson) return false;
    return isJson;
  }
  
  async create(createNewsDto: CreateNewsDto) {
    try {
      for(let i = 0; i < 4; i++) {
        const news = await this.generateNews(createNewsDto);
        if(news) {
          const newsJson = await this.transformNewsToJson(news);
          if(newsJson) return newsJson;
        };
        console.log('Tentativa:', i + 1);
      }
      throw new NotFoundException('Não foi possível gerar uma notícia válida');
    } catch (error) {
      console.error('Erro ao gerar conteúdo:', error);
      throw new Error(`Erro na API do Gemini: ${error.message}`);
    }
  }
}
