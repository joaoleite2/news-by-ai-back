import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../redis/redis.service';

const DAILY_REQUEST_LIMIT = 2;
const EXPIRATION_SECONDS = 60 * 60 * 24;

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  constructor(private readonly redisService: RedisService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const redisClient = this.redisService.getClient();
    
    if (!redisClient) {
      throw new HttpException(
        'Serviço Redis não disponível',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const ip = req.ip;
    const key = `rate-limit:${ip}`;

    const currentRequests = await redisClient.get(key);
    const count = currentRequests ? parseInt(currentRequests, 10) : 0;

    if (count >= DAILY_REQUEST_LIMIT) {
      throw new HttpException(
        'Você atingiu o limite de 8 notícias por dia.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!currentRequests) {
      await redisClient.set(key, 1, { EX: EXPIRATION_SECONDS });
    } else {
      await redisClient.incr(key);
    }

    next();
  }
}