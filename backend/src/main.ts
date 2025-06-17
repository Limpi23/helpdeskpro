import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar CORS para producción
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://tu-dominio-frontend.railway.app'] // Cambiar por tu dominio real
        : ['http://localhost:1420', 'https://tauri.localhost'],
    credentials: true,
  });

  // Prefijo global para API
  app.setGlobalPrefix('api');

  // Puerto dinámico para Railway (importante!)
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Servidor corriendo en puerto ${port}`);
}
bootstrap();
