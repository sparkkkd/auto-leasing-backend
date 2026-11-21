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
import { InvestorsService } from './investors.service';
import {
  CreateInvestorDto,
  UpdateInvestorDto,
  FindAllInvestorsDto,
} from './dto';
import { UserRole } from '@prisma/client';
import { RolesGuard } from 'src/auth/guards';
import { Roles } from 'src/auth/decorators';

@Controller('investors')
@UseGuards(RolesGuard)
export class InvestorsController {
  constructor(private readonly investorsService: InvestorsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  findAll(@Query() query: FindAllInvestorsDto) {
    return this.investorsService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  findOne(@Param('id') id: string) {
    return this.investorsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(@Body() createInvestorDto: CreateInvestorDto) {
    return this.investorsService.create(createInvestorDto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(
    @Param('id') id: string,
    @Body() updateInvestorDto: UpdateInvestorDto,
  ) {
    return this.investorsService.update(id, updateInvestorDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.investorsService.remove(id);
  }
}
