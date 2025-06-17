# 🎯 AppDeskTauri - Sistema de HelpDesk con Acceso Remoto

<div align="center">
  <img src="public/tauri.svg" alt="AppDeskTauri Logo" width="120" height="120">
  
  **Una aplicación de escritorio moderna para gestión de tickets con capacidades de acceso remoto**
  
  [![Tauri](https://img.shields.io/badge/Tauri-2.0-blue.svg)](https://tauri.app)
  [![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org)
  [![NestJS](https://img.shields.io/badge/NestJS-11-red.svg)](https://nestjs.com)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://typescriptlang.org)
</div>

## 🚀 Características Principales

- **🎫 Gestión de Tickets**: Sistema completo de tickets con estados, prioridades y categorías
- **👥 Roles de Usuario**: Cliente, Operador y Administrador con permisos específicos
- **🔐 Autenticación**: Login con Google OAuth 2.0
- **📱 Acceso Remoto**: Conexión remota con WebRTC para soporte técnico
- **💬 Chat en Tiempo Real**: Mensajería instantánea con WebSockets
- **🖥️ Aplicación de Escritorio**: Nativa para Windows, macOS y Linux con Tauri

## 🏗️ Arquitectura del Proyecto

```
AppDeskTauri/
├── 📱 Frontend (Tauri + React)
│   ├── src/                 # Código fuente React
│   ├── src-tauri/          # Configuración Tauri
│   └── public/             # Assets estáticos
├── 🚀 Backend (NestJS)
│   ├── src/                # Código fuente NestJS
│   ├── dist/               # Build de producción
│   └── test/               # Tests
└── 📚 Docs & Config
    ├── .github/            # CI/CD workflows
    └── docker-compose.yml  # Desarrollo local
```

## 🛠️ Stack Tecnológico

### Frontend
- **Tauri 2.0** - Framework de aplicaciones de escritorio
- **React 18** - Biblioteca de interfaz de usuario
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework de estilos
- **React Query** - Gestión de estado del servidor
- **Socket.IO Client** - WebSockets para tiempo real
- **WebRTC** - Comunicación peer-to-peer

### Backend
- **NestJS 11** - Framework Node.js
- **TypeORM** - ORM para base de datos
- **MySQL** - Base de datos relacional
- **Socket.IO** - WebSockets para tiempo real
- **Passport.js** - Autenticación
- **JWT** - Tokens de acceso

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18+
- pnpm
- Rust (para Tauri)
- MySQL

### Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/AppDeskTauri.git
cd AppDeskTauri
```

2. **Instalar dependencias del frontend**
```bash
pnpm install
```

3. **Instalar dependencias del backend**
```bash
cd backend
pnpm install
```

4. **Configurar base de datos**
```bash
# Crear base de datos MySQL
mysql -u root -p
CREATE DATABASE helpdesktauri;
```

5. **Configurar variables de entorno**
```bash
# Backend
cd backend
cp .env.example .env
# Editar .env con tus credenciales
```

### Desarrollo

1. **Iniciar el backend**
```bash
cd backend
pnpm run start:dev
```

2. **Iniciar el frontend (en otra terminal)**
```bash
pnpm run tauri dev
```

La aplicación se abrirá automáticamente como aplicación de escritorio.

## 📦 Build y Distribución

### Build de Desarrollo
```bash
# Frontend
pnpm run build

# Backend
cd backend
pnpm run build
```

### Generar Instalador
```bash
# Generar instalador para tu plataforma
pnpm run tauri build

# Los instaladores se generan en src-tauri/target/release/bundle/
```

### Deploy en Railway

1. **Backend**
   - Conectar repositorio a Railway
   - Configurar variables de entorno
   - Agregar base de datos MySQL

2. **Frontend**
   - Actualizar URLs de API en variables de entorno
   - Generar build de producción

## 🔧 Configuración

### Variables de Entorno

**Backend (.env)**
```bash
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=tu_password
DB_DATABASE=helpdesktauri
JWT_SECRET=tu_jwt_secret
PORT=3001
```

**Frontend (.env)**
```bash
VITE_API_URL=http://localhost:3001/api
```

## 📱 Funcionalidades

### Para Clientes
- ✅ Crear tickets de soporte
- ✅ Ver estado de tickets
- ✅ Chat con operadores
- ✅ Aceptar/rechazar acceso remoto

### Para Operadores
- ✅ Ver todos los tickets asignados
- ✅ Responder tickets
- ✅ Solicitar acceso remoto
- ✅ Ver pantalla del cliente

### Para Administradores
- ✅ Gestionar usuarios
- ✅ Asignar operadores
- ✅ Reportes y estadísticas
- ✅ Configuración del sistema

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:
- 🐛 [Reportar un bug](https://github.com/tu-usuario/AppDeskTauri/issues)
- 💬 [Discusiones](https://github.com/tu-usuario/AppDeskTauri/discussions)
- 📧 Email: tu-email@ejemplo.com

## 🙏 Agradecimientos

- [Tauri](https://tauri.app) - Por el increíble framework
- [NestJS](https://nestjs.com) - Por el robusto framework backend
- [Railway](https://railway.app) - Por el hosting simplificado

---

<div align="center">
  Hecho con ❤️ por [Tu Nombre]
</div>
