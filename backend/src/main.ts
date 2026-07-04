import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // ─── Cookie Parser (Solution 4 : JWT HttpOnly cookies) ───────────────────
  app.use(cookieParser());

  // ─── CORS (autorise les cookies cross-origin) ─────────────────────────────
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ],
    credentials: true, // Obligatoire pour envoyer/recevoir les cookies
  });

  // ─── Validation globale ───────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ─── Prefix global ────────────────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ─── Swagger / OpenAPI ────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Keyora API')
    .setDescription('API de la plateforme immobilière Keyora')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('accessToken') // Documente l'auth par cookie dans Swagger
    .addTag('auth', 'Authentification et gestion des tokens')
    .addTag('listings', 'Annonces immobilières')
    .addTag('search', 'Recherche géographique')
    .addTag('alerts', "Zones d'alerte")
    .addTag('moderation', 'Modération des annonces')
    .addTag('messages', 'Messagerie interne')
    .addTag('blog', 'Blog éditorial')
    .addTag('dashboard', 'Tableaux de bord')
    .addTag('media', 'Gestion des médias')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`\n🚀 Keyora API démarrée sur http://localhost:${port}/api`);
  console.log(`📚 Swagger disponible sur http://localhost:${port}/api/docs\n`);
}
bootstrap();
