import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

const IMAGE_SIGNATURES: { mime: string; magic: number[] }[] = [
  { mime: 'image/jpeg', magic: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'image/gif', magic: [0x47, 0x49, 0x46, 0x38] },
];

function detectImageMime(buffer: Buffer): string | null {
  for (const { mime, magic } of IMAGE_SIGNATURES) {
    if (
      buffer.length >= magic.length &&
      magic.every((byte, i) => buffer[i] === byte)
    ) {
      return mime;
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
      avatarUrl: this.avatarUrl(user),
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
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        username: dto.username ?? undefined,
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
    const mime = detectImageMime(file.buffer);
    if (!mime) {
      throw new BadRequestException('Formato non supportato (ammessi: JPEG, PNG, GIF)');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { avatarData: file.buffer, avatarMime: mime },
    });

    return { avatarUrl: this.avatarUrl(user.id, mime)! };
  }

  async getAvatar(id: number): Promise<{ data: Buffer; mime: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { avatarData: true, avatarMime: true },
    });
    if (!user?.avatarData || !user.avatarMime) {
      throw new NotFoundException('Avatar non trovato');
    }
    return { data: user.avatarData, mime: user.avatarMime };
  }

  private avatarUrl(user: Pick<User, 'id' | 'avatarMime'>): string | null;
  private avatarUrl(id: number, mime: string | null): string | null;
  private avatarUrl(userOrId: Pick<User, 'id' | 'avatarMime'> | number, mime?: string | null): string | null {
    const id = typeof userOrId === 'number' ? userOrId : userOrId.id;
    const avatarMime = typeof userOrId === 'number' ? mime : userOrId.avatarMime;
    return avatarMime ? `/api/users/${id}/avatar` : null;
  }

  private async requireById(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Utente non trovato');
    }
    return user;
  }
}
