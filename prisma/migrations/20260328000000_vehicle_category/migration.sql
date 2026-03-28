-- CreateEnum
CREATE TYPE "VehicleCategory" AS ENUM ('CAR', 'MOTORCYCLE', 'TRUCK', 'VAN', 'OTHER');

-- AlterTable
ALTER TABLE "VehicleModel" ADD COLUMN "category" "VehicleCategory" NOT NULL DEFAULT 'CAR';

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN "vehicleCategory" "VehicleCategory" NOT NULL DEFAULT 'CAR';

-- CreateIndex
CREATE INDEX "VehicleModel_category_idx" ON "VehicleModel"("category");

-- CreateIndex
CREATE INDEX "Listing_tenantId_vehicleCategory_status_idx" ON "Listing"("tenantId", "vehicleCategory", "status");
