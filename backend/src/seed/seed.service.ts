import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

/** Popola il database con dati di esempio, solo se vuoto. */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap(): Promise<void> {
    const count = await this.prisma.user.count();
    if (count > 0) return;

    const aliceId = await this.createUser('alice', 'alice@example.com', 'password123');
    const bobId = await this.createUser('bob', 'bob@example.com', 'password123');

    await this.prisma.challenge.create({
      data: {
        author: { connect: { id: aliceId } },
        title: 'Solo lettere minuscole',
        description: 'Accetta solo stringhe composte interamente da lettere minuscole.',
        secretRegex: '^[a-z]+$',
        exampleMatch: 'hello',
        exampleNoMatch: 'Hello123',
        controlStringsPositive: ['ciao', 'mondo', 'test'],
        controlStringsNegative: ['Ciao', '123', 'hello world'],
      },
    });

    await this.prisma.challenge.create({
      data: {
        author: { connect: { id: aliceId } },
        title: 'Indirizzo email semplice',
        description: 'Riconosce indirizzi email in forma semplice.',
        secretRegex: '^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$',
        exampleMatch: 'utente@esempio.it',
        exampleNoMatch: 'non-una-email',
        controlStringsPositive: ['a@b.it', 'foo.bar@test.com'],
        controlStringsNegative: ['@niente.it', 'senza-chiocciola', 'spazio @test.it'],
      },
    });

    await this.prisma.challenge.create({
      data: {
        author: { connect: { id: bobId } },
        title: 'Numero di telefono italiano',
        description: 'Riconosce numeri di cellulare italiani, con prefisso +39 opzionale.',
        secretRegex: '^(\\+39)?3\\d{9}$',
        exampleMatch: '3331234567',
        exampleNoMatch: '12345678',
        controlStringsPositive: ['3331234567', '+393331234567'],
        controlStringsNegative: ['123456789', '33312345678', '0331234567'],
      },
    });
  }

  private async createUser(username: string, email: string, password: string): Promise<number> {
    const user = await this.prisma.user.create({
      data: {
        username,
        email,
        passwordHash: await bcrypt.hash(password, 10),
      },
    });
    return user.id;
  }
}
