import { IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import {
  TicketCategoria,
  TicketPrioridad,
  TicketEstado,
} from '../../../entities/ticket.entity';

export class UpdateTicketDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  titulo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descripcion?: string;

  @IsOptional()
  @IsEnum(TicketCategoria)
  categoria?: TicketCategoria;

  @IsOptional()
  @IsEnum(TicketPrioridad)
  prioridad?: TicketPrioridad;

  @IsOptional()
  @IsEnum(TicketEstado)
  estado?: TicketEstado;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  solucion?: string;
} 