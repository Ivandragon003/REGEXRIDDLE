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
    this.regex.validateSyntax(dto.secretRegex);
    const regex = dto.secretRegex;

    await this.validateChallengeInputs(regex, dto);

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
    this.regex.validateSyntax(proposedRegex);

    const challenge = await this.requireChallenge(challengeId);

    if (challenge.authorId === userId) {
      throw new ForbiddenException('Non puoi tentare una sfida creata da te');
    }

    const alreadySolved = await this.prisma.attempt.findFirst({
      where: { challengeId, userId, solved: true },
    });
    if (alreadySolved) {
      throw new ForbiddenException('Hai già risolto questa sfida');
    }

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

  private async validateChallengeInputs(regex: string, dto: CreateChallengeDto): Promise<void> {
    const [exampleMatch, exampleNoMatch] = await this.regex.matchesAll(regex, [
      dto.exampleMatch,
      dto.exampleNoMatch,
    ]);
    if (!exampleMatch) {
      throw new BadRequestException("L'esempio positivo non soddisfa la regex segreta");
    }
    if (exampleNoMatch) {
      throw new BadRequestException("L'esempio negativo non dovrebbe soddisfare la regex segreta");
    }

    await this.validateControlStrings(regex, dto.controlStringsPositive, true);
    await this.validateControlStrings(regex, dto.controlStringsNegative, false);
  }

  private async validateControlStrings(
    regex: string,
    inputs: string[],
    shouldMatch: boolean,
  ): Promise<void> {
    const results = await this.regex.matchesAll(regex, inputs);
    const invalidIndex = results.findIndex((matches) => matches !== shouldMatch);
    if (invalidIndex === -1) return;

    const kind = shouldMatch ? 'positiva' : 'negativa';
    throw new BadRequestException(
      shouldMatch
        ? `La stringa di controllo ${kind} "${inputs[invalidIndex]}" non soddisfa la regex segreta`
        : `La stringa di controllo ${kind} "${inputs[invalidIndex]}" non dovrebbe soddisfare la regex segreta`,
    );
  }

  private async toPublicDtoList(list: ChallengeWithAuthor[]): Promise<ChallengePublicDto[]> {
    const counts = await this.countsFor(list.map((c) => c.id));
    return list.map((c) => {
      const k = counts.get(c.id);
      return this.toPublicDto(c, k?.total ?? 0, k?.solved ?? 0);
    });
  }

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
