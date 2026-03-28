import { Module } from '@nestjs/common';
import { TenantsModule } from '../tenants/tenants.module';
import { VehicleDirectoryController } from './vehicle-directory.controller';
import { VehicleDirectoryService } from './vehicle-directory.service';

@Module({
  imports: [TenantsModule],
  controllers: [VehicleDirectoryController],
  providers: [VehicleDirectoryService],
})
export class VehicleDirectoryModule {}
