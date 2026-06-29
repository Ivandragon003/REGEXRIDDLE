import { Injectable } from '@nestjs/common';
import { Attempt } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface UserStats {
  solvedCount: number;
  totalAttempts: number;
  avgAttempts: number;
}

/**
 * Calcola le statistiche di un utente a partire dai suoi tentativi.
 * avgAttempts = media, sulle sole sfide risolte, del numero totale di tentativi
 * effettuati su ciascuna sfida (inclusi quelli falliti).
 */
@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async computeFor(userId: number): Promise<UserStats> {
    const attempts = await this.prisma.attempt.findMany({ where: { userId } });
    return StatsService.aggregate(attempts);
  }

  static aggregate(attempts: Attempt[]): UserStats {
    const totalAttempts = attempts.length;

    const byChallenge = new Map<number, Attempt[]>();
    for (const a of attempts) {
      const list = byChallenge.get(a.challengeId) ?? [];
      list.push(a);
      byChallenge.set(a.challengeId, list);
    }

    const solvedGroups = [...byChallenge.values()].filter((group) =>
      group.some((a) => a.solved),
    );
    const solvedCount = solvedGroups.length;

    let avgAttempts = 0;
    if (solvedCount > 0) {
      const sum = solvedGroups.reduce((acc, g) => acc + g.length, 0);
      avgAttempts = sum / solvedCount;
    }

    return { solvedCount, totalAttempts, avgAttempts };
  }
}
