import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OutboxService {
  constructor(private readonly prisma: PrismaService) {}

  async emit(
    tx: Prisma.TransactionClient,
    aggregateType: string,
    aggregateId: string,
    eventType: string,
    payload: Prisma.InputJsonValue,
  ): Promise<void> {
    await tx.outboxEvent.create({
      data: {
        aggregateType,
        aggregateId,
        eventType,
        payload,
      },
    });
  }

  listingPayload(listing: Record<string, unknown>): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(listing)) as Prisma.InputJsonValue;
  }
}
