import {
  BodyType,
  FuelType,
  ListingKind,
  ListingStatus,
  NewCarShelf,
  PrismaClient,
  SellerType,
  SpecDataType,
  TransmissionType,
  VehicleCategory,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const PERMISSIONS = [
  { slug: 'listing:read', resource: 'listing', action: 'read' },
  { slug: 'listing:write', resource: 'listing', action: 'write' },
  { slug: 'directory:read', resource: 'directory', action: 'read' },
  { slug: 'admin:moderate', resource: 'admin', action: 'moderate' },
  { slug: 'showcase:write', resource: 'showcase', action: 'write' },
] as const;

const BCRYPT_ROUNDS = 10;

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    create: { slug: 'default', name: 'Default marketplace', isDefault: true },
    update: { name: 'Default marketplace', isDefault: true },
  });

  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { slug: p.slug },
      create: {
        slug: p.slug,
        resource: p.resource,
        action: p.action,
      },
      update: { resource: p.resource, action: p.action },
    });
  }

  const roles = [
    { slug: 'USER', name: 'User' },
    { slug: 'DEALER', name: 'Dealer' },
    { slug: 'ADMIN', name: 'Administrator' },
  ] as const;

  for (const r of roles) {
    await prisma.role.upsert({
      where: { slug: r.slug },
      create: { slug: r.slug, name: r.name },
      update: { name: r.name },
    });
  }

  const allPerms = await prisma.permission.findMany();
  const permBySlug = Object.fromEntries(allPerms.map((x) => [x.slug, x.id])) as Record<
    string,
    string
  >;

  const userRole = await prisma.role.findUniqueOrThrow({ where: { slug: 'USER' } });
  const dealerRole = await prisma.role.findUniqueOrThrow({ where: { slug: 'DEALER' } });
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { slug: 'ADMIN' } });

  const userPermIds = ['listing:read', 'listing:write', 'directory:read'].map(
    (s) => permBySlug[s],
  );
  const dealerPermIds = ['listing:read', 'listing:write', 'directory:read'].map(
    (s) => permBySlug[s],
  );
  const adminPermIds = allPerms.map((p) => p.id);

  const rolePermRows: { roleId: string; permissionId: string }[] = [];

  for (const pid of userPermIds) {
    rolePermRows.push({ roleId: userRole.id, permissionId: pid });
  }
  for (const pid of dealerPermIds) {
    rolePermRows.push({ roleId: dealerRole.id, permissionId: pid });
  }
  for (const pid of adminPermIds) {
    rolePermRows.push({ roleId: adminRole.id, permissionId: pid });
  }

  await prisma.rolePermission.createMany({
    data: rolePermRows,
    skipDuplicates: true,
  });

  const demoHash = await bcrypt.hash('Demo123!', BCRYPT_ROUNDS);
  const dealerHash = await bcrypt.hash('Dealer123!', BCRYPT_ROUNDS);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    create: {
      email: 'demo@example.com',
      passwordHash: demoHash,
      displayName: 'Demo Buyer',
      tenantId: tenant.id,
      roles: {
        create: { role: { connect: { slug: 'USER' } } },
      },
    },
    update: {
      passwordHash: demoHash,
      displayName: 'Demo Buyer',
    },
  });

  const dealerOwner = await prisma.user.upsert({
    where: { email: 'dealer@example.com' },
    create: {
      email: 'dealer@example.com',
      passwordHash: dealerHash,
      displayName: 'Demo Dealer',
      tenantId: tenant.id,
      roles: {
        create: [
          { role: { connect: { slug: 'USER' } } },
          { role: { connect: { slug: 'DEALER' } } },
        ],
      },
    },
    update: {
      passwordHash: dealerHash,
      displayName: 'Demo Dealer',
    },
  });

  const dealer = await prisma.dealer.upsert({
    where: { ownerUserId: dealerOwner.id },
    create: {
      tenantId: tenant.id,
      ownerUserId: dealerOwner.id,
      businessName: 'Demo Motors',
      slug: 'demo-motors',
      city: 'Sydney',
      region: 'NSW',
      countryCode: 'AU',
      verified: true,
    },
    update: {
      businessName: 'Demo Motors',
      verified: true,
    },
  });

  const make = await prisma.vehicleMake.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'toyota' } },
    create: {
      tenantId: tenant.id,
      name: 'Toyota',
      slug: 'toyota',
    },
    update: {},
  });

  const model = await prisma.vehicleModel.upsert({
    where: { makeId_slug: { makeId: make.id, slug: 'camry' } },
    create: {
      makeId: make.id,
      name: 'Camry',
      slug: 'camry',
      category: VehicleCategory.CAR,
      bodyType: BodyType.SEDAN,
    },
    update: { category: VehicleCategory.CAR },
  });

  const generation = await prisma.vehicleGeneration.upsert({
    where: { modelId_slug: { modelId: model.id, slug: 'xv70' } },
    create: {
      modelId: model.id,
      name: 'XV70 (2018–2023)',
      slug: 'xv70',
      yearStart: 2018,
      yearEnd: 2023,
    },
    update: {},
  });

  const variantHybrid = await prisma.vehicleVariant.upsert({
    where: {
      generationId_slug: { generationId: generation.id, slug: 'le-hybrid' },
    },
    create: {
      generationId: generation.id,
      name: 'LE Hybrid',
      slug: 'le-hybrid',
      trimCode: 'LE-H',
    },
    update: {},
  });

  const variantXse = await prisma.vehicleVariant.upsert({
    where: {
      generationId_slug: { generationId: generation.id, slug: 'xse-v6' },
    },
    create: {
      generationId: generation.id,
      name: 'XSE V6',
      slug: 'xse-v6',
      trimCode: 'XSE',
    },
    update: {},
  });

  // Motorcycle directory (try GET /vehicle-directory/makes?category=MOTORCYCLE)
  const makeHd = await prisma.vehicleMake.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'harley-davidson' } },
    create: {
      tenantId: tenant.id,
      name: 'Harley-Davidson',
      slug: 'harley-davidson',
    },
    update: {},
  });

  const modelSportster = await prisma.vehicleModel.upsert({
    where: { makeId_slug: { makeId: makeHd.id, slug: 'sportster-s' } },
    create: {
      makeId: makeHd.id,
      name: 'Sportster S',
      slug: 'sportster-s',
      category: VehicleCategory.MOTORCYCLE,
      bodyType: BodyType.OTHER,
    },
    update: { category: VehicleCategory.MOTORCYCLE },
  });

  const genSportster = await prisma.vehicleGeneration.upsert({
    where: { modelId_slug: { modelId: modelSportster.id, slug: 'rh1250s' } },
    create: {
      modelId: modelSportster.id,
      name: 'RH1250S (2021–present)',
      slug: 'rh1250s',
      yearStart: 2021,
      yearEnd: null,
    },
    update: {},
  });

  const variantSportster = await prisma.vehicleVariant.upsert({
    where: {
      generationId_slug: { generationId: genSportster.id, slug: 'base' },
    },
    create: {
      generationId: genSportster.id,
      name: 'RH1250S',
      slug: 'base',
      trimCode: 'RH1250S',
    },
    update: {},
  });

  let specMotoV1 = await prisma.vehicleSpecVersion.findFirst({
    where: { variantId: variantSportster.id, version: 1 },
  });
  if (!specMotoV1) {
    specMotoV1 = await prisma.vehicleSpecVersion.create({
      data: {
        variantId: variantSportster.id,
        version: 1,
        label: 'Factory specs',
        fields: {
          create: [
            {
              key: 'engine_cc',
              label: 'Displacement',
              sortOrder: 0,
              dataType: SpecDataType.NUMBER,
              value: { create: { valueNum: 1250 } },
            },
            {
              key: 'engine_type',
              label: 'Engine',
              sortOrder: 1,
              dataType: SpecDataType.STRING,
              value: { create: { valueText: 'Revolution Max 1250 V-Twin' } },
            },
          ],
        },
      },
    });
  }

  let specV1 = await prisma.vehicleSpecVersion.findFirst({
    where: { variantId: variantHybrid.id, version: 1 },
  });
  if (!specV1) {
    specV1 = await prisma.vehicleSpecVersion.create({
      data: {
        variantId: variantHybrid.id,
        version: 1,
        label: 'Launch specs',
        fields: {
          create: [
            {
              key: 'engine',
              label: 'Engine',
              sortOrder: 0,
              dataType: SpecDataType.STRING,
              value: { create: { valueText: '2.5L Dynamic Force I4 + hybrid' } },
            },
            {
              key: 'power_hp',
              label: 'System horsepower',
              sortOrder: 1,
              dataType: SpecDataType.NUMBER,
              value: { create: { valueNum: 208 } },
            },
          ],
        },
      },
    });
  }

  await prisma.newCarShowcaseItem.upsert({
    where: {
      tenantId_vehicleVariantId_shelf: {
        tenantId: tenant.id,
        vehicleVariantId: variantHybrid.id,
        shelf: NewCarShelf.POPULAR,
      },
    },
    create: {
      tenantId: tenant.id,
      vehicleVariantId: variantHybrid.id,
      shelf: NewCarShelf.POPULAR,
      sortOrder: 0,
      isActive: true,
      marketingTitle: 'Camry Hybrid — fuel-sipper',
      marketingSubtitle: 'Popular with commuters.',
    },
    update: { isActive: true },
  });

  await prisma.newCarShowcaseItem.upsert({
    where: {
      tenantId_vehicleVariantId_shelf: {
        tenantId: tenant.id,
        vehicleVariantId: variantHybrid.id,
        shelf: NewCarShelf.UPCOMING,
      },
    },
    create: {
      tenantId: tenant.id,
      vehicleVariantId: variantHybrid.id,
      shelf: NewCarShelf.UPCOMING,
      sortOrder: 0,
      isActive: true,
      marketingTitle: '2026 Camry refresh',
      expectedLaunchDate: new Date('2026-06-01'),
    },
    update: { isActive: true },
  });

  await prisma.newCarShowcaseItem.upsert({
    where: {
      tenantId_vehicleVariantId_shelf: {
        tenantId: tenant.id,
        vehicleVariantId: variantXse.id,
        shelf: NewCarShelf.NEWLY_LAUNCHED,
      },
    },
    create: {
      tenantId: tenant.id,
      vehicleVariantId: variantXse.id,
      shelf: NewCarShelf.NEWLY_LAUNCHED,
      sortOrder: 0,
      isActive: true,
      marketingTitle: 'XSE V6 — just landed',
      launchHighlightAt: new Date(),
    },
    update: { isActive: true },
  });

  await prisma.listing.upsert({
    where: {
      tenantId_slug: { tenantId: tenant.id, slug: 'seed-2019-camry-le' },
    },
    create: {
      tenantId: tenant.id,
      kind: ListingKind.USED,
      status: ListingStatus.PUBLISHED,
      sellerType: SellerType.PRIVATE,
      ownerUserId: demoUser.id,
      title: '2019 Toyota Camry LE — low miles',
      slug: 'seed-2019-camry-le',
      description: 'Seeded listing for Swagger / manual testing.',
      priceAmount: '18999.00',
      currency: 'USD',
      year: 2019,
      mileage: 42000,
      fuel: FuelType.GASOLINE,
      transmission: TransmissionType.AUTOMATIC,
      city: 'Sydney',
      region: 'NSW',
      countryCode: 'AU',
      publishedAt: new Date(),
      stats: { create: {} },
    },
    update: {
      status: ListingStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  await prisma.listing.upsert({
    where: {
      tenantId_slug: { tenantId: tenant.id, slug: 'seed-new-camry-hybrid' },
    },
    create: {
      tenantId: tenant.id,
      kind: ListingKind.NEW,
      status: ListingStatus.PUBLISHED,
      sellerType: SellerType.DEALER,
      ownerUserId: dealerOwner.id,
      dealerId: dealer.id,
      vehicleVariantId: variantHybrid.id,
      vehicleSpecVersionId: specV1.id,
      title: 'New 2025 Toyota Camry LE Hybrid',
      slug: 'seed-new-camry-hybrid',
      description: 'Dealer new stock linked to directory variant.',
      priceAmount: '32999.00',
      currency: 'USD',
      year: 2025,
      fuel: FuelType.HYBRID,
      transmission: TransmissionType.CVT,
      city: 'Sydney',
      region: 'NSW',
      countryCode: 'AU',
      publishedAt: new Date(),
      stats: { create: {} },
    },
    update: {
      status: ListingStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  await prisma.listing.upsert({
    where: {
      tenantId_slug: { tenantId: tenant.id, slug: 'seed-2023-hd-sportster-s' },
    },
    create: {
      tenantId: tenant.id,
      kind: ListingKind.USED,
      status: ListingStatus.PUBLISHED,
      sellerType: SellerType.PRIVATE,
      ownerUserId: demoUser.id,
      vehicleVariantId: variantSportster.id,
      vehicleSpecVersionId: specMotoV1.id,
      title: '2023 Harley-Davidson Sportster S',
      slug: 'seed-2023-hd-sportster-s',
      description: 'Seeded MOTORCYCLE listing — linked to directory (vehicleCategory = MOTORCYCLE).',
      vehicleCategory: VehicleCategory.MOTORCYCLE,
      priceAmount: '14999.00',
      currency: 'USD',
      year: 2023,
      mileage: 3200,
      fuel: FuelType.GASOLINE,
      transmission: TransmissionType.MANUAL,
      city: 'Melbourne',
      region: 'VIC',
      countryCode: 'AU',
      publishedAt: new Date(),
      stats: { create: {} },
    },
    update: {
      status: ListingStatus.PUBLISHED,
      vehicleCategory: VehicleCategory.MOTORCYCLE,
      publishedAt: new Date(),
    },
  });

  console.log('Seed complete.');
  console.log('  Tenant:', tenant.slug, `(${tenant.id})`);
  console.log('  Demo buyer:  demo@example.com  / Demo123!');
  console.log('  Demo dealer: dealer@example.com / Dealer123!');
  console.log('  Vehicle: make', make.slug, '→ variant', variantHybrid.id);
  console.log('  Motorcycle:', makeHd.slug, '→', modelSportster.slug, '→ variant', variantSportster.id);
  console.log('  Try Swagger: GET /api/v1/listings?tenantSlug=default&vehicleCategory=MOTORCYCLE');
  console.log('  Try Swagger: GET /api/v1/vehicle-directory/makes?category=MOTORCYCLE');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
