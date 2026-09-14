import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface LeaderboardEntryDto {
  rank: number;
  username: string;
  avatarUrl: string | null;
  solvedCount: number;
  avgAttempts: number;
}

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getLeaderboard(): Promise<LeaderboardEntryDto[]> {
    const solvedPairs = await this.prisma.attempt.groupBy({
      by: ['userId', 'challengeId'],
      where: { solved: true },
    });
    if (solvedPairs.length === 0) return [];

    const totalsPairs = await this.prisma.attempt.groupBy({
      by: ['userId', 'challengeId'],
      _count: { _all: true },
    });
    const totalByPair = new Map<string, number>();
    for (const t of totalsPairs) {
      totalByPair.set(`${t.userId}:${t.challengeId}`, t._count._all);
    }

    const byUser = new Map<number, { solvedCount: number; sum: number }>();
    for (const p of solvedPairs) {
      const total = totalByPair.get(`${p.userId}:${p.challengeId}`) ?? 0;
      const acc = byUser.get(p.userId) ?? { solvedCount: 0, sum: 0 };
      acc.solvedCount += 1;
      acc.sum += total;
      byUser.set(p.userId, acc);
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: [...byUser.keys()] } },
      select: { id: true, username: true, avatarMime: true },
    });
    const userById = new Map(users.map((u) => [u.id, u]));

    const entries: LeaderboardEntryDto[] = [];
    for (const [userId, acc] of byUser) {
      const user = userById.get(userId);
      if (!user) continue;
      entries.push({
        rank: 0,
        username: user.username,
        avatarUrl: user.avatarMime ? `/api/users/${user.id}/avatar` : null,
        solvedCount: acc.solvedCount,
        avgAttempts: acc.sum / acc.solvedCount,
      });
    }

    entries.sort((a, b) =>
      b.solvedCount !== a.solvedCount
        ? b.solvedCount - a.solvedCount
        : a.avgAttempts - b.avgAttempts,
    );

    return entries.map((e, i) => ({ ...e, rank: i + 1 }));
  }
}
