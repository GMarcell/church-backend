import { RequestMethod } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptor/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.setGlobalPrefix('api', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });
  const port = Number(process.env.PORT ?? 3000);

  app.enableCors({
    origin: ['http://localhost:3001', 'https://your-frontend.com'],
    credentials: true,
  });

  await app.listen(port, '0.0.0.0');
}
bootstrap();
