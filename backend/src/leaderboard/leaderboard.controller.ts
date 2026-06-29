import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LeaderboardService } from './leaderboard.service';

@ApiTags('Classifica')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  @Get()
  @ApiOperation({ summary: 'Classifica ordinata per sfide risolte e media tentativi' })
  get() {
    return this.leaderboard.getLeaderboard();
  }
}
