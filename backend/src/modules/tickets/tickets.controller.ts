import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto, UpdateTicketDto, AssignOperatorDto } from './dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  async findAll(@Request() req, @Query('estado') estado?: string) {
    return this.ticketsService.findAll(req.user.id, req.user.role, estado);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.ticketsService.findOne(id, req.user.id, req.user.role);
  }

  @Post()
  async create(@Body() createTicketDto: CreateTicketDto, @Request() req) {
    return this.ticketsService.create(createTicketDto, req.user.id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto, @Request() req) {
    return this.ticketsService.update(id, updateTicketDto, req.user.id, req.user.role);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    return this.ticketsService.remove(id, req.user.id, req.user.role);
  }

  @Put(':id/assign')
  async assignOperator(@Param('id') id: string, @Body() assignDto: AssignOperatorDto, @Request() req) {
    return this.ticketsService.assignOperator(id, assignDto.operadorId, req.user.id, req.user.role);
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body('estado') estado: string, @Request() req) {
    return this.ticketsService.updateStatus(id, estado, req.user.id, req.user.role);
  }

  @Put(':id/resolve')
  async resolveTicket(@Param('id') id: string, @Body('solucion') solucion: string, @Request() req) {
    return this.ticketsService.resolveTicket(id, solucion, req.user.id, req.user.role);
  }

  @Get(':id/messages')
  async getMessages(@Param('id') id: string, @Request() req) {
    return this.ticketsService.getMessages(id, req.user.id, req.user.role);
  }

  @Post(':id/messages')
  async addMessage(@Param('id') id: string, @Body('contenido') contenido: string, @Request() req) {
    return this.ticketsService.addMessage(id, contenido, req.user.id);
  }

  @Get('stats/dashboard')
  async getDashboardStats(@Request() req) {
    return this.ticketsService.getDashboardStats(req.user.id, req.user.role);
  }
} 