import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CreateListingDto } from './dto/create-listing.dto';
import { ListListingsQueryDto } from './dto/list-listings.query.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { ListingsService } from './listings.service';

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'List published listings (cursor pagination)',
    description: 'Filter by `vehicleCategory` (CAR, MOTORCYCLE, TRUCK, …) to match directory verticals.',
  })
  list(@Query() query: ListListingsQueryDto) {
    return this.listings.list(query);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get published listing by slug' })
  findBySlug(
    @Param('slug') slug: string,
    @Query('tenantSlug') tenantSlug?: string,
  ) {
    return this.listings.findPublicBySlug(slug, tenantSlug);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get published listing by id' })
  findOne(@Param('id') id: string, @Query('tenantSlug') tenantSlug?: string) {
    return this.listings.findPublicById(id, tenantSlug);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create listing (requires listing:write)' })
  @RequirePermissions('listing:write')
  @UseGuards(PermissionsGuard)
  create(@Body() dto: CreateListingDto, @CurrentUser() user: AuthUser) {
    return this.listings.create(dto, user);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update listing (owner or admin)' })
  @RequirePermissions('listing:write')
  @UseGuards(PermissionsGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.listings.update(id, dto, user);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Soft-delete listing' })
  @RequirePermissions('listing:write')
  @UseGuards(PermissionsGuard)
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.listings.remove(id, user);
  }
}
