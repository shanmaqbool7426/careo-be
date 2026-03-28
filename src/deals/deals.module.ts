import { Injectable, Controller, Get, Param, Module } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaModule } from '../prisma/prisma.module';
import { Public } from '../common/decorators/public.decorator';

@Injectable()
export class DealsService {
  constructor(private readonly prisma: PrismaService) {}

  async getListingDeals(listingId: string) {
    // Note: requires Prisma types to be regenerated
    return (this.prisma as any).deal?.findMany({
      where: { listingId },
    }) || [];
  }
}

@ApiTags('deals')
@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Public()
  @Get('listing/:id')
  @ApiOperation({ summary: 'Get deals associated with a listing' })
  getDeals(@Param('id') listingId: string) {
    return this.dealsService.getListingDeals(listingId);
  }
}

@Module({
  imports: [PrismaModule],
  controllers: [DealsController],
  providers: [DealsService],
})
export class DealsModule {}
