import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Ticket } from './ticket.entity';

export enum RemoteSessionEstado {
  SOLICITADA = 'solicitada',
  ACEPTADA = 'aceptada',
  ACTIVA = 'activa',
  FINALIZADA = 'finalizada'
}

@Entity('remote_sessions')
export class RemoteSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ticketId: string;

  @Column()
  operadorId: string;

  @Column()
  clienteId: string;

  @Column({
    type: 'enum',
    enum: RemoteSessionEstado,
    default: RemoteSessionEstado.SOLICITADA
  })
  estado: RemoteSessionEstado;

  @Column({ nullable: true })
  sessionId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => Ticket, ticket => ticket.sesionesRemotas)
  @JoinColumn({ name: 'ticketId' })
  ticket: Ticket;

  @ManyToOne(() => User, user => user.sesionesComoOperador)
  @JoinColumn({ name: 'operadorId' })
  operador: User;

  @ManyToOne(() => User, user => user.sesionesComoCliente)
  @JoinColumn({ name: 'clienteId' })
  cliente: User;
} 