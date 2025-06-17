import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ticketService } from '../services/ticketService';

const createTicketSchema = z.object({
  titulo: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(100, 'El título no puede exceder 100 caracteres'),
  descripcion: z.string().min(10, 'La descripción debe tener al menos 10 caracteres').max(1000, 'La descripción no puede exceder 1000 caracteres'),
  categoria: z.enum(['tecnico', 'software', 'hardware', 'red', 'otro'], {
    required_error: 'Debes seleccionar una categoría'
  }),
  prioridad: z.enum(['baja', 'media', 'alta', 'critica'], {
    required_error: 'Debes seleccionar una prioridad'
  })
});

type CreateTicketForm = z.infer<typeof createTicketSchema>;

const CreateTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CreateTicketForm>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      titulo: '',
      descripcion: '',
      categoria: undefined,
      prioridad: 'media'
    }
  });

  const onSubmit = async (data: CreateTicketForm) => {
    try {
      setIsSubmitting(true);
      
      console.log('Creando ticket con datos:', data);
      const newTicket = await ticketService.createTicket(data);
      console.log('Ticket creado exitosamente:', newTicket);
      
      // Mostrar mensaje de éxito y redirigir a la lista de tickets
      alert('¡Ticket creado exitosamente!');
      
      // Limpiar formulario
      reset();
      
      // Navegar a la lista de tickets
      navigate('/tickets');
    } catch (error: any) {
      console.error('Error al crear ticket:', error);
      
      // Mostrar error más específico
      if (error?.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else if (error?.message) {
        alert(`Error: ${error.message}`);
      } else {
        alert('Error al crear el ticket. Por favor, intenta de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const categorias = [
    { value: 'tecnico', label: 'Soporte Técnico', icon: '🔧' },
    { value: 'software', label: 'Problemas de Software', icon: '💻' },
    { value: 'hardware', label: 'Problemas de Hardware', icon: '🖥️' },
    { value: 'red', label: 'Problemas de Red', icon: '🌐' },
    { value: 'otro', label: 'Otro', icon: '📋' }
  ];

  const prioridades = [
    { value: 'baja', label: 'Baja', color: 'text-green-600', description: 'No urgente, puede esperar varios días' },
    { value: 'media', label: 'Media', color: 'text-yellow-600', description: 'Moderadamente importante, resolver en 1-2 días' },
    { value: 'alta', label: 'Alta', color: 'text-red-600', description: 'Importante, resolver dentro del día' },
    { value: 'critica', label: 'Crítica', color: 'text-red-800', description: 'Extremadamente urgente, resolver inmediatamente' }
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <button
                onClick={() => navigate('/tickets')}
                className="text-gray-400 hover:text-gray-500"
              >
                Tickets
              </button>
            </li>
            <li>
              <div className="flex items-center">
                <span className="text-gray-400">→</span>
                <span className="ml-4 text-sm font-medium text-gray-500">Nuevo Ticket</span>
              </div>
            </li>
          </ol>
        </nav>
        <div className="mt-4">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Crear Nuevo Ticket
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Describe tu problema para que nuestro equipo de soporte pueda ayudarte
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="space-y-6">
                  {/* Título */}
                  <div>
                    <label htmlFor="titulo" className="block text-sm font-medium text-gray-700">
                      Título del problema *
                    </label>
                    <Controller
                      name="titulo"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          id="titulo"
                          className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                            errors.titulo ? 'border-red-300' : ''
                          }`}
                          placeholder="Ej: Error al iniciar sesión en el sistema"
                        />
                      )}
                    />
                    {errors.titulo && (
                      <p className="mt-2 text-sm text-red-600">{errors.titulo.message}</p>
                    )}
                  </div>

                  {/* Categoría */}
                  <div>
                    <label htmlFor="categoria" className="block text-sm font-medium text-gray-700">
                      Categoría *
                    </label>
                    <Controller
                      name="categoria"
                      control={control}
                      render={({ field }) => (
                        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {categorias.map((categoria) => (
                            <label
                              key={categoria.value}
                              className={`relative flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                                field.value === categoria.value
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-300'
                              }`}
                            >
                              <input
                                type="radio"
                                {...field}
                                value={categoria.value}
                                checked={field.value === categoria.value}
                                className="sr-only"
                              />
                              <span className="text-lg mr-3">{categoria.icon}</span>
                              <span className="text-sm font-medium text-gray-900">
                                {categoria.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    />
                    {errors.categoria && (
                      <p className="mt-2 text-sm text-red-600">{errors.categoria.message}</p>
                    )}
                  </div>

                  {/* Prioridad */}
                  <div>
                    <label htmlFor="prioridad" className="block text-sm font-medium text-gray-700">
                      Prioridad *
                    </label>
                    <Controller
                      name="prioridad"
                      control={control}
                      render={({ field }) => (
                        <div className="mt-2 space-y-2">
                          {prioridades.map((prioridad) => (
                            <label
                              key={prioridad.value}
                              className={`relative flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                                field.value === prioridad.value
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-300'
                              }`}
                            >
                              <input
                                type="radio"
                                {...field}
                                value={prioridad.value}
                                checked={field.value === prioridad.value}
                                className="sr-only"
                              />
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <span className={`text-sm font-medium ${prioridad.color}`}>
                                    {prioridad.label}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {prioridad.description}
                                </p>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    />
                    {errors.prioridad && (
                      <p className="mt-2 text-sm text-red-600">{errors.prioridad.message}</p>
                    )}
                  </div>

                  {/* Descripción */}
                  <div>
                    <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
                      Descripción detallada *
                    </label>
                    <Controller
                      name="descripcion"
                      control={control}
                      render={({ field }) => (
                        <textarea
                          {...field}
                          id="descripcion"
                          rows={6}
                          className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                            errors.descripcion ? 'border-red-300' : ''
                          }`}
                          placeholder="Describe el problema en detalle, incluyendo los pasos para reproducirlo, mensajes de error, y cualquier información relevante..."
                        />
                      )}
                    />
                    {errors.descripcion && (
                      <p className="mt-2 text-sm text-red-600">{errors.descripcion.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/tickets')}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creando...' : 'Crear Ticket'}
              </button>
            </div>
          </form>
        </div>

        {/* Información de ayuda */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                💡 Consejos para un mejor soporte
              </h3>
              <div className="space-y-4 text-sm text-gray-600">
                <div>
                  <h4 className="font-medium text-gray-900">Sea específico</h4>
                  <p>Incluya detalles sobre cuándo ocurrió el problema y qué estaba haciendo.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Mensajes de error</h4>
                  <p>Si aparece algún mensaje de error, cópielo exactamente como aparece.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Pasos para reproducir</h4>
                  <p>Describa los pasos exactos que llevan al problema.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Información del sistema</h4>
                  <p>Mencione el sistema operativo, navegador, o aplicación donde ocurre.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                🚀 ¿Necesita ayuda inmediata?
              </h3>
              <p className="text-sm text-blue-700 mb-4">
                Para problemas críticos, también puede contactarnos directamente:
              </p>
              <div className="space-y-2 text-sm text-blue-700">
                <p>📞 Teléfono: +1 (555) 123-4567</p>
                <p>📧 Email: soporte@empresa.com</p>
                <p>💬 Chat en vivo: disponible 24/7</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTicketPage; 