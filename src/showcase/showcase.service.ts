import { Injectable } from '@nestjs/common';
import { NewCarShelf } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';

@Injectable()
export class ShowcaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenants: TenantsService,
  ) {}

  async listByShelf(shelf: NewCarShelf, tenantSlug?: string) {
    const tenantId = await this.tenants.resolveTenantId(tenantSlug);
    return this.prisma.newCarShowcaseItem.findMany({
      where: { tenantId, shelf, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        vehicleVariant: {
          include: {
            generation: {
              include: {
                model: { include: { make: true } },
              },
            },
            specVersions: {
              where: { effectiveTo: null },
              orderBy: { version: 'desc' },
              take: 1,
              include: {
                fields: {
                  orderBy: { sortOrder: 'asc' },
                  take: 12,
                  include: { value: true },
                },
              },
            },
          },
        },
      },
    });
  }
}
