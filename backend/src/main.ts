import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar CORS dinámicamente según el entorno
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:1420';
  const allowedOrigins =
    process.env.NODE_ENV === 'production'
      ? [frontendUrl, 'https://tauri.localhost']
      : [frontendUrl, 'http://localhost:1420', 'https://tauri.localhost'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Prefijo global para API
  app.setGlobalPrefix('api');

  // Puerto dinámico para Railway
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Servidor corriendo en puerto ${port}`);
  console.log(`🌐 CORS habilitado para: ${allowedOrigins.join(', ')}`);
  console.log(`🔗 API disponible en: http://localhost:${port}/api`);
}
bootstrap();
