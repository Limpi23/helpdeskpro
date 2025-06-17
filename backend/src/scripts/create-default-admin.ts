import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../entities/user.entity';
import { Ticket } from '../entities/ticket.entity';
import { TicketMessage } from '../entities/ticket-message.entity';
import { RemoteSession } from '../entities/remote-session.entity';

async function createDefaultAdmin() {
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

  try {
    await dataSource.initialize();
    console.log('🔌 Conectado a la base de datos MySQL');

    const userRepo = dataSource.getRepository(User);
    
    // Configuración del admin por defecto
    const adminEmail = 'admin@helpdesk.com';
    const adminPassword = 'admin123'; // Password temporal
    const adminName = 'Administrador del Sistema';

    // Verificar si ya existe un admin
    const existingAdmin = await userRepo.findOne({ 
      where: { email: adminEmail } 
    });

    if (existingAdmin) {
      if (existingAdmin.role === UserRole.ADMIN) {
        console.log('⚠️ El administrador por defecto ya existe');
        console.log(`📧 Email: ${existingAdmin.email}`);
        console.log(`👤 Nombre: ${existingAdmin.name}`);
        console.log(`🔐 Password: ${adminPassword} (temporal)`);
        return existingAdmin;
      } else {
        // Promover usuario existente a admin
        const hashedPassword = await bcrypt.hash(adminPassword, 12);
        existingAdmin.role = UserRole.ADMIN;
        existingAdmin.password = hashedPassword;
        
        const updatedUser = await userRepo.save(existingAdmin);
        console.log('⬆️ Usuario existente promovido a administrador');
        console.log(`👑 ${updatedUser.name} (${updatedUser.email}) es ahora ADMIN`);
        console.log(`🔐 Password: ${adminPassword} (temporal)`);
        return updatedUser;
      }
    }

    // Hash de la password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Crear nuevo usuario admin
    const adminUser = userRepo.create({
      email: adminEmail,
      name: adminName,
      role: UserRole.ADMIN,
      password: hashedPassword,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=ef4444&color=fff`,
      isActive: true
    });

    const savedAdmin = await userRepo.save(adminUser);
    
    console.log('✅ ¡Administrador por defecto creado exitosamente!');
    console.log('👑 Detalles del administrador:');
    console.log(`   📧 Email: ${savedAdmin.email}`);
    console.log(`   👤 Nombre: ${savedAdmin.name}`);
    console.log(`   🆔 ID: ${savedAdmin.id}`);
    console.log(`   🔐 Password: ${adminPassword} (temporal)`);
    console.log('');
    console.log('🛡️ Credenciales de acceso:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('');
    console.log('⚠️ IMPORTANTE: Cambia la password después del primer login');

    return savedAdmin;

  } catch (error) {
    console.error('❌ Error creando administrador por defecto:', error);
    throw error;
  } finally {
    await dataSource.destroy();
    console.log('🔌 Conexión a la base de datos cerrada');
  }
}

// Ejecutar el script
if (require.main === module) {
  createDefaultAdmin()
    .then(() => {
      console.log('🎉 Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script falló:', error);
      process.exit(1);
    });
}

export { createDefaultAdmin }; 