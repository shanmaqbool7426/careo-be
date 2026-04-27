import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { AppConfigModule } from './config/app-config.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { HealthModule } from './health/health.module';
import { ListingsModule } from './listings/listings.module';
import { PrismaModule } from './prisma/prisma.module';
import { ShowcaseModule } from './showcase/showcase.module';
import { TenantsModule } from './tenants/tenants.module';
import { VehicleDirectoryModule } from './vehicle-directory/vehicle-directory.module';
import { CmsModule } from './cms/cms.module';
import { DealsModule } from './deals/deals.module';
import { OffersModule } from './offers/offers.module';
import { MessagingModule } from './messaging/messaging.module';
import { ReviewsModule } from './reviews/reviews.module';
import { DealersModule } from './dealers/dealers.module';
import { MediaModule } from './media/media.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    TenantsModule,
    HealthModule,
    AuthModule,
    ListingsModule,
    VehicleDirectoryModule,
    ShowcaseModule,
    CmsModule,
    DealsModule,
    OffersModule,
    MessagingModule,
    ReviewsModule,
    DealersModule,
    MediaModule,
    UsersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
