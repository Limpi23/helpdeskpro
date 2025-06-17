import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID', '618814668427-r5o2ctambfu95qv87m9qdfk9qjnei1vu.apps.googleusercontent.com'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET', 'GOCSPX-your-google-client-secret'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL', 'http://localhost:3001/api/auth/google/callback'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    console.log('🔍 Google Strategy - Validando perfil:', {
      id: profile.id,
      email: profile.emails?.[0]?.value,
      name: profile.displayName
    });

    const { id, name, emails, photos } = profile;

    const user = {
      googleId: id,
      email: emails?.[0]?.value || '',
      name: `${name?.givenName || ''} ${name?.familyName || ''}`.trim(),
      avatar: photos?.[0]?.value || '',
      accessToken,
    };

    try {
      console.log('👤 Google Strategy - Creando/validando usuario:', user.email);
      const validatedUser = await this.authService.validateGoogleUser(user);
      console.log('✅ Google Strategy - Usuario validado:', validatedUser.id);
      done(null, validatedUser);
    } catch (error) {
      console.error('❌ Google Strategy - Error:', error);
      done(error, false);
    }
  }
} 