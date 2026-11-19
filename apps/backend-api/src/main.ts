import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { runInitialSeed } from './database/seeds/initial-seed';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 8000);
  const prefix = configService.get<string>('API_PREFIX', 'api/v1');

  // Global Prefix
  app.setGlobalPrefix(prefix);

  // CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global Filters & Interceptors
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new TransformResponseInterceptor());

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Swagger OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SPM Enterprise API')
    .setDescription(
      'Hệ thống Quản lý Bãi đỗ xe Thông minh Toàn diện (Smart Parking Management) - Hybrid Cloud + Edge AI',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Authentication', 'Xác thực tài khoản, cấp phát và làm mới Token')
    .addTag('Users', 'Quản lý tài khoản người dùng và phân quyền')
    .addTag('Roles & Permissions', 'Danh mục vai trò và ma trận quyền RBAC')
    .addTag('Organizations (Tenants)', 'Quản lý doanh nghiệp thuê bao Multi-tenant')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Run Initial Database Seed (Development mode)
  try {
    const dataSource = app.get(DataSource);
    if (dataSource.isInitialized) {
      await runInitialSeed(dataSource);
    }
  } catch (err: any) {
    logger.warn(`Không thể chạy tự động Seeding (Có thể Database chưa bật): ${err.message}`);
  }

  await app.listen(port);
  logger.log(`🚀 SPM Backend API đang chạy tại: http://localhost:${port}/${prefix}`);
  logger.log(`📚 Swagger API Docs sẵn sàng tại: http://localhost:${port}/api/docs`);
}

bootstrap();
