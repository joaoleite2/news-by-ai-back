import { Injectable } from '@nestjs/common';
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

  async create(createNewsDto: CreateNewsDto) {
    const groundingTool = {
      googleSearch: {}
    }

    const config = {
      tools: [groundingTool],
    }
    
    try {
      console.log('Chave da API:', process.env.GEMINI_API_KEY ? 'Configurada' : 'Não configurada');
      
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "me traça uma notícia sobre o bayern de munich. notícia nova!",
        config,
      });
      console.log(response.text);
      
      return { success: true, response: response.text };
    } catch (error) {
      console.error('Erro ao gerar conteúdo:', error);
      throw new Error(`Erro na API do Gemini: ${error.message}`);
    }
  }

  findAll() {
    return `This action returns all news`;
  }

  findOne(id: number) {
    return `This action returns a #${id} news`;
  }

  update(id: number, updateNewsDto: UpdateNewsDto) {
    return `This action updates a #${id} news`;
  }

  remove(id: number) {
    return `This action removes a #${id} news`;
  }
}
