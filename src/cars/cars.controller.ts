import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CarsService } from './cars.service';
import { CreateCarDto, UpdateCarDto, FindAllCarsDto } from './dto';
import { UserRole } from '@prisma/client';
import { RolesGuard } from 'src/auth/guards';
import { Roles } from 'src/auth/decorators';
import { DocumentsService } from 'src/documents/documents.service';

@Controller('cars')
@UseGuards(RolesGuard)
export class CarsController {
  constructor(
    private readonly carsService: CarsService,
    private readonly documentsService: DocumentsService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  findAll(@Query() query: FindAllCarsDto) {
    return this.carsService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  findOne(@Param('id') id: string) {
    return this.carsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(@Body() createCarDto: CreateCarDto) {
    return this.carsService.create(createCarDto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(@Param('id') id: string, @Body() updateCarDto: UpdateCarDto) {
    return this.carsService.update(id, updateCarDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.carsService.remove(id);
  }

  @Get(':id/insurance')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  getCarInsurance(@Param('id') id: string) {
    return this.documentsService.getCarInsurance(id);
  }
}
