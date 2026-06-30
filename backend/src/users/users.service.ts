import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { basename, join } from 'path';
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

// Firme binarie ("magic bytes") dei formati immagine ammessi. Si valida il
// contenuto reale del file, non l'header Content-Type dichiarato dal client
// (falsificabile: un eseguibile può spacciarsi per image/png).
const IMAGE_SIGNATURES: { ext: string; magic: number[] }[] = [
  { ext: '.jpg', magic: [0xff, 0xd8, 0xff] },
  { ext: '.png', magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { ext: '.gif', magic: [0x47, 0x49, 0x46, 0x38] }, // "GIF8" (GIF87a / GIF89a)
];

/** Riconosce il formato immagine dai primi byte; null se non è un'immagine ammessa. */
function detectImageExt(buffer: Buffer): string | null {
  for (const { ext, magic } of IMAGE_SIGNATURES) {
    if (
      buffer.length >= magic.length &&
      magic.every((byte, i) => buffer[i] === byte)
    ) {
      return ext;
    }
  }
  return null;
}

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
    if (!file || !file.buffer) {
      throw new BadRequestException('Nessun file caricato');
    }
    const ext = detectImageExt(file.buffer);
    if (!ext) {
      throw new BadRequestException('Formato non supportato (ammessi: JPEG, PNG, GIF)');
    }

    await fs.mkdir(AVATAR_DIR, { recursive: true });
    const filename = `${user.id}_${randomUUID()}${ext}`;
    await fs.writeFile(join(AVATAR_DIR, filename), file.buffer);

    const avatarUrl = `/uploads/avatars/${filename}`;
    await this.prisma.user.update({ where: { id: user.id }, data: { avatarUrl } });

    // Rimuove il vecchio avatar per non accumulare file orfani sul disco.
    await this.removeOldAvatar(user.avatarUrl, filename);

    return { avatarUrl };
  }

  /** Cancella (best effort) il precedente file avatar, restando dentro AVATAR_DIR. */
  private async removeOldAvatar(
    previousUrl: string | null,
    newFilename: string,
  ): Promise<void> {
    if (!previousUrl) return;
    // basename neutralizza eventuali tentativi di path traversal.
    const oldName = basename(previousUrl);
    if (!oldName || oldName === newFilename) return;
    try {
      await fs.unlink(join(AVATAR_DIR, oldName));
    } catch {
      // File già assente o non rimovibile: ininfluente.
    }
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
