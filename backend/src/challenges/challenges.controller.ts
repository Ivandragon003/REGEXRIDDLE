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
import { ChallengesService } from './challenges.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { AttemptDto } from './dto/attempt.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';

@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challenges: ChallengesService) {}

  @Get()
  findAll() {
    return this.challenges.findAll();
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser() user: AuthUser) {
    return this.challenges.findMine(user.userId);
  }

  @Get('solved')
  @UseGuards(JwtAuthGuard)
  solved(@CurrentUser() user: AuthUser) {
    return this.challenges.getSolvedChallengeIds(user.userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.challenges.findOnePublic(id);
  }

  @Get(':id/leaderboard')
  challengeLeaderboard(@Param('id', ParseIntPipe) id: number) {
    return this.challenges.getChallengeLeaderboard(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  create(@Body() dto: CreateChallengeDto, @CurrentUser() user: AuthUser) {
    return this.challenges.create(dto, user.userId);
  }

  @Post(':id/attempts')
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  attempt(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AttemptDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.challenges.evaluateAttempt(id, dto.regex, user.userId);
  }

  @Get(':id/attempts')
  @UseGuards(JwtAuthGuard)
  attempts(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.challenges.findUserAttempts(id, user.userId);
  }
}
