import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface LeaderboardEntryDto {
  rank: number;
  username: string;
  avatarUrl: string | null;
  solvedCount: number;
  avgAttempts: number;
}

interface Accumulator {
  username: string;
  avatarUrl: string | null;
  perChallenge: Map<number, { total: number; solved: boolean }>;
}

/**
 * Classifica: aggrega i tentativi per utente.
 * Ordine: solvedCount DESC, poi avgAttempts ASC a parità.
 */
@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getLeaderboard(): Promise<LeaderboardEntryDto[]> {
    const attempts = await this.prisma.attempt.findMany({ include: { user: true } });

    const byUser = new Map<number, Accumulator>();
    for (const a of attempts) {
      let acc = byUser.get(a.userId);
      if (!acc) {
        acc = {
          username: a.user.username,
          avatarUrl: a.user.avatarUrl,
          perChallenge: new Map(),
        };
        byUser.set(a.userId, acc);
      }
      const stats = acc.perChallenge.get(a.challengeId) ?? { total: 0, solved: false };
      stats.total += 1;
      if (a.solved) stats.solved = true;
      acc.perChallenge.set(a.challengeId, stats);
    }

    const entries: LeaderboardEntryDto[] = [];
    for (const acc of byUser.values()) {
      const solvedChallenges = [...acc.perChallenge.values()].filter((s) => s.solved);
      const solvedCount = solvedChallenges.length;
      if (solvedCount === 0) continue;

      const sum = solvedChallenges.reduce((t, s) => t + s.total, 0);
      entries.push({
        rank: 0,
        username: acc.username,
        avatarUrl: acc.avatarUrl,
        solvedCount,
        avgAttempts: sum / solvedCount,
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
