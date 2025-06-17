import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // En desarrollo, simular usuario autenticado si no hay token
    if (process.env.NODE_ENV !== 'production') {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers.authorization;
      
      // Si no hay token de autorización, simular usuario de desarrollo
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // Usar el primer usuario de la base de datos como usuario de desarrollo
        request.user = {
          id: 'temp-dev-id', // Se actualizará dinámicamente
          email: 'dev@example.com',
          name: 'Usuario de Desarrollo',
          role: 'cliente',
          avatar: 'https://ui-avatars.com/api/?name=Usuario+Desarrollo&background=3b82f6&color=fff',
          googleId: 'google-dev-123',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        return true;
      }
    }
    
    // Si hay token, usar validación JWT normal
    const result = await super.canActivate(context);
    return result as boolean;
  }
} 