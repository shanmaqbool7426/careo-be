import { Injectable, NotFoundException } from '@nestjs/common';
import { VehicleCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
@Injectable()
export class VehicleDirectoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenants: TenantsService,
  ) {}

  async listMakes(tenantSlug?: string, category?: VehicleCategory) {
    const tenantId = await this.tenants.resolveTenantId(tenantSlug);
    return this.prisma.vehicleMake.findMany({
      where: {
        deletedAt: null,
        OR: [{ tenantId }, { tenantId: null }],
        ...(category && {
          models: { some: { category, deletedAt: null } },
        }),
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        createdAt: true,
      },
    });
  }

  async listModels(makeId: string, tenantSlug?: string, category?: VehicleCategory) {
    await this.assertMake(makeId, tenantSlug);
    return this.prisma.vehicleModel.findMany({
      where: {
        makeId,
        deletedAt: null,
        ...(category && { category }),
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        bodyType: true,
        makeId: true,
      },
    });
  }
  async listGenerations(modelId: string) {
    await this.assertModel(modelId);
    return this.prisma.vehicleGeneration.findMany({
      where: { modelId, deletedAt: null },
      orderBy: { yearStart: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        yearStart: true,
        yearEnd: true,
        modelId: true,
      },
    });
  }

  async listVariants(generationId: string) {
    await this.assertGeneration(generationId);
    return this.prisma.vehicleVariant.findMany({
      where: { generationId, deletedAt: null },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        trimCode: true,
        generationId: true,
      },
    });
  }

  async getVariantDetail(variantId: string) {
    const variant = await this.prisma.vehicleVariant.findFirst({
      where: { id: variantId, deletedAt: null },
      include: {
        generation: {
          include: {
            model: { include: { make: true } },
          },
        },
        features: {
          orderBy: [{ isKeyHighlight: 'desc' }, { groupName: 'asc' }],
        },
        warranty: true,
        specVersions: {
          where: { effectiveTo: null },
          orderBy: { version: 'desc' },
          take: 1,
          include: {
            fields: {
              orderBy: [{ groupName: 'asc' }, { sortOrder: 'asc' }],
              include: { value: true },
            },
          },
        },
      },
    });
    if (!variant) throw new NotFoundException('Variant not found');
    return variant;
  }

  private async assertMake(makeId: string, tenantSlug?: string) {
    const tenantId = await this.tenants.resolveTenantId(tenantSlug);
    const make = await this.prisma.vehicleMake.findFirst({
      where: {
        id: makeId,
        deletedAt: null,
        OR: [{ tenantId }, { tenantId: null }],
      },
    });
    if (!make) throw new NotFoundException('Make not found');
  }

  private async assertModel(modelId: string) {
    const model = await this.prisma.vehicleModel.findFirst({
      where: { id: modelId, deletedAt: null },
    });
    if (!model) throw new NotFoundException('Model not found');
  }

  private async assertGeneration(generationId: string) {
    const gen = await this.prisma.vehicleGeneration.findFirst({
      where: { id: generationId, deletedAt: null },
    });
    if (!gen) throw new NotFoundException('Generation not found');
  }
}
