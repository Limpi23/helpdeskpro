import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { User } from '../../entities/user.entity';

// DTOs para validación
export class AdminLoginDto {
  email: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // 🔐 Login de administrador con email/password
  @Post('admin-login')
  async adminLogin(@Body() adminLoginDto: AdminLoginDto) {
    console.log('🔐 Intento de login admin para:', adminLoginDto.email);
    
    try {
      const user = await this.authService.validateAdminUser(
        adminLoginDto.email,
        adminLoginDto.password
      );

      if (!user) {
        throw new HttpException(
          'Credenciales inválidas',
          HttpStatus.UNAUTHORIZED
        );
      }

      const token = await this.authService.generateJwtToken(user);

      console.log('✅ Login admin exitoso para:', adminLoginDto.email);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
        },
        access_token: token,
        message: 'Login de administrador exitoso'
      };
    } catch (error) {
      console.error('❌ Error en login admin:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Error interno del servidor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Inicia el flujo de autenticación de Google
    console.log('🚀 Iniciando autenticación con Google...');
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    try {
      console.log('🔄 Google callback ejecutado');
      console.log('👤 Usuario recibido:', req.user);

      const user = req.user as User;
      if (!user) {
        console.error('❌ No se recibió usuario de Google');
        return res.redirect(
          `${this.configService.get<string>(
            'FRONTEND_URL',
            'http://localhost:1420',
          )}/login?error=no_user`,
        );
      }

      const token = await this.authService.generateJwtToken(user);
      console.log(
        '🎫 Token generado exitosamente:',
        token.substring(0, 20) + '...',
      );

      // Redirigir al frontend con el token
      const frontendUrl = this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:1420',
      );
      const redirectUrl = `${frontendUrl}/login?token=${token}`;

      console.log('🔀 Redirigiendo a:', redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('❌ Error en callback de Google:', error);
      const frontendUrl = this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:1420',
      );
      res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Req() req: Request) {
    console.log('📋 Solicitando perfil para usuario:', req.user);
    return req.user;
  }

  @Post('logout')
  logout() {
    console.log('👋 Usuario cerrando sesión');
    return { message: 'Logout successful' };
  }

  // Endpoint para validar token desde el frontend
  @Post('validate')
  @UseGuards(AuthGuard('jwt'))
  validateToken(@Req() req: Request) {
    console.log('✅ Validando token para usuario:', req.user);
    return {
      valid: true,
      user: req.user,
    };
  }
} 