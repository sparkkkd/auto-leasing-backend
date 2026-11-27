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
import { DealsService } from './deals.service';
import { CreateDealDto, UpdateDealDto, FindAllDealsDto } from './dto';
import { UserRole } from '@prisma/client';
import { RolesGuard } from 'src/auth/guards';
import { Roles } from 'src/auth/decorators';
import { OverduePaymentDto } from './dto/overdue-payment.dto';

@Controller('deals')
@UseGuards(RolesGuard)
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get('overdue')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  getOverduePayments(): Promise<OverduePaymentDto[]> {
    return this.dealsService.getOverduePayments();
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  findAll(@Query() query: FindAllDealsDto) {
    return this.dealsService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  findOne(@Param('id') id: string) {
    return this.dealsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(@Body() createDealDto: CreateDealDto) {
    return this.dealsService.create(createDealDto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(@Param('id') id: string, @Body() updateDealDto: UpdateDealDto) {
    return this.dealsService.update(id, updateDealDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.dealsService.remove(id);
  }
}
