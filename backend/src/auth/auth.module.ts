import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const ms = Number(config.get('JWT_EXPIRATION') ?? 86400000);
        return {
          secret: config.get<string>('JWT_SECRET') ?? 'changeme',
          // jsonwebtoken usa i secondi quando expiresIn è numerico
          signOptions: { expiresIn: Math.floor(ms / 1000) },
        };
      },
    }),
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
