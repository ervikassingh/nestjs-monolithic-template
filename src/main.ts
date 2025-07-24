import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';

import { AllExceptionsFilter } from './common/filters/exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
// import { MyLoggerService } from './my-logger/my-logger.service';

import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
  app.useGlobalInterceptors(new LoggingInterceptor());
  // app.useLogger(app.get(MyLoggerService));

  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Nest Starter App')
    .setDescription('A starter application using NestJS')
    .setVersion('1.0.1')
    .addBasicAuth()
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
