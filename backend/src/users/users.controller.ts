import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UserRole } from '../entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers(@Request() req: any) {
    // Solo admins pueden ver todos los usuarios
    if (req.user.role !== UserRole.ADMIN) {
      throw new Error('No tienes permisos para ver todos los usuarios');
    }
    
    return this.usersService.findAll();
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body('role') role: UserRole,
    @Request() req: any
  ) {
    // Solo admins pueden cambiar roles
    if (req.user.role !== UserRole.ADMIN) {
      throw new Error('No tienes permisos para cambiar roles de usuario');
    }

    return this.usersService.updateUserRole(id, role);
  }

  @Post(':id/promote-to-admin')
  async promoteToAdmin(
    @Param('id') id: string,
    @Request() req: any
  ) {
    // Solo admins pueden promover a admin
    if (req.user.role !== UserRole.ADMIN) {
      throw new Error('No tienes permisos para promover usuarios a administrador');
    }

    return this.usersService.updateUserRole(id, UserRole.ADMIN);
  }
} 