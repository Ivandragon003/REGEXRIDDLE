import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

// Limite anti brute-force sugli endpoint di autenticazione:
// max 5 tentativi al minuto per IP (più stretto del limite globale).
@Throttle({ default: { limit: 5, ttl: 60_000 } })
@ApiTags('Autenticazione')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(201)
  @ApiOperation({ summary: 'Registra un nuovo utente e restituisce un token JWT' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Autentica un utente e restituisce un token JWT' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
