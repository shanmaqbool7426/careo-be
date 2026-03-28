import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CmsService } from './cms.service';

@ApiTags('cms')
@Controller('cms')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Public()
  @Get('blogs')
  @ApiOperation({ summary: 'List published blogs' })
  getBlogs(@Query('tenantSlug') tenantSlug?: string) {
    return this.cmsService.getAllBlogs(tenantSlug);
  }

  @Public()
  @Get('videos')
  @ApiOperation({ summary: 'List published videos' })
  getVideos(@Query('tenantSlug') tenantSlug?: string) {
    return this.cmsService.getAllVideos(tenantSlug);
  }

  @Public()
  @Get('faqs/:makeId')
  @ApiOperation({ summary: 'Get FAQs by Brand/Make' })
  getFaqs(@Param('makeId') makeId: string) {
    return this.cmsService.getBrandFaqs(makeId);
  }
}
