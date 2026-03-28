import { Injectable, Controller, Get, Param, Module, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaModule } from '../prisma/prisma.module';

@Injectable()
export class OffersService {
  constructor(private readonly prisma: PrismaService) {}

  async getListingOffers(listingId: string) {
    return (this.prisma as any).offer?.findMany({
      where: { listingId },
    }) || [];
  }
}

@ApiTags('offers')
@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @ApiBearerAuth('JWT-auth')
  @Get('listing/:id')
  @ApiOperation({ summary: 'Get offers on a listing' })
  getOffers(@Param('id') listingId: string) {
    return this.offersService.getListingOffers(listingId);
  }
}

@Module({
  imports: [PrismaModule],
  controllers: [OffersController],
  providers: [OffersService],
})
export class OffersModule {}
