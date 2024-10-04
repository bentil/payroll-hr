import { PrismaClient } from '@prisma/client';

export class PrismaService extends PrismaClient {
  private static instance: PrismaService;

  private constructor() {
    super();
  }

  public static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
    }

    return PrismaService.instance;
  }

  public async connect(): Promise<void> {
    await PrismaService.instance.$connect();
  }

  public async close(): Promise<void> {
    PrismaService.instance && (await PrismaService.instance.$disconnect());
  }
}

export const prisma = PrismaService.getInstance();
