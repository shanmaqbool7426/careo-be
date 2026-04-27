import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CmsService } from './cms.service';
import { ListBlogsQueryDto, ListVideosQueryDto } from './dto/cms.query.dto';

@ApiTags('cms')
@Controller('cms')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  // ── Blog ─────────────────────────────────────────────────────────────────

  @Public()
  @Get('blogs')
  @ApiOperation({
    summary: 'List published blogs (filter by category, search, featured)',
  })
  getBlogs(@Query() query: ListBlogsQueryDto, @Query('tenantSlug') tenantSlug?: string) {
    return this.cmsService.getAllBlogs(query, tenantSlug);
  }

  @Public()
  @Get('blogs/slug/:slug')
  @ApiOperation({ summary: 'Get blog post by slug' })
  getBlogBySlug(@Param('slug') slug: string, @Query('tenantSlug') tenantSlug?: string) {
    return this.cmsService.getBlogBySlug(slug, tenantSlug);
  }

  @Public()
  @Get('blogs/:id')
  @ApiOperation({ summary: 'Get blog post by ID' })
  getBlogById(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.getBlogById(id);
  }

  // ── Videos ────────────────────────────────────────────────────────────────

  @Public()
  @Get('videos')
  @ApiOperation({ summary: 'List videos (filter by category, brand, search)' })
  getVideos(@Query() query: ListVideosQueryDto, @Query('tenantSlug') tenantSlug?: string) {
    return this.cmsService.getAllVideos(query, tenantSlug);
  }

  // ── FAQs ──────────────────────────────────────────────────────────────────

  @Public()
  @Get('faqs')
  @ApiOperation({ summary: 'Get all FAQs' })
  getAllFaqs(@Query('tenantSlug') tenantSlug?: string) {
    return this.cmsService.getAllFaqs(tenantSlug);
  }

  @Public()
  @Get('faqs/make/:makeId')
  @ApiOperation({ summary: 'Get FAQs for a specific brand/make' })
  getBrandFaqs(@Param('makeId', ParseUUIDPipe) makeId: string) {
    return this.cmsService.getBrandFaqs(makeId);
  }

  // ── Newsletter ────────────────────────────────────────────────────────────

  @Public()
  @Post('newsletter/subscribe')
  @ApiOperation({ summary: 'Subscribe to newsletter' })
  subscribe(@Body('email') email: string) {
    return this.cmsService.subscribe(email);
  }

  @Public()
  @Post('newsletter/unsubscribe')
  @ApiOperation({ summary: 'Unsubscribe from newsletter' })
  unsubscribe(@Body('email') email: string) {
    return this.cmsService.unsubscribe(email);
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  @Public()
  @Get('stats')
  @ApiOperation({ summary: 'Site-wide stats: total vehicles, dealers, reviews' })
  getSiteStats(@Query('tenantSlug') tenantSlug?: string) {
    return this.cmsService.getSiteStats(tenantSlug);
  }
}
