import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StatsService } from '../stats/stats.service';
import { UpdateUserDto } from './dto/update-user.dto';

export interface UserProfileDto {
  username: string;
  email: string;
  avatarUrl: string | null;
  solvedCount: number;
  createdChallengesCount: number;
  totalAttempts: number;
  avgAttempts: number;
}

export interface PublicUserDto {
  username: string;
  avatarUrl: string | null;
  solvedCount: number;
  createdChallengesCount: number;
}

const AVATAR_DIR = join(process.cwd(), 'uploads', 'avatars');
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stats: StatsService,
  ) {}

  async getMe(userId: number): Promise<UserProfileDto> {
    const user = await this.requireById(userId);
    const stats = await this.stats.computeFor(user.id);
    const createdChallengesCount = await this.prisma.challenge.count({
      where: { authorId: user.id },
    });
    return {
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      solvedCount: stats.solvedCount,
      createdChallengesCount,
      totalAttempts: stats.totalAttempts,
      avgAttempts: stats.avgAttempts,
    };
  }

  async updateMe(userId: number, dto: UpdateUserDto): Promise<UserProfileDto> {
    const user = await this.requireById(userId);

    if (dto.username && dto.username !== user.username) {
      if (await this.prisma.user.findUnique({ where: { username: dto.username } })) {
        throw new ConflictException('Username già in uso');
      }
    }
    if (dto.email && dto.email !== user.email) {
      if (await this.prisma.user.findUnique({ where: { email: dto.email } })) {
        throw new ConflictException('Email già in uso');
      }
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        username: dto.username ?? undefined,
        email: dto.email ?? undefined,
      },
    });
    return this.getMe(user.id);
  }

  async uploadAvatar(
    userId: number,
    file: Express.Multer.File,
  ): Promise<{ avatarUrl: string }> {
    const user = await this.requireById(userId);
    if (!file) {
      throw new BadRequestException('Nessun file caricato');
    }
    const ext = ALLOWED_TYPES[file.mimetype];
    if (!ext) {
      throw new BadRequestException('Formato non supportato (ammessi: JPEG, PNG, GIF)');
    }

    await fs.mkdir(AVATAR_DIR, { recursive: true });
    const filename = `${user.id}_${randomUUID()}${ext}`;
    await fs.writeFile(join(AVATAR_DIR, filename), file.buffer);

    const avatarUrl = `/uploads/avatars/${filename}`;
    await this.prisma.user.update({ where: { id: user.id }, data: { avatarUrl } });
    return { avatarUrl };
  }

  async getPublicProfile(username: string): Promise<PublicUserDto> {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) {
      throw new NotFoundException('Utente non trovato');
    }
    const stats = await this.stats.computeFor(user.id);
    const createdChallengesCount = await this.prisma.challenge.count({
      where: { authorId: user.id },
    });
    return {
      username: user.username,
      avatarUrl: user.avatarUrl,
      solvedCount: stats.solvedCount,
      createdChallengesCount,
    };
  }

  private async requireById(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Utente non trovato');
    }
    return user;
  }
}
