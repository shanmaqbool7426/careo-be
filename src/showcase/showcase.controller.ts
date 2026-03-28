import { Controller, Get, Param, Query, ParseEnumPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { NewCarShelf } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { ShowcaseService } from './showcase.service';

@ApiTags('showcase')
@Controller('showcase')
export class ShowcaseController {
  constructor(private readonly showcase: ShowcaseService) {}

  @Public()
  @Get(':shelf')
  @ApiOperation({ summary: 'New-car showcase rail (UPCOMING | POPULAR | NEWLY_LAUNCHED)' })
  listByShelf(
    @Param('shelf', new ParseEnumPipe(NewCarShelf)) shelf: NewCarShelf,
    @Query('tenantSlug') tenantSlug?: string,
  ) {
    return this.showcase.listByShelf(shelf, tenantSlug);
  }
}
