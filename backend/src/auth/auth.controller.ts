import { Controller, Post, Body, Get, Req, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

export class LoginDto {
  email: string;
  password: string;
}

export class GoogleAuthDto {
  googleToken: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 🔐 Login tradicional con email/password (SOLO para administradores)
  @Post('admin-login')
  async adminLogin(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateEmailPassword(
      loginDto.email, 
      loginDto.password
    );
    
    if (!user) {
      throw new HttpException(
        'Credenciales inválidas o usuario no es administrador', 
        HttpStatus.UNAUTHORIZED
      );
    }

    const token = await this.authService.generateJWT(user);
    
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
  }

  // Login con Google (para usuarios normales)
  @Post('google')
  async googleAuth(@Body() googleAuthDto: GoogleAuthDto) {
    try {
      // Aquí validarías el token de Google y extraerías la info del usuario
      const googleUser = await this.authService.validateGoogleToken(googleAuthDto.googleToken);
      
      const user = await this.authService.validateGoogleUser(googleUser);
      const token = await this.authService.generateJWT(user);
      
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
        },
        access_token: token,
      };
    } catch (error) {
      throw new HttpException(
        'Error en autenticación con Google', 
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Endpoint para verificar token actual
  @Get('verify')
  @UseGuards(JwtAuthGuard)
  async verify(@Req() req: any) {
    return {
      user: req.user,
      valid: true,
    };
  }

  // Logout
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout() {
    return { message: 'Logout exitoso' };
  }
} 