import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { SignOptions } from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import type { LoginDto } from './dto/login.dto';
import type { RefreshDto } from './dto/refresh.dto';
import type { RegisterDto } from './dto/register.dto';

const BCRYPT_ROUNDS = 10;

function hashRefreshToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function parseDurationMs(value: string | undefined, fallbackDays: number): number {
  if (!value) return fallbackDays * 24 * 60 * 60 * 1000;
  const m = value.match(/^(\d+)([dhms])$/i);
  if (!m) return fallbackDays * 24 * 60 * 60 * 1000;
  const n = parseInt(m[1], 10);
  const u = m[2].toLowerCase();
  if (u === 'd') return n * 24 * 60 * 60 * 1000;
  if (u === 'h') return n * 60 * 60 * 1000;
  if (u === 'm') return n * 60 * 1000;
  return n * 1000;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly tenants: TenantsService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) throw new ConflictException('Email already registered');

    const tenantId = await this.tenants.getDefaultTenantId();
    const roleSlug = dto.role ?? 'USER';
    const role = await this.prisma.role.findUnique({ where: { slug: roleSlug.toUpperCase() } });
    if (!role) throw new ConflictException(`Role ${roleSlug} not found or not available`);

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        displayName: dto.displayName,
        tenantId,
        roles: {
          create: {
            role: { connect: { id: role.id } },
          },
        },
      },
    });

    return this.issueTokens(user.id, user.email);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user?.passwordHash) throw new UnauthorizedException('Invalid credentials');
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account not active');
    }
    const match = await bcrypt.compare(dto.password, user.passwordHash);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueTokens(user.id, user.email);
  }

  async refresh(dto: RefreshDto) {
    const tokenHash = hashRefreshToken(dto.refreshToken);
    const row = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    if (!row || row.revokedAt) throw new UnauthorizedException('Invalid refresh token');
    if (row.expiresAt < new Date()) throw new UnauthorizedException('Refresh expired');

    await this.prisma.refreshToken.update({
      where: { id: row.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({ where: { id: row.userId } });
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException();
    }

    return this.issueTokens(user.id, user.email);
  }

  async logout(dto: RefreshDto) {
    const tokenHash = hashRefreshToken(dto.refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  private async issueTokens(userId: string, email: string) {
    const accessTtl = this.config.get<string>('JWT_ACCESS_TTL') ?? '15m';
    const refreshTtl = this.config.get<string>('JWT_REFRESH_TTL') ?? '7d';
    const refreshMs = parseDurationMs(refreshTtl, 7);

    // Fetch user and roles for the frontend
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    const accessToken = await this.jwt.signAsync(
      { sub: userId, email },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessTtl as SignOptions['expiresIn'],
      },
    );

    const rawRefresh = randomBytes(32).toString('hex');
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashRefreshToken(rawRefresh),
        expiresAt: new Date(Date.now() + refreshMs),
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.roles[0]?.role?.slug || 'USER',
      },
      accessToken,
      refreshToken: rawRefresh,
      tokenType: 'Bearer' as const,
      expiresIn: accessTtl,
    };
  }
}
