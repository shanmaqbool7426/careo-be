import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  displayName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  location?: string;
}

export class UpdateSettingsDto {
  @IsBoolean()
  @IsOptional()
  darkMode?: boolean;

  @IsString()
  @IsOptional()
  language?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsBoolean()
  @IsOptional()
  emailNotifications?: boolean;

  @IsBoolean()
  @IsOptional()
  pushNotifications?: boolean;

  @IsBoolean()
  @IsOptional()
  priceDropAlerts?: boolean;

  @IsBoolean()
  @IsOptional()
  newListingMatches?: boolean;

  @IsBoolean()
  @IsOptional()
  marketingEmails?: boolean;

  @IsBoolean()
  @IsOptional()
  showProfileToDealers?: boolean;

  @IsBoolean()
  @IsOptional()
  showSearchHistory?: boolean;

  @IsBoolean()
  @IsOptional()
  shareUsageData?: boolean;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Profile ──────────────────────────────────────────────────────────────

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        displayName: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        location: true,
        status: true,
        createdAt: true,
        roles: { include: { role: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    const { roles, ...rest } = user;
    return { ...rest, role: roles[0]?.role?.slug ?? 'USER' };
  }

  async update(id: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id },
      data: {
        displayName: dto.displayName,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        avatarUrl: dto.avatarUrl,
        bio: dto.bio,
        location: dto.location,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        location: true,
      },
    });
  }

  async deleteAccount(id: string) {
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'DELETED' },
    });
    return { message: 'Account scheduled for deletion.' };
  }

  // ── Settings ─────────────────────────────────────────────────────────────

  async getSettings(userId: string) {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });
    if (!settings) {
      // return defaults if never saved
      return this.prisma.userSettings.create({ data: { userId } });
    }
    return settings;
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    return this.prisma.userSettings.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: { ...dto },
    });
  }

  // ── Favorites ─────────────────────────────────────────────────────────────

  async getFavorites(userId: string) {
    const favs = await this.prisma.userFavorite.findMany({
      where: { userId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            priceAmount: true,
            currency: true,
            year: true,
            mileage: true,
            fuel: true,
            bodyType: true,
            city: true,
            region: true,
            media: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return favs.map((f) => ({ ...f.listing, savedAt: f.createdAt }));
  }

  async addFavorite(userId: string, listingId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('Listing not found');
    try {
      await this.prisma.userFavorite.create({ data: { userId, listingId } });
    } catch {
      throw new ConflictException('Already in favorites');
    }
    return { message: 'Added to favorites' };
  }

  async removeFavorite(userId: string, listingId: string) {
    const fav = await this.prisma.userFavorite.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });
    if (!fav) throw new NotFoundException('Not in favorites');
    await this.prisma.userFavorite.delete({
      where: { userId_listingId: { userId, listingId } },
    });
    return { message: 'Removed from favorites' };
  }

  // ── Notifications ─────────────────────────────────────────────────────────

  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markNotificationRead(userId: string, notifId: string) {
    const notif = await this.prisma.notification.findFirst({
      where: { id: notifId, userId },
    });
    if (!notif) throw new NotFoundException('Notification not found');
    return this.prisma.notification.update({
      where: { id: notifId },
      data: { isRead: true },
    });
  }

  async markAllNotificationsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { message: 'All notifications marked as read' };
  }

  // ── My Listings ───────────────────────────────────────────────────────────

  async getMyListings(userId: string) {
    return this.prisma.listing.findMany({
      where: { ownerUserId: userId, deletedAt: null },
      select: {
        id: true,
        title: true,
        slug: true,
        priceAmount: true,
        currency: true,
        status: true,
        year: true,
        mileage: true,
        city: true,
        createdAt: true,
        stats: { select: { viewCount: true, leadCount: true, favoriteCount: true } },
        media: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
