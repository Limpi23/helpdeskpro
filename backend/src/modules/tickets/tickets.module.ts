import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { Ticket } from '../../entities/ticket.entity';
import { User } from '../../entities/user.entity';
import { TicketMessage } from '../../entities/ticket-message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, User, TicketMessage])],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {} 