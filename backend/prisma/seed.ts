/**
 * Сид единственного суперпользователя с ролью MIRA.
 *
 *   npm run seed          — из папки backend
 *   npx prisma db seed    — то же самое (конфиг в prisma.config.ts)
 *
 * Идемпотентно: upsert по email, можно гонять сколько угодно раз.
 * Инвариант «MIRA один»: если роль MIRA уже держит другой email — сид падает,
 * чинить такое надо руками.
 *
 * Данные берутся из backend/.env (в git не коммитится):
 *   SEED_MIRA_EMAIL, SEED_MIRA_PASSWORD, SEED_MIRA_NAME
 */
import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { hash } from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole } from '../src/generated/prisma/client';

// .env использует ${...} → нужен expand (как в prisma.config.ts)
expand(config());

const email = process.env.SEED_MIRA_EMAIL;
const password = process.env.SEED_MIRA_PASSWORD;
const displayName = process.env.SEED_MIRA_NAME ?? 'mira';

async function main(): Promise<void> {
  if (!email || !password) {
    throw new Error(
      'Не заданы SEED_MIRA_EMAIL / SEED_MIRA_PASSWORD в backend/.env',
    );
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.POSTGRES_URI }),
  });

  try {
    const foreignMira = await prisma.user.findFirst({
      where: { role: UserRole.MIRA, email: { not: email } },
      select: { email: true },
    });
    if (foreignMira) {
      throw new Error(
        `Роль MIRA уже занята другим пользователем (${foreignMira.email}). ` +
          'MIRA может быть только один — почини данные вручную.',
      );
    }

    const passwordHash = await hash(password);
    const user = await prisma.user.upsert({
      where: { email },
      update: { displayName, role: UserRole.MIRA, password: passwordHash },
      create: { email, displayName, role: UserRole.MIRA, password: passwordHash },
      select: { id: true, email: true, displayName: true, role: true },
    });

    console.log('MIRA-суперпользователь готов:', user);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
