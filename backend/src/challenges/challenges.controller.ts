import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChallengesService } from './challenges.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { AttemptDto } from './dto/attempt.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';

@ApiTags('Sfide')
@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challenges: ChallengesService) {}

  @Get()
  @ApiOperation({ summary: 'Elenca tutte le sfide pubblicate' })
  findAll() {
    return this.challenges.findAll();
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Elenca le sfide create dall\'utente autenticato' })
  findMine(@CurrentUser() user: AuthUser) {
    return this.challenges.findMine(user.userId);
  }

  @Get('solved')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Id delle sfide già risolte dall\'utente autenticato' })
  solved(@CurrentUser() user: AuthUser) {
    return this.challenges.getSolvedChallengeIds(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Dettaglio pubblico di una singola sfida' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.challenges.findOnePublic(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiOperation({ summary: 'Crea una nuova sfida' })
  create(@Body() dto: CreateChallengeDto, @CurrentUser() user: AuthUser) {
    return this.challenges.create(dto, user.userId);
  }

  @Post(':id/attempts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiOperation({ summary: 'Invia un tentativo di soluzione per una sfida' })
  attempt(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AttemptDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.challenges.evaluateAttempt(id, dto.regex, user.userId);
  }

  @Get(':id/attempts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Storico dei tentativi dell\'utente autenticato su una sfida' })
  attempts(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.challenges.findUserAttempts(id, user.userId);
  }
}
