// db.js

// PEGA AQUÍ TUS DEFINICIONES DE MOCK_USERS, MOCK_MAQUINARIA, ETC.
// Ejemplo:
const MOCK_USERS = [
  { id: 'user-1', email: 'admin@test.com', password: 'password123', nombre: 'Admin', rol: 'Gerencia' },
  { id: 'user-2', email: 'coord@test.com', password: 'password123', nombre: 'Coordinador', rol: 'Coordinador' },
  // ...otros usuarios
];

const MOCK_MAQUINARIA = [
  { 
    id: 'maq-1', 
    nombre: 'Prensa Hidráulica 01', 
    codigo: 'PH-01', 
    estado: 'Operativo', 
    disponibilidad: 95.5, 
    proximoMantenimiento: '2025-11-15',
    horometroActual: 12345
  },
  // ...otras maquinarias
];

const MOCK_ORDENES_TRABAJO = [
  {
    id: 'ot-1',
    maquinariaId: 'maq-1',
    maquinariaNombre: 'Prensa Hidráulica 01',
    tipo: 'Preventivo',
    estado: 'Cerrada',
    prioridad: 'Media',
    fechaCreacion: '2025-10-20'
  },
  // ...otras órdenes
];

const MOCK_PROVEEDORES = [
  { id: 'prv-1', nombre: 'Proveedor A', contacto: 'contacto@proveedora.com', telefono: '12345678' },
  // ...otros proveedores
];

const MOCK_REPUESTOS = [
  {
    id: 'rep-1',
    nombre: 'Filtro de Aceite X-100',
    sku: 'SKU-123',
    stock: 50,
    stockMinimo: 10,
    proveedorId: 'prv-1',
    proveedorNombre: 'Proveedor A'
  },
  // ...otros repuestos
];

const MOCK_HISTORIAL = [
  {
    id: 'hist-1',
    maquinariaId: 'maq-1',
    fecha: '2025-10-20',
    tipo: 'Preventivo',
    descripcion: 'Mantenimiento preventivo semestral.'
  }
  // ...otro historial
];

const MOCK_NOTIFICACIONES = [
  { id: 'not-1', fecha: '2025-10-30T09:00:00Z', mensaje: 'Stock bajo para Filtro de Aceite X-100', leida: false },
  // ...otras notificaciones
];


// Exporta todos tus datos para que el servidor pueda usarlos
module.exports = {
  MOCK_USERS,
  MOCK_MAQUINARIA,
  MOCK_ORDENES_TRABAJO,
  MOCK_REPUESTOS,
  MOCK_HISTORIAL,
  MOCK_PROVEEDORES,
  MOCK_NOTIFICACIONES,
};