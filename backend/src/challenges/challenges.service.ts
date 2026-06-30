import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Attempt, Challenge, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegexService } from '../regex/regex.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';

export interface ChallengePublicDto {
  id: number;
  title: string;
  description: string | null;
  exampleMatch: string;
  exampleNoMatch: string;
  authorUsername: string | null;
  createdAt: Date;
  totalAttempts: number;
  solvedByCount: number;
}

export interface AttemptResultDto {
  proposedRegex: string;
  positiveMatched: number;
  totalPositive: number;
  negativeMatched: number;
  totalNegative: number;
  solved: boolean;
  attemptedAt: Date;
}

type ChallengeWithAuthor = Challenge & { author: User | null };

@Injectable()
export class ChallengesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly regex: RegexService,
  ) {}

  async create(dto: CreateChallengeDto, userId: number): Promise<ChallengePublicDto> {
    // 1. Sintassi della regex segreta
    this.regex.validateSyntax(dto.secretRegex);
    const regex = dto.secretRegex;

    // 2-3. Coerenza degli esempi pubblici
    if (!(await this.regex.matchesSafely(regex, dto.exampleMatch))) {
      throw new BadRequestException("L'esempio positivo non soddisfa la regex segreta");
    }
    if (await this.regex.matchesSafely(regex, dto.exampleNoMatch)) {
      throw new BadRequestException("L'esempio negativo non dovrebbe soddisfare la regex segreta");
    }

    // 5. Coerenza delle stringhe di controllo
    const posResults = await this.regex.matchesAll(regex, dto.controlStringsPositive);
    posResults.forEach((ok, i) => {
      if (!ok) {
        throw new BadRequestException(
          `La stringa di controllo positiva "${dto.controlStringsPositive[i]}" non soddisfa la regex segreta`,
        );
      }
    });
    const negResults = await this.regex.matchesAll(regex, dto.controlStringsNegative);
    negResults.forEach((ok, i) => {
      if (ok) {
        throw new BadRequestException(
          `La stringa di controllo negativa "${dto.controlStringsNegative[i]}" non dovrebbe soddisfare la regex segreta`,
        );
      }
    });

    const challenge = await this.prisma.challenge.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        secretRegex: regex,
        exampleMatch: dto.exampleMatch,
        exampleNoMatch: dto.exampleNoMatch,
        controlStringsPositive: dto.controlStringsPositive,
        controlStringsNegative: dto.controlStringsNegative,
        author: { connect: { id: userId } },
      },
      include: { author: true },
    });
    return this.toPublicDto(challenge, 0, 0);
  }

  async findAll(): Promise<ChallengePublicDto[]> {
    const list = await this.prisma.challenge.findMany({
      orderBy: { createdAt: 'desc' },
      include: { author: true },
    });
    return this.toPublicDtoList(list);
  }

  async findOnePublic(id: number): Promise<ChallengePublicDto> {
    const challenge = await this.requireChallenge(id);
    const counts = await this.countsFor([id]);
    const c = counts.get(id);
    return this.toPublicDto(challenge, c?.total ?? 0, c?.solved ?? 0);
  }

  async findMine(userId: number): Promise<ChallengePublicDto[]> {
    const list = await this.prisma.challenge.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      include: { author: true },
    });
    return this.toPublicDtoList(list);
  }

  async evaluateAttempt(
    challengeId: number,
    proposedRegex: string,
    userId: number,
  ): Promise<AttemptResultDto> {
    // 1. Sintassi del tentativo
    this.regex.validateSyntax(proposedRegex);

    // 2. Sfida esistente
    const challenge = await this.requireChallenge(challengeId);

    // L'autore non può tentare la propria sfida
    if (challenge.authorId === userId) {
      throw new ForbiddenException('Non puoi tentare una sfida creata da te');
    }

    // 3-4. Valutazione sulle stringhe di controllo segrete
    const positives = challenge.controlStringsPositive as unknown as string[];
    const negatives = challenge.controlStringsNegative as unknown as string[];
    const totalPositive = positives.length;
    const totalNegative = negatives.length;

    const posResults = await this.regex.matchesAll(proposedRegex, positives);
    const positiveMatched = posResults.filter((r) => r).length;
    const negResults = await this.regex.matchesAll(proposedRegex, negatives);
    const negativeMatched = negResults.filter((r) => !r).length;

    const solved = positiveMatched === totalPositive && negativeMatched === totalNegative;

    const attempt = await this.prisma.attempt.create({
      data: {
        proposedRegex,
        positiveMatched,
        negativeMatched,
        totalPositive,
        totalNegative,
        solved,
        user: { connect: { id: userId } },
        challenge: { connect: { id: challengeId } },
      },
    });
    return this.toResultDto(attempt);
  }

  /** Id delle sfide che l'utente ha già risolto (almeno un tentativo risolutivo). */
  async getSolvedChallengeIds(userId: number): Promise<number[]> {
    const rows = await this.prisma.attempt.findMany({
      where: { userId, solved: true },
      distinct: ['challengeId'],
      select: { challengeId: true },
    });
    return rows.map((r) => r.challengeId);
  }

  async findUserAttempts(challengeId: number, userId: number): Promise<AttemptResultDto[]> {
    await this.requireChallenge(challengeId);
    const list = await this.prisma.attempt.findMany({
      where: { challengeId, userId },
      orderBy: { attemptedAt: 'desc' },
    });
    return list.map((a) => this.toResultDto(a));
  }

  private async requireChallenge(id: number): Promise<ChallengeWithAuthor> {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id },
      include: { author: true },
    });
    if (!challenge) {
      throw new NotFoundException('Sfida non trovata');
    }
    return challenge;
  }

  /**
   * Mappa una lista di sfide nei rispettivi DTO pubblici aggregando i conteggi
   * dei tentativi con un numero costante di query (anziché 2 per sfida).
   */
  private async toPublicDtoList(list: ChallengeWithAuthor[]): Promise<ChallengePublicDto[]> {
    const counts = await this.countsFor(list.map((c) => c.id));
    return list.map((c) => {
      const k = counts.get(c.id);
      return this.toPublicDto(c, k?.total ?? 0, k?.solved ?? 0);
    });
  }

  /**
   * Conteggi (totali e risolutivi) dei tentativi per le sfide indicate, calcolati
   * lato database con due sole query di aggregazione (GROUP BY) indipendentemente
   * dal numero di sfide.
   */
  private async countsFor(
    challengeIds: number[],
  ): Promise<Map<number, { total: number; solved: number }>> {
    const map = new Map<number, { total: number; solved: number }>();
    if (challengeIds.length === 0) return map;
    for (const id of challengeIds) map.set(id, { total: 0, solved: 0 });

    const totals = await this.prisma.attempt.groupBy({
      by: ['challengeId'],
      where: { challengeId: { in: challengeIds } },
      _count: { _all: true },
    });
    for (const t of totals) {
      const entry = map.get(t.challengeId);
      if (entry) entry.total = t._count._all;
    }

    const solved = await this.prisma.attempt.groupBy({
      by: ['challengeId'],
      where: { challengeId: { in: challengeIds }, solved: true },
      _count: { _all: true },
    });
    for (const s of solved) {
      const entry = map.get(s.challengeId);
      if (entry) entry.solved = s._count._all;
    }
    return map;
  }

  private toPublicDto(
    c: ChallengeWithAuthor,
    totalAttempts: number,
    solvedByCount: number,
  ): ChallengePublicDto {
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      exampleMatch: c.exampleMatch,
      exampleNoMatch: c.exampleNoMatch,
      authorUsername: c.author ? c.author.username : null,
      createdAt: c.createdAt,
      totalAttempts,
      solvedByCount,
    };
  }

  private toResultDto(a: Attempt): AttemptResultDto {
    return {
      proposedRegex: a.proposedRegex,
      positiveMatched: a.positiveMatched,
      totalPositive: a.totalPositive,
      negativeMatched: a.negativeMatched,
      totalNegative: a.totalNegative,
      solved: a.solved,
      attemptedAt: a.attemptedAt,
    };
  }
}
