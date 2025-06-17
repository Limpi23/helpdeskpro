import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Ticket } from './ticket.entity';
import { TicketMessage } from './ticket-message.entity';
import { RemoteSession } from './remote-session.entity';

export enum UserRole {
  CLIENTE = 'cliente',
  OPERADOR = 'operador',
  ADMIN = 'admin'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLIENTE
  })
  role: UserRole;

  @Column({ nullable: true })
  googleId: string;

  @Column({ nullable: true, select: false }) // select: false para no incluirla en consultas normales
  password: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @OneToMany(() => Ticket, ticket => ticket.cliente)
  ticketsCreados: Ticket[];

  @OneToMany(() => Ticket, ticket => ticket.operador)
  ticketsAsignados: Ticket[];

  @OneToMany(() => TicketMessage, message => message.autor)
  mensajes: TicketMessage[];

  @OneToMany(() => RemoteSession, session => session.operador)
  sesionesComoOperador: RemoteSession[];

  @OneToMany(() => RemoteSession, session => session.cliente)
  sesionesComoCliente: RemoteSession[];
} 