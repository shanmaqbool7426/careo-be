import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDealerDto } from './dto/create-dealer.dto';
import { AuthUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class DealersService {
  constructor(private readonly prisma: PrismaService) {}

  async findMe(user: AuthUser) {
    const dealer = await this.prisma.dealer.findUnique({
      where: { ownerUserId: user.id },
    });
    if (!dealer) throw new NotFoundException('Dealer profile not found');
    return dealer;
  }

  async create(dto: CreateDealerDto, user: AuthUser) {
    const existing = await this.prisma.dealer.findFirst({
      where: { ownerUserId: user.id },
    });
    if (existing) throw new ConflictException('User already has a dealer profile');

    const slug = dto.businessName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const tenantId = user.tenantId || (await this.prisma.tenant.findFirst({ where: { isDefault: true } }))?.id;

    if (!tenantId) throw new BadRequestException('Tenant not found');

    return this.prisma.dealer.create({
      data: {
        tenantId,
        ownerUserId: user.id,
        businessName: dto.businessName,
        slug: `${slug}-${Math.random().toString(36).substring(7)}`,
        description: dto.description,
        phone: dto.phone,
        email: dto.email,
        websiteUrl: dto.websiteUrl,
        addressLine1: dto.addressLine1,
        city: dto.city,
        region: dto.region,
        countryCode: dto.countryCode || 'PK',
      },
    });
  }

  async findAll() {
    return this.prisma.dealer.findMany({
      where: { deletedAt: null, verified: true },
      take: 20,
    });
  }

  async findById(id: string) {
    const dealer = await this.prisma.dealer.findUnique({
      where: { id },
    });
    if (!dealer) throw new NotFoundException('Dealer not found');
    return dealer;
  }
}
