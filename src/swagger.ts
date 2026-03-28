import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Drive Style API')
    .setDescription(
      'Marketplace MVP. **Test users** (after `npm run prisma:seed`): `demo@example.com` / `Demo123!` (buyer), `dealer@example.com` / `Dealer123!` (dealer inventory). ' +
        'Call **POST /auth/login**, copy `accessToken`, then **Authorize** below with `Bearer <token>`.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Paste: Bearer <accessToken> from /auth/login',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('health', 'Liveness / DB check')
    .addTag('auth', 'Register, login, refresh, logout')
    .addTag('listings', 'Vehicle listings (public browse; writes require JWT)')
    .addTag(
      'vehicle-directory',
      'Makes → models → generations → variants. Use `category` query (CAR, MOTORCYCLE, TRUCK, …) to scope future bikes/trucks.',
    )
    .addTag('showcase', 'New-car rails (UPCOMING, POPULAR, NEWLY_LAUNCHED)')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
  });

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'Drive Style API',
  });
}
