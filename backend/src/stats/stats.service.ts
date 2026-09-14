import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface UserStats {
  solvedCount: number;
  totalAttempts: number;
  avgAttempts: number;
}

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async computeFor(userId: number): Promise<UserStats> {
    const totalAttempts = await this.prisma.attempt.count({ where: { userId } });

    const solvedChallenges = await this.prisma.attempt.groupBy({
      by: ['challengeId'],
      where: { userId, solved: true },
    });
    const solvedIds = solvedChallenges.map((r) => r.challengeId);
    const solvedCount = solvedIds.length;

    let avgAttempts = 0;
    if (solvedCount > 0) {
      const perChallenge = await this.prisma.attempt.groupBy({
        by: ['challengeId'],
        where: { userId, challengeId: { in: solvedIds } },
        _count: { _all: true },
      });
      const sum = perChallenge.reduce((acc, r) => acc + r._count._all, 0);
      avgAttempts = sum / solvedCount;
    }

    return { solvedCount, totalAttempts, avgAttempts };
  }
}
