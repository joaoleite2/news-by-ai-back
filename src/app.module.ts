import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { NewsModule } from './news/news.module';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './redis/redis.module';
import { RateLimiterMiddleware } from './middleware/rate-limiter.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    NewsModule,
    // Comente `RedisModule` para desabilitar o rate limiter
    RedisModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Comente o `consumer` para desabilitar o rate limiter
    consumer
      .apply(RateLimiterMiddleware)
      .forRoutes('news');
  }
}

