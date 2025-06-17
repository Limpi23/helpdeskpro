import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../entities/user.entity';
import { Ticket } from '../entities/ticket.entity';
import { TicketMessage } from '../entities/ticket-message.entity';
import { RemoteSession } from '../entities/remote-session.entity';

interface CreateAdminParams {
  email: string;
  name: string;
  googleId?: string;
  password?: string;
}

async function createAdmin(params: CreateAdminParams) {
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
    console.log('🔌 Conectado a la base de datos');

    const userRepo = dataSource.getRepository(User);
    
    // Verificar si el usuario ya existe
    const existingUser = await userRepo.findOne({ 
      where: { email: params.email } 
    });

    if (existingUser) {
      if (existingUser.role === UserRole.ADMIN) {
        console.log('⚠️ El usuario ya existe y ya es administrador');
        return existingUser;
      } else {
        // Promover usuario existente a admin
        existingUser.role = UserRole.ADMIN;
        const updatedUser = await userRepo.save(existingUser);
        console.log('⬆️ Usuario existente promovido a administrador');
        console.log(`👑 ${updatedUser.name} (${updatedUser.email}) es ahora ADMIN`);
        return updatedUser;
      }
    }

    // Hash de password por defecto para admins
    const defaultPassword = params.password || 'admin123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // Crear nuevo usuario admin
    const adminUser = userRepo.create({
      email: params.email,
      name: params.name,
      role: UserRole.ADMIN,
      password: hashedPassword,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(params.name)}&background=ef4444&color=fff`,
      googleId: params.googleId || `google-admin-${Date.now()}`,
      isActive: true
    });

    const savedAdmin = await userRepo.save(adminUser);
    
    console.log('✅ ¡Nuevo administrador creado exitosamente!');
    console.log('👑 Detalles del administrador:');
    console.log(`   📧 Email: ${savedAdmin.email}`);
    console.log(`   👤 Nombre: ${savedAdmin.name}`);
    console.log(`   🆔 ID: ${savedAdmin.id}`);
    console.log(`   🎭 Rol: ${savedAdmin.role}`);
    console.log(`   🔐 Password: ${defaultPassword} (temporal)`);
    console.log(`   📅 Creado: ${savedAdmin.createdAt.toISOString()}`);
    
    return savedAdmin;

  } catch (error) {
    console.error('❌ Error al crear administrador:', error);
    throw error;
  } finally {
    await dataSource.destroy();
    console.log('🔌 Conexión cerrada');
  }
}

// Script principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('📋 Uso: pnpm run create-admin <email> <nombre> [password] [googleId]');
    console.log('📋 Ejemplo: pnpm run create-admin admin@miempresa.com "Juan Pérez"');
    console.log('📋 Con password: pnpm run create-admin admin@miempresa.com "Juan Pérez" mipassword123');
    process.exit(1);
  }

  const [email, name, password, googleId] = args;
  
  console.log('🚀 Creando administrador...');
  console.log(`📧 Email: ${email}`);
  console.log(`👤 Nombre: ${name}`);
  if (googleId) console.log(`🔗 Google ID: ${googleId}`);
  
  try {
    await createAdmin({ email, name, password, googleId });
    console.log('🎉 ¡Proceso completado exitosamente!');
  } catch (error) {
    console.error('💥 Error:', error);
    process.exit(1);
  }
}

// Ejecutar script si se llama directamente
if (require.main === module) {
  main();
}

export { createAdmin }; 