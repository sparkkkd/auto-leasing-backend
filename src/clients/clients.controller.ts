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
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto, FindAllClientsDto } from './dto';
import { UserRole } from '@prisma/client';
import { RolesGuard } from 'src/auth/guards';
import { Roles } from 'src/auth/decorators';
import { DealsService } from 'src/deals/deals.service';
import { ClientPaymentSchedulesDto } from 'src/deals/dto/payment-schedule.dto';

@Controller('clients')
@UseGuards(RolesGuard)
export class ClientsController {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly dealsService: DealsService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  findAll(@Query() query: FindAllClientsDto) {
    return this.clientsService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientsService.update(id, updateClientDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }

  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  @Get(':id/payments/schedule')
  getPaymentSchedule(
    @Param('id') id: string,
  ): Promise<ClientPaymentSchedulesDto> {
    return this.dealsService.getPaymentSchedule(id);
  }
}
