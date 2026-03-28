import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { OutboxModule } from '../outbox/outbox.module';
import { TenantsModule } from '../tenants/tenants.module';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';

@Module({
  imports: [TenantsModule, OutboxModule, AuditModule],
  controllers: [ListingsController],
  providers: [ListingsService],
})
export class ListingsModule {}
