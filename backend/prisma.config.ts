// Конфиг Prisma CLI (v7). Prisma больше не грузит .env сам — делаем это вручную.
// Файл должен называться prisma.config.ts и лежать рядом с package.json.
import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { defineConfig } from 'prisma/config';

// .env использует ${...} (POSTGRES_URI собирается из частей) → нужен expand
expand(config());

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // совпадает с datasource.url в schema.prisma → env("POSTGRES_URI")
    url: process.env['POSTGRES_URI'],
  },
});
