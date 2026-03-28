import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CmsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllBlogs(tenantSlug?: string) {
    return this.prisma.blogPost.findMany({
      where: tenantSlug ? { tenant: { slug: tenantSlug } } : undefined,
      orderBy: { publishedAt: 'desc' },
    });
  }

  async getAllVideos(tenantSlug?: string) {
    return this.prisma.video.findMany({
      where: tenantSlug ? { tenant: { slug: tenantSlug } } : undefined,
    });
  }

  async getBrandFaqs(makeId?: string) {
    return this.prisma.faq.findMany({
      where: { makeId },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
