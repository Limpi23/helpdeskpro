import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../entities/user.entity';

export interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateGoogleUser(googleUser: GoogleUser): Promise<User> {
    console.log('🔍 Validando usuario de Google:', googleUser.email);

    // 1. Buscar por googleId (usuario existente con Google auth)
    let user = await this.userRepository.findOne({
      where: { googleId: googleUser.googleId }
    });

    if (user) {
      console.log('✅ Usuario encontrado por Google ID:', user.email);
      return user;
    }

    // 2. Buscar por email (usuario creado manualmente, ej: admin)
    user = await this.userRepository.findOne({
      where: { email: googleUser.email }
    });

    if (user) {
      console.log('🔗 Usuario encontrado por email, vinculando con Google:', user.email);
      
      // Vincular la cuenta de Google con el usuario existente
      user.googleId = googleUser.googleId;
      if (googleUser.avatar) {
        user.avatar = user.avatar || googleUser.avatar;
      }
      user.name = user.name || googleUser.name;
      
      await this.userRepository.save(user);
      console.log('✅ Cuenta vinculada exitosamente');
      return user;
    }

    // 3. Crear nuevo usuario (primer login con Google)
    console.log('👤 Creando nuevo usuario desde Google:', googleUser.email);
    
    const newUser = this.userRepository.create({
      googleId: googleUser.googleId,
      email: googleUser.email,
      name: googleUser.name,
      avatar: googleUser.avatar,
      role: UserRole.CLIENTE, // Por defecto es cliente
      isActive: true,
    });

    const savedUser = await this.userRepository.save(newUser);
    console.log('✅ Nuevo usuario creado:', savedUser.email);
    
    return savedUser;
  }

  // 🔐 Login con email/password SOLO para administradores
  async validateEmailPassword(email: string, password: string): Promise<User | null> {
    console.log('🔐 Validando login email/password para:', email);

    // Buscar usuario incluyendo password (que normalmente está oculta)
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .getOne();

    if (!user) {
      console.log('❌ Usuario no encontrado:', email);
      return null;
    }

    // 🛡️ IMPORTANTE: Solo admins pueden usar login email/password
    if (user.role !== UserRole.ADMIN) {
      console.log('❌ Login email/password negado - usuario no es admin:', email);
      return null;
    }

    // Verificar password
    if (!user.password) {
      console.log('❌ Usuario admin sin password configurada:', email);
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('❌ Password incorrecta para:', email);
      return null;
    }

    console.log('✅ Login admin exitoso:', email);
    
    // Remover password del objeto antes de retornar y crear nuevo objeto sin password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  async generateJWT(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
    
    return this.jwtService.sign(payload);
  }

  async validateUser(email: string, googleId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: [
        { email, googleId },
        { email }
      ]
    });
  }

  // Función para hashear passwords (usada en scripts)
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  // Placeholder para validar token de Google
  async validateGoogleToken(token: string): Promise<GoogleUser> {
    // TODO: Implementar validación real del token de Google
    throw new Error('Método no implementado - usar OAuth flow completo');
  }
} 