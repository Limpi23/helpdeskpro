import { DataSource } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { Ticket, TicketEstado, TicketPrioridad, TicketCategoria } from '../entities/ticket.entity';
import { TicketMessage } from '../entities/ticket-message.entity';
import { RemoteSession } from '../entities/remote-session.entity';

async function seed() {
  // Configuración de conexión a la base de datos
  const dataSource = new DataSource({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'Jonathanb22',
    database: 'helpdesktauri',
    entities: [User, Ticket, TicketMessage, RemoteSession],
    synchronize: true,
  });

  await dataSource.initialize();

  // Crear usuarios de muestra (solo si no existen)
  const userRepo = dataSource.getRepository(User);
  
  // Verificar si ya hay datos
  const existingUsers = await userRepo.find();
  if (existingUsers.length > 0) {
    console.log('ℹ️ Datos ya existen en la base de datos');
    await dataSource.destroy();
    return;
  }

  // Cliente de desarrollo
  const devUser = userRepo.create({
    email: 'dev@example.com',
    name: 'Usuario de Desarrollo',
    role: UserRole.CLIENTE,
    avatar: 'https://ui-avatars.com/api/?name=Usuario+Desarrollo&background=3b82f6&color=fff',
    googleId: 'google-dev-123',
  });

  // Operador de muestra
  const operador = userRepo.create({
    email: 'operador@helpdesk.com',
    name: 'María González',
    role: UserRole.OPERADOR,
    avatar: 'https://ui-avatars.com/api/?name=Maria+Gonzalez&background=10b981&color=fff',
    googleId: 'google-operador-456',
  });

  // Admin de muestra
  const admin = userRepo.create({
    email: 'admin@helpdesk.com',
    name: 'Carlos Admin',
    role: UserRole.ADMIN,
    avatar: 'https://ui-avatars.com/api/?name=Carlos+Admin&background=ef4444&color=fff',
    googleId: 'google-admin-789',
  });

  const savedUsers = await userRepo.save([devUser, operador, admin]);

  // Crear tickets de muestra
  const ticketRepo = dataSource.getRepository(Ticket);
  
  const tickets = [
    ticketRepo.create({
      titulo: 'Error en sistema de facturación',
      descripcion: 'El sistema no genera facturas correctamente desde ayer. Cuando intento crear una factura nueva, aparece un error y no se guarda la información.',
      estado: TicketEstado.EN_PROGRESO,
      prioridad: TicketPrioridad.ALTA,
      categoria: TicketCategoria.SOFTWARE,
      clienteId: savedUsers[0].id,
      operadorId: savedUsers[1].id,
    }),
    ticketRepo.create({
      titulo: 'Problema de conexión VPN',
      descripcion: 'No puedo conectarme a la VPN corporativa desde mi computadora personal.',
      estado: TicketEstado.ABIERTO,
      prioridad: TicketPrioridad.MEDIA,
      categoria: TicketCategoria.RED,
      clienteId: savedUsers[0].id,
    }),
    ticketRepo.create({
      titulo: 'Solicitud nueva licencia',
      descripcion: 'Necesito una licencia adicional para el software de diseño.',
      estado: TicketEstado.RESUELTO,
      prioridad: TicketPrioridad.BAJA,
      categoria: TicketCategoria.SOFTWARE,
      clienteId: savedUsers[0].id,
      operadorId: savedUsers[1].id,
    }),
    ticketRepo.create({
      titulo: 'Computadora lenta',
      descripcion: 'Mi computadora funciona muy lento desde ayer, especialmente al abrir aplicaciones.',
      estado: TicketEstado.ABIERTO,
      prioridad: TicketPrioridad.MEDIA,
      categoria: TicketCategoria.HARDWARE,
      clienteId: savedUsers[0].id,
    }),
    ticketRepo.create({
      titulo: 'Error al imprimir documentos',
      descripcion: 'La impresora no responde cuando trato de imprimir documentos importantes.',
      estado: TicketEstado.CERRADO,
      prioridad: TicketPrioridad.BAJA,
      categoria: TicketCategoria.HARDWARE,
      clienteId: savedUsers[0].id,
      operadorId: savedUsers[1].id,
    }),
  ];

  const savedTickets = await ticketRepo.save(tickets);

  // Crear mensajes de muestra
  const messageRepo = dataSource.getRepository(TicketMessage);
  
  const messages = [
    messageRepo.create({
      contenido: 'Hola, tengo un problema con el sistema de facturación. No puedo generar facturas nuevas.',
      ticketId: savedTickets[0].id,
      autorId: savedUsers[0].id,
      esOperador: false,
    }),
    messageRepo.create({
      contenido: 'Hola, gracias por contactarnos. He revisado el sistema y veo que hay un problema con el servidor de facturación. Estoy trabajando en solucionarlo.',
      ticketId: savedTickets[0].id,
      autorId: savedUsers[1].id,
      esOperador: true,
    }),
    messageRepo.create({
      contenido: '¿Necesitas que te muestre exactamente dónde ocurre el error? Puedo compartir mi pantalla.',
      ticketId: savedTickets[0].id,
      autorId: savedUsers[0].id,
      esOperador: false,
    }),
    messageRepo.create({
      contenido: 'Sí, eso sería muy útil. Te enviaré una solicitud de acceso remoto para ver el problema directamente.',
      ticketId: savedTickets[0].id,
      autorId: savedUsers[1].id,
      esOperador: true,
    }),
  ];

  await messageRepo.save(messages);

  console.log('✅ Datos de seed creados exitosamente');
  console.log('👤 Usuarios creados:');
  console.log(`   - Cliente: ${savedUsers[0].email} (ID: ${savedUsers[0].id})`);
  console.log(`   - Operador: ${savedUsers[1].email} (ID: ${savedUsers[1].id})`);
  console.log(`   - Admin: ${savedUsers[2].email} (ID: ${savedUsers[2].id})`);
  console.log('🎫 Tickets creados:', savedTickets.length);
  console.log('💬 Mensajes creados:', messages.length);

  await dataSource.destroy();
}

seed().catch(console.error); 