import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket, TicketEstado } from '../../entities/ticket.entity';
import { User } from '../../entities/user.entity';
import { TicketMessage } from '../../entities/ticket-message.entity';
import { CreateTicketDto, UpdateTicketDto } from './dto';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private ticketsRepository: Repository<Ticket>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(TicketMessage)
    private messagesRepository: Repository<TicketMessage>,
  ) {}

  async findAll(userId: string, userRole: string, estado?: string) {
    const queryBuilder = this.ticketsRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.cliente', 'cliente')
      .leftJoinAndSelect('ticket.operador', 'operador')
      .leftJoinAndSelect('ticket.mensajes', 'mensajes')
      .orderBy('ticket.createdAt', 'DESC');

    // Filtrar por rol de usuario
    if (userRole === 'cliente') {
      queryBuilder.andWhere('ticket.clienteId = :userId', { userId });
    } else if (userRole === 'operador') {
      queryBuilder.andWhere('(ticket.operadorId = :userId OR ticket.operadorId IS NULL)', { userId });
    }

    // Filtrar por estado si se proporciona
    if (estado) {
      queryBuilder.andWhere('ticket.estado = :estado', { estado });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string, userId: string, userRole: string) {
    const ticket = await this.ticketsRepository.findOne({
      where: { id },
      relations: ['cliente', 'operador', 'mensajes', 'mensajes.autor'],
    });

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    // Verificar permisos
    if (userRole === 'cliente' && ticket.clienteId !== userId) {
      throw new ForbiddenException('No tienes permisos para ver este ticket');
    }

    return ticket;
  }

  async create(createTicketDto: CreateTicketDto, clienteId: string) {
    const ticket = this.ticketsRepository.create({
      ...createTicketDto,
      clienteId,
      estado: TicketEstado.ABIERTO,
    });

    return this.ticketsRepository.save(ticket);
  }

  async update(id: string, updateTicketDto: UpdateTicketDto, userId: string, userRole: string) {
    const ticket = await this.findOne(id, userId, userRole);
    
    // Verificar permisos de actualización
    if (userRole === 'cliente' && ticket.clienteId !== userId) {
      throw new ForbiddenException('No tienes permisos para actualizar este ticket');
    }

    Object.assign(ticket, updateTicketDto);
    return this.ticketsRepository.save(ticket);
  }

  async remove(id: string, userId: string, userRole: string) {
    const ticket = await this.findOne(id, userId, userRole);
    
    // Solo admins pueden eliminar tickets
    if (userRole !== 'admin') {
      throw new ForbiddenException('Solo los administradores pueden eliminar tickets');
    }

    await this.ticketsRepository.remove(ticket);
    return { message: 'Ticket eliminado correctamente' };
  }

  async assignOperator(ticketId: string, operadorId: string, userId: string, userRole: string) {
    if (userRole !== 'admin' && userRole !== 'operador') {
      throw new ForbiddenException('No tienes permisos para asignar operadores');
    }

    const ticket = await this.ticketsRepository.findOne({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    const operador = await this.usersRepository.findOne({ where: { id: operadorId } });
    if (!operador || operador.role !== 'operador') {
      throw new NotFoundException('Operador no encontrado');
    }

    ticket.operadorId = operadorId;
    ticket.estado = TicketEstado.EN_PROGRESO;
    
    return this.ticketsRepository.save(ticket);
  }

  async updateStatus(ticketId: string, estado: string, userId: string, userRole: string) {
    const ticket = await this.findOne(ticketId, userId, userRole);
    
    // Verificar permisos según el rol
    if (userRole === 'cliente' && !['abierto', 'cerrado'].includes(estado)) {
      throw new ForbiddenException('Los clientes solo pueden reabrir o cerrar tickets');
    }

    ticket.estado = estado as TicketEstado;
    return this.ticketsRepository.save(ticket);
  }

  async resolveTicket(ticketId: string, solucion: string, userId: string, userRole: string) {
    const ticket = await this.findOne(ticketId, userId, userRole);
    
    // Solo operadores y admins pueden resolver tickets
    if (userRole === 'cliente') {
      throw new ForbiddenException('Los clientes no pueden marcar tickets como resueltos');
    }

    ticket.estado = TicketEstado.RESUELTO;
    ticket.solucion = solucion;
    return this.ticketsRepository.save(ticket);
  }

  async getMessages(ticketId: string, userId: string, userRole: string) {
    await this.findOne(ticketId, userId, userRole); // Verificar permisos

    return this.messagesRepository.find({
      where: { ticketId },
      relations: ['autor'],
      order: { createdAt: 'ASC' },
    });
  }

  async addMessage(ticketId: string, contenido: string, autorId: string) {
    const ticket = await this.ticketsRepository.findOne({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    const autor = await this.usersRepository.findOne({ where: { id: autorId } });
    if (!autor) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const message = this.messagesRepository.create({
      contenido,
      ticketId,
      autorId,
      esOperador: autor.role === 'operador' || autor.role === 'admin',
    });

    return this.messagesRepository.save(message);
  }

  async getDashboardStats(userId: string, userRole: string) {
    const queryBuilder = this.ticketsRepository.createQueryBuilder('ticket');

    // Filtrar por rol
    if (userRole === 'cliente') {
      queryBuilder.where('ticket.clienteId = :userId', { userId });
    } else if (userRole === 'operador') {
      queryBuilder.where('ticket.operadorId = :userId', { userId });
    }

    const [
      totalTickets,
      ticketsAbiertos,
      ticketsEnProgreso,
      ticketsResueltos,
      ticketsResueltosHoy,
    ] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder.clone().andWhere('ticket.estado = :estado', { estado: 'abierto' }).getCount(),
      queryBuilder.clone().andWhere('ticket.estado = :estado', { estado: 'en_progreso' }).getCount(),
      queryBuilder.clone().andWhere('ticket.estado = :estado', { estado: 'resuelto' }).getCount(),
      queryBuilder.clone()
        .andWhere('ticket.estado = :estado', { estado: 'resuelto' })
        .andWhere('DATE(ticket.updatedAt) = CURRENT_DATE')
        .getCount(),
    ]);

    return {
      totalTickets,
      ticketsAbiertos,
      ticketsEnProgreso,
      ticketsResueltos,
      ticketsResueltosHoy,
    };
  }
} 