import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListBlogsQueryDto, ListVideosQueryDto } from './dto/cms.query.dto';

@Injectable()
export class CmsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Blog ─────────────────────────────────────────────────────────────────

  async getAllBlogs(query: ListBlogsQueryDto, tenantSlug = 'default') {
    const { q, category, featured, limit = 20, offset = 0 } = query;

    return this.prisma.blogPost.findMany({
      where: {
        tenant: { slug: tenantSlug },
        publishedAt: { not: null, lte: new Date() },
        ...(category ? { category } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { excerpt: { contains: q, mode: 'insensitive' } },
                { tags: { has: q } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        thumbnailUrl: true,
        category: true,
        tags: true,
        publishedAt: true,
        author: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async getBlogBySlug(slug: string, tenantSlug = 'default') {
    return this.prisma.blogPost.findFirst({
      where: {
        slug,
        tenant: { slug: tenantSlug },
        publishedAt: { not: null, lte: new Date() },
      },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });
  }

  async getBlogById(id: string) {
    return this.prisma.blogPost.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });
  }

  // ── Videos ────────────────────────────────────────────────────────────────

  async getAllVideos(query: ListVideosQueryDto, tenantSlug = 'default') {
    const { q, category, brand, limit = 20, offset = 0 } = query;

    return this.prisma.video.findMany({
      where: {
        tenant: { slug: tenantSlug },
        ...(category ? { category } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── FAQs ──────────────────────────────────────────────────────────────────

  async getBrandFaqs(makeId?: string) {
    return this.prisma.faq.findMany({
      where: { makeId: makeId ?? null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getAllFaqs(tenantSlug = 'default') {
    return this.prisma.faq.findMany({
      where: { tenant: { slug: tenantSlug } },
      orderBy: { sortOrder: 'asc' },
      include: { make: { select: { id: true, name: true, slug: true } } },
    });
  }

  // ── Newsletter ────────────────────────────────────────────────────────────

  async subscribe(email: string) {
    await this.prisma.newsletterSubscriber.upsert({
      where: { email },
      create: { email },
      update: { unsubscribedAt: null },
    });
    return { message: 'Subscribed successfully' };
  }

  async unsubscribe(email: string) {
    await this.prisma.newsletterSubscriber.updateMany({
      where: { email },
      data: { unsubscribedAt: new Date() },
    });
    return { message: 'Unsubscribed' };
  }

  // ── Site Stats (homepage) ─────────────────────────────────────────────────

  async getSiteStats(tenantSlug = 'default') {
    const [vehicles, dealers, reviews] = await Promise.all([
      this.prisma.listing.count({
        where: { tenant: { slug: tenantSlug }, status: 'PUBLISHED', deletedAt: null },
      }),
      this.prisma.dealer.count({
        where: { tenant: { slug: tenantSlug }, deletedAt: null, verified: true },
      }),
      this.prisma.vehicleReview.count({ where: { tenant: { slug: tenantSlug } } }),
    ]);
    return { totalVehicles: vehicles, totalDealers: dealers, totalReviews: reviews };
  }
}
