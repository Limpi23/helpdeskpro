import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../../entities/user.entity';
import * as bcrypt from 'bcrypt';

interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
  avatar: string;
  accessToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateGoogleUser(googleUser: GoogleUser): Promise<User> {
    // Buscar usuario existente por email o Google ID
    let user = await this.usersService.findByEmail(googleUser.email);
    
    if (!user) {
      // Crear nuevo usuario si no existe
      user = await this.usersService.create({
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.avatar,
        googleId: googleUser.googleId,
        role: UserRole.CLIENTE,
      });
    } else if (!user.googleId) {
      // Actualizar usuario existente con Google ID
      user.googleId = googleUser.googleId;
      user.avatar = googleUser.avatar;
      await this.usersService.update(user.id, user);
    }

    return user;
  }

  async generateJwtToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.usersService.findById(userId);
  }

  async createUser(userData: Partial<User>): Promise<User> {
    return this.usersService.create(userData);
  }

  // 🔐 Validar login de administrador con email/password
  async validateAdminUser(email: string, password: string): Promise<User | null> {
    console.log('🔐 Validando credenciales de admin:', email);

    try {
      // Buscar usuario por email
      const user = await this.usersService.findByEmailWithPassword(email);

      if (!user) {
        console.log('❌ Usuario no encontrado:', email);
        return null;
      }

      // Verificar que sea administrador
      if (user.role !== UserRole.ADMIN) {
        console.log('❌ Usuario no es administrador:', email);
        return null;
      }

      // Verificar que esté activo
      if (!user.isActive) {
        console.log('❌ Usuario administrador inactivo:', email);
        return null;
      }

      // Verificar password
      if (!user.password) {
        console.log('❌ Administrador sin password configurada:', email);
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        console.log('❌ Password incorrecta para admin:', email);
        return null;
      }

      console.log('✅ Validación de admin exitosa:', email);

      // Remover password del objeto antes de retornar
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword as User;

    } catch (error) {
      console.error('❌ Error validando admin:', error);
      return null;
    }
  }
} 