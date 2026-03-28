import { Injectable, Controller, Get, Param, Module } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class MessagingService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserConversations(userId: string) {
    return (this.prisma as any).conversation?.findMany({
      where: {
        OR: [{ p1Id: userId }, { p2Id: userId }],
      },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    }) || [];
  }
}

@ApiTags('messaging')
@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @ApiBearerAuth('JWT-auth')
  @Get('conversations')
  @ApiOperation({ summary: 'Get conversations for logged in user' })
  getConversations(@CurrentUser() user: AuthUser) {
    return this.messagingService.getUserConversations(user.id);
  }
}

@Module({
  imports: [PrismaModule],
  controllers: [MessagingController],
  providers: [MessagingService],
})
export class MessagingModule {}
