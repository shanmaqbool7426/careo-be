import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { DirectoryMakesQueryDto, DirectoryModelsQueryDto } from './dto/directory-query.dto';
import { VehicleDirectoryService } from './vehicle-directory.service';

@ApiTags('vehicle-directory')
@Controller('vehicle-directory')
export class VehicleDirectoryController {
  constructor(private readonly directory: VehicleDirectoryService) {}

  @Public()
  @Get('makes')
  @ApiOperation({
    summary: 'List vehicle makes',
    description:
      'Optional `category` filters to makes that have at least one model in that vertical (CAR, MOTORCYCLE, TRUCK, …).',
  })
  listMakes(@Query() query: DirectoryMakesQueryDto) {
    return this.directory.listMakes(query.tenantSlug, query.category);
  }

  @Public()
  @Get('makes/:makeId/models')
  @ApiOperation({ summary: 'Models for a make (optional category filter)' })
  listModels(@Param('makeId') makeId: string, @Query() query: DirectoryModelsQueryDto) {
    return this.directory.listModels(makeId, query.tenantSlug, query.category);
  }

  @Public()
  @Get('models/:modelId/generations')
  @ApiOperation({ summary: 'Generations for a model' })
  listGenerations(@Param('modelId') modelId: string) {
    return this.directory.listGenerations(modelId);
  }

  @Public()
  @Get('generations/:generationId/variants')
  @ApiOperation({ summary: 'Variants for a generation' })
  listVariants(@Param('generationId') generationId: string) {
    return this.directory.listVariants(generationId);
  }

  @Public()
  @Get('variants/:variantId')
  @ApiOperation({ summary: 'Variant detail + latest spec version' })
  getVariant(@Param('variantId') variantId: string) {
    return this.directory.getVariantDetail(variantId);
  }
}
