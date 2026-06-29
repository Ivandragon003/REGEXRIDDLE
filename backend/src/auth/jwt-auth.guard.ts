import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Protegge gli endpoint riservati agli utenti autenticati. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
