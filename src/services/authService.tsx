// Validar token recibido del callback de Google
validateToken: async (token: string): Promise<User> => {
  console.log('🔐 AuthService - Validando token...');
  // Guardar token en localStorage
  localStorage.setItem('access_token', token);
  console.log('💾 AuthService - Token guardado en localStorage');
  
  // Obtener datos del usuario con el token
  try {
    console.log('📡 AuthService - Solicitando perfil del usuario...');
    const response = await api.get('/auth/profile');
    console.log('👤 AuthService - Perfil recibido:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ AuthService - Error al obtener perfil:', error);
    // Si hay error, remover token inválido
    localStorage.removeItem('access_token');
    throw error;
  }
}, 