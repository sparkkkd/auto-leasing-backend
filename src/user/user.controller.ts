import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dto';
import { UserRole } from '@prisma/client';
import { RolesGuard } from 'src/auth/guards';
import { CurrentUser, Roles } from 'src/auth/decorators';
import { UserService } from './user.service';

@Controller('users')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  @Delete(':id/permanent')
  delete(@Param('id') id: string, @CurrentUser('id') currentUserId: string) {
    return this.userService.delete(id, currentUserId);
  }
}
