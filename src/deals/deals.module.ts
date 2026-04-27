import { Injectable, Module, NotFoundException } from '@nestjs/common';
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaModule } from '../prisma/prisma.module';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { CreateDealDto, ListDealsQueryDto } from './dto/deal.dto';
import { DealType, Prisma } from '@prisma/client';

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class DealsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListDealsQueryDto) {
    const { brand, dealType, sort, limit = 20, offset = 0 } = query;

    const deals = await this.prisma.deal.findMany({
      where: {
        ...(dealType ? { dealType } : {}),
        expiresAt: { gte: new Date() },
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            priceAmount: true,
            originalPrice: true,
            year: true,
            bodyType: true,
            city: true,
            media: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true } },
          },
        },
      },
      orderBy:
        sort === 'expiry' ? { expiresAt: 'asc' } : { savingsAmount: 'desc' },
      take: limit,
      skip: offset,
    });

    return deals;
  }

  async findFeatured() {
    return this.prisma.deal.findMany({
      where: { expiresAt: { gte: new Date() } },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            priceAmount: true,
            originalPrice: true,
            media: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true } },
          },
        },
      },
      orderBy: { savingsAmount: 'desc' },
      take: 3,
    });
  }

  async findOne(id: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        listing: {
          include: {
            media: { orderBy: { sortOrder: 'asc' }, take: 6 },
            dealer: { select: { id: true, businessName: true, verified: true, phone: true } },
          },
        },
      },
    });
    if (!deal) throw new NotFoundException('Deal not found');
    return deal;
  }

  async create(dto: CreateDealDto) {
    return this.prisma.deal.create({
      data: {
        listing: { connect: { id: dto.listingId } },
        title: dto.title,
        dealType: dto.dealType,
        badgeText: dto.badgeText,
        savingsAmount: dto.savingsAmount ? new Prisma.Decimal(dto.savingsAmount) : null,
        apr: dto.apr ? new Prisma.Decimal(dto.apr) : null,
        monthlyPayment: dto.monthlyPayment ? new Prisma.Decimal(dto.monthlyPayment) : null,
        monthsTerm: dto.monthsTerm ?? null,
        description: dto.description,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        tenant: { connect: { slug: 'default' } },
      },
    });
  }

  async remove(id: string) {
    const deal = await this.prisma.deal.findUnique({ where: { id } });
    if (!deal) throw new NotFoundException('Deal not found');
    await this.prisma.deal.delete({ where: { id } });
    return { message: 'Deal removed' };
  }
}

// ── Controller ────────────────────────────────────────────────────────────────

@ApiTags('deals')
@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List active deals (filter by brand, dealType, sort)' })
  findAll(@Query() query: ListDealsQueryDto) {
    return this.dealsService.findAll(query);
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Top 3 featured deals for homepage' })
  findFeatured() {
    return this.dealsService.findFeatured();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get deal by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.dealsService.findOne(id);
  }

  @ApiBearerAuth('JWT-auth')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a deal (admin/dealer only)' })
  create(@Body() dto: CreateDealDto) {
    return this.dealsService.create(dto);
  }

  @ApiBearerAuth('JWT-auth')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a deal' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.dealsService.remove(id);
  }
}

// ── Module ────────────────────────────────────────────────────────────────────

@Module({
  imports: [PrismaModule],
  controllers: [DealsController],
  providers: [DealsService],
  exports: [DealsService],
})
export class DealsModule {}
