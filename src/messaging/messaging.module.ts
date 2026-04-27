import { Injectable, Module, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { StartConversationDto, SendMessageDto } from './dto/messaging.dto';

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class MessagingService {
  constructor(private readonly prisma: PrismaService) {}

  async startConversation(dto: StartConversationDto, user: AuthUser) {
    if (dto.recipientId === user.id)
      throw new ForbiddenException('Cannot start a conversation with yourself');

    const tenant = await this.prisma.tenant.findFirst({ where: { isDefault: true } });

    // Ensure p1Id < p2Id to prevent duplicates
    const [p1Id, p2Id] = [user.id, dto.recipientId].sort();

    let conversation = await this.prisma.conversation.findFirst({
      where: {
        p1Id,
        p2Id,
        listingId: dto.listingId ?? null,
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          tenantId: tenant!.id,
          p1Id,
          p2Id,
          listingId: dto.listingId ?? null,
        },
      });
    }

    // Optionally send the initial message
    if (dto.initialMessage) {
      await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: user.id,
          receiverId: dto.recipientId,
          content: dto.initialMessage,
        },
      });
    }

    return this.getConversationById(conversation.id, user);
  }

  async getUserConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: { OR: [{ p1Id: userId }, { p2Id: userId }] },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, createdAt: true, senderId: true, isRead: true },
        },
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            media: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true } },
          },
        },
        participant1: { select: { id: true, displayName: true, avatarUrl: true } },
        participant2: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getConversationById(conversationId: string, user: AuthUser) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participant1: { select: { id: true, displayName: true, avatarUrl: true } },
        participant2: { select: { id: true, displayName: true, avatarUrl: true } },
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            priceAmount: true,
            media: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true } },
          },
        },
      },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.p1Id !== user.id && conv.p2Id !== user.id)
      throw new ForbiddenException('Access denied');
    return conv;
  }

  async getMessages(conversationId: string, user: AuthUser) {
    await this.getConversationById(conversationId, user); // access check

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        senderId: true,
        receiverId: true,
        isRead: true,
        createdAt: true,
      },
    });

    // Mark received messages as read
    await this.prisma.message.updateMany({
      where: { conversationId, receiverId: user.id, isRead: false },
      data: { isRead: true },
    });

    return messages;
  }

  async sendMessage(conversationId: string, dto: SendMessageDto, user: AuthUser) {
    const conv = await this.getConversationById(conversationId, user);
    const receiverId = conv.p1Id === user.id ? conv.p2Id : conv.p1Id;

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        receiverId,
        content: dto.content,
      },
    });

    // Update conversation updatedAt
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }
}

// ── Controller ────────────────────────────────────────────────────────────────

@ApiTags('messaging')
@Controller('messaging')
@ApiBearerAuth('JWT-auth')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start a new conversation (or resume existing)' })
  startConversation(@Body() dto: StartConversationDto, @CurrentUser() user: AuthUser) {
    return this.messagingService.startConversation(dto, user);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get all my conversations (with last message preview)' })
  getConversations(@CurrentUser() user: AuthUser) {
    return this.messagingService.getUserConversations(user.id);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get a conversation detail' })
  getConversation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.messagingService.getConversationById(id, user);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get messages in a conversation (marks received as read)' })
  getMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.messagingService.getMessages(id, user);
  }

  @Post('conversations/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a message in a conversation' })
  sendMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.messagingService.sendMessage(id, dto, user);
  }
}

// ── Module ────────────────────────────────────────────────────────────────────

@Module({
  imports: [PrismaModule],
  controllers: [MessagingController],
  providers: [MessagingService],
  exports: [MessagingService],
})
export class MessagingModule {}
