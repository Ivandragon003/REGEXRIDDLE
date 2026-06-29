import { Module } from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { ChallengesController } from './challenges.controller';
import { RegexService } from '../regex/regex.service';

@Module({
  controllers: [ChallengesController],
  providers: [ChallengesService, RegexService],
})
export class ChallengesModule {}
