import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantsService implements OnModuleInit {
  private defaultTenantId: string | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    const t = await this.prisma.tenant.findFirst({ where: { isDefault: true } });
    if (t) this.defaultTenantId = t.id;
  }

  async getDefaultTenantId(): Promise<string> {
    if (this.defaultTenantId) return this.defaultTenantId;
    const t = await this.prisma.tenant.findFirst({ where: { isDefault: true } });
    if (!t) throw new Error('No default tenant configured. Run prisma db seed.');
    this.defaultTenantId = t.id;
    return t.id;
  }

  async resolveTenantId(slug?: string): Promise<string> {
    if (!slug || slug === 'default') {
      return this.getDefaultTenantId();
    }
    const t = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!t) throw new Error(`Unknown tenant slug: ${slug}`);
    return t.id;
  }
}
