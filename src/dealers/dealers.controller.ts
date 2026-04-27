import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DealersService } from './dealers.service';
import { CreateDealerDto, UpdateDealerDto } from './dto/create-dealer.dto';
import { ListDealersQueryDto } from './dto/list-dealers.query.dto';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('dealers')
@Controller('dealers')
export class DealersController {
  constructor(private readonly dealersService: DealersService) {}

  // ── Public ────────────────────────────────────────────────────────────────

  @Public()
  @Get()
  @ApiOperation({ summary: 'List dealers (filterable by specialty, city, search, sort)' })
  findAll(@Query() query: ListDealersQueryDto) {
    return this.dealersService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get dealer by ID with listings & reviews' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.dealersService.findById(id);
  }

  // ── Auth: my dealer profile ───────────────────────────────────────────────

  @ApiBearerAuth('JWT-auth')
  @Post()
  @ApiOperation({ summary: 'Register as a dealer' })
  create(@Body() dto: CreateDealerDto, @CurrentUser() user: AuthUser) {
    return this.dealersService.create(dto, user);
  }

  @ApiBearerAuth('JWT-auth')
  @Get('me/profile')
  @ApiOperation({ summary: 'Get my dealer profile' })
  findMe(@CurrentUser() user: AuthUser) {
    return this.dealersService.findMe(user);
  }

  @ApiBearerAuth('JWT-auth')
  @Patch('me/profile')
  @ApiOperation({ summary: 'Update my dealer profile' })
  updateMe(@Body() dto: UpdateDealerDto, @CurrentUser() user: AuthUser) {
    return this.dealersService.updateMe(dto, user);
  }

  // ── Dealer Hub ────────────────────────────────────────────────────────────

  @ApiBearerAuth('JWT-auth')
  @Get('me/inventory')
  @ApiOperation({ summary: 'Dealer Hub — my inventory with stats' })
  getInventory(@CurrentUser() user: AuthUser, @Query('q') q?: string) {
    return this.dealersService.getMyInventory(user, q);
  }

  @ApiBearerAuth('JWT-auth')
  @Get('me/leads')
  @ApiOperation({ summary: 'Dealer Hub — incoming leads (offers)' })
  getLeads(@CurrentUser() user: AuthUser) {
    return this.dealersService.getMyLeads(user);
  }

  @ApiBearerAuth('JWT-auth')
  @Get('me/analytics')
  @ApiOperation({ summary: 'Dealer Hub — views, leads, rating analytics' })
  getAnalytics(@CurrentUser() user: AuthUser) {
    return this.dealersService.getMyAnalytics(user);
  }
}
