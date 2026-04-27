import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService, UpdateProfileDto, UpdateSettingsDto } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';

@ApiTags('account')
@Controller('account')
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── Profile ──────────────────────────────────────────────────────────────

  @Get('profile')
  @ApiOperation({ summary: 'Get my profile' })
  getProfile(@CurrentUser() user: AuthUser) {
    return this.usersService.findOne(user.id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update my profile (name, phone, bio, location, avatar)' })
  patchProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.update(user.id, dto);
  }

  @Delete('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete account (soft delete)' })
  deleteAccount(@CurrentUser() user: AuthUser) {
    return this.usersService.deleteAccount(user.id);
  }

  // ── Settings ─────────────────────────────────────────────────────────────

  @Get('settings')
  @ApiOperation({ summary: 'Get notification, privacy & display preferences' })
  getSettings(@CurrentUser() user: AuthUser) {
    return this.usersService.getSettings(user.id);
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update preferences (dark mode, language, notifications, privacy)' })
  updateSettings(@CurrentUser() user: AuthUser, @Body() dto: UpdateSettingsDto) {
    return this.usersService.updateSettings(user.id, dto);
  }

  // ── Favorites ─────────────────────────────────────────────────────────────

  @Get('favorites')
  @ApiOperation({ summary: 'Get my saved listings' })
  getFavorites(@CurrentUser() user: AuthUser) {
    return this.usersService.getFavorites(user.id);
  }

  @Post('favorites/:listingId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Save a listing to favorites' })
  addFavorite(
    @CurrentUser() user: AuthUser,
    @Param('listingId', ParseUUIDPipe) listingId: string,
  ) {
    return this.usersService.addFavorite(user.id, listingId);
  }

  @Delete('favorites/:listingId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a listing from favorites' })
  removeFavorite(
    @CurrentUser() user: AuthUser,
    @Param('listingId', ParseUUIDPipe) listingId: string,
  ) {
    return this.usersService.removeFavorite(user.id, listingId);
  }

  // ── Notifications ─────────────────────────────────────────────────────────

  @Get('notifications')
  @ApiOperation({ summary: 'Get my notifications (latest 50)' })
  getNotifications(@CurrentUser() user: AuthUser) {
    return this.usersService.getNotifications(user.id);
  }

  @Put('notifications/read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.usersService.markAllNotificationsRead(user.id);
  }

  @Put('notifications/:id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a single notification as read' })
  markOneRead(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.markNotificationRead(user.id, id);
  }

  // ── My Ads/Listings ───────────────────────────────────────────────────────

  @Get('ads')
  @ApiOperation({ summary: 'Get all my posted listings' })
  getMyListings(@CurrentUser() user: AuthUser) {
    return this.usersService.getMyListings(user.id);
  }
}
