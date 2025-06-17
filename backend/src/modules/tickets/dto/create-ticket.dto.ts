import { IsString, IsEnum, IsNotEmpty, MaxLength } from 'class-validator';
import { TicketCategoria, TicketPrioridad } from '../../../entities/ticket.entity';

export class CreateTicketDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  titulo: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  descripcion: string;

  @IsEnum(TicketCategoria)
  categoria: TicketCategoria;

  @IsEnum(TicketPrioridad)
  prioridad: TicketPrioridad;
} 