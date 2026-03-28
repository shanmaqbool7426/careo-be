import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DealersService } from './dealers.service';
import { CreateDealerDto } from './dto/create-dealer.dto';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('dealers')
@Controller('dealers')
export class DealersController {
  constructor(private readonly dealersService: DealersService) {}

  @ApiBearerAuth('JWT-auth')
  @Post()
  @ApiOperation({ summary: 'Become a Dealer (Upgrades your profile)' })
  create(@Body() dto: CreateDealerDto, @CurrentUser() user: AuthUser) {
    return this.dealersService.create(dto, user);
  }

  @ApiBearerAuth('JWT-auth')
  @Get('me')
  @ApiOperation({ summary: 'Get my dealer profile' })
  findMe(@CurrentUser() user: AuthUser) {
    return this.dealersService.findMe(user);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all verified dealers' })
  findAll() {
    return this.dealersService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get dealer details by ID' })
  findById(@Param('id') id: string) {
    return this.dealersService.findById(id);
  }
}
