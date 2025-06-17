import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { TicketMessage } from './ticket-message.entity';
import { RemoteSession } from './remote-session.entity';

export enum TicketEstado {
  ABIERTO = 'abierto',
  EN_PROGRESO = 'en_progreso',
  RESUELTO = 'resuelto',
  CERRADO = 'cerrado',
}

export enum TicketPrioridad {
  BAJA = 'baja',
  MEDIA = 'media',
  ALTA = 'alta',
  CRITICA = 'critica',
}

export enum TicketCategoria {
  TECNICO = 'tecnico',
  SOFTWARE = 'software',
  HARDWARE = 'hardware',
  RED = 'red',
  OTRO = 'otro',
}

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titulo: string;

  @Column('text')
  descripcion: string;

  @Column({
    type: 'enum',
    enum: TicketEstado,
    default: TicketEstado.ABIERTO,
  })
  estado: TicketEstado;

  @Column({
    type: 'enum',
    enum: TicketPrioridad,
    default: TicketPrioridad.MEDIA,
  })
  prioridad: TicketPrioridad;

  @Column({
    type: 'enum',
    enum: TicketCategoria,
  })
  categoria: TicketCategoria;

  @Column()
  clienteId: string;

  @Column({ nullable: true })
  operadorId: string;

  @Column('text', { nullable: true })
  solucion: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => User, (user) => user.ticketsCreados)
  @JoinColumn({ name: 'clienteId' })
  cliente: User;

  @ManyToOne(() => User, (user) => user.ticketsAsignados, { nullable: true })
  @JoinColumn({ name: 'operadorId' })
  operador: User;

  @OneToMany(() => TicketMessage, (message) => message.ticket)
  mensajes: TicketMessage[];

  @OneToMany(() => RemoteSession, (session) => session.ticket)
  sesionesRemotas: RemoteSession[];
}