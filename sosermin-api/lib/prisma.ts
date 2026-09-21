import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  localPrisma: PrismaClient | undefined;
};

const localDatabaseUrl = process.env.LOCAL_DATABASE_URL;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient();

export const localPrisma =
  localDatabaseUrl
    ? globalForPrisma.localPrisma ??
      new PrismaClient({
        datasources: {
          db: {
            url: localDatabaseUrl,
          },
        },
      })
    : undefined;

export async function mirrorToLocal<T>(
  label: string,
  action: (client: PrismaClient) => Promise<T>
) {
  if (!localPrisma) {
    return null;
  }

  try {
    return await action(localPrisma);
  } catch (error) {
    console.error(`No se pudo replicar en PostgreSQL local (${label}):`, error);
    return null;
  }
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.localPrisma = localPrisma;
}
  
