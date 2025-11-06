// index.js
require("dotenv").config(); // Carga las variables de .env
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const db = require("./db/index");
const http = require("http"); // Módulo nativo de Node
const { Server } = require("socket.io"); // Librería de Socket.IO
const { guardarMensaje } = require("./controllers/mensajesController");

const app = express();

// --- Middlewares ---
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Private-Network", "true");
  next();
});
app.use(cors());
app.use(express.json());

const usuariosRoutes = require("./routes/usuarios");
const maquinariaRoutes = require("./routes/maquinaria");
const ordenesTrabajoRoutes = require("./routes/ordenesTrabajo");
const mensajesRoutes = require("./routes/mensajes");

// Prefijo para todas las rutas de la API
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/maquinaria", maquinariaRoutes);
app.use("/api/ordenes", ordenesTrabajoRoutes);
app.use("/api/mensajes", mensajesRoutes);
app.get("/api/notificaciones/horometro", (req, res) => {
  res.json(horometerNotifications);
});

let horometerNotifications = [];

cron.schedule("* * * * *", async () => {
  console.log("Ejecutando tarea programada: Actualizando horómetros...");
  try {
    // 1 hora = 60 minutos. Incrementamos 1/60 de hora por cada minuto.
    const incrementoPorMinuto = 1 / 60;
    const idEstadoActivo = 6;

    const query = `
      UPDATE maquinaria 
      SET 
        horometro_actual = horometro_actual + $1
      WHERE 
        estado_actual = $2;
    `;

    const result = await db.query(query, [incrementoPorMinuto, idEstadoActivo]);

    if (result.rowCount > 0) {
      console.log(
        `Horómetros de ${result.rowCount} máquinas activas actualizados.`
      );
    }

    const { rows } = await db.query(
      `SELECT maquinaria_id, nombre_equipo, horometro_actual, 
              horometro_ultimo_mtto, horometro_prox_mtto 
       FROM maquinaria 
       WHERE estado_actual = $1`, // Solo de máquinas activas
      [idEstadoActivo]
    );

    const newNotifications = [];

    for (const maq of rows) {
      const horasDesdeMtto = maq.horometro_actual - maq.horometro_ultimo_mtto;
      const estado = maq.horometro_prox_mtto - horasDesdeMtto;

      let notificacion = null;

      if (estado <= 4) {
        // Lógica de "Por favor realizar mantenimiento"
        notificacion = {
          id: `not-maq-${maq.maquinaria_id}`,
          tipo: "alerta",
          titulo: "Mantenimiento Urgente",
          mensaje: `¡Mantenimiento requerido YA! para ${
            maq.nombre_equipo
          }. Horas restantes: ${estado.toFixed(2)}`,
          fecha: new Date().toISOString(),
          leida: false,
          enlace: "/machinery", // O podrías poner un enlace a la máquina específica
        };
      } else if (estado >= 5 && estado <= 8) {
        // Lógica de "Proximo mantenimiento"
        notificacion = {
          id: `not-maq-${maq.maquinaria_id}`,
          tipo: "warning",
          titulo: "Mantenimiento Próximo",
          mensaje: `${
            maq.nombre_equipo
          } requiere mantenimiento pronto. Horas restantes: ${estado.toFixed(
            2
          )}`,
          fecha: new Date().toISOString(),
          leida: false,
          enlace: "/machinery",
        };
      }

      if (notificacion) {
        newNotifications.push(notificacion);
      }
    }

    // Actualizamos la lista global
    horometerNotifications = newNotifications;
  } catch (error) {
    console.error("Error actualizando horómetros:", error);
  }
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const userSocketMap = new Map();

io.on("connection", (socket) => {
  console.log(`Un usuario se conectó: ${socket.id}`);
  socket.on("join", (userId) => {
    // --- CORRECCIÓN AQUÍ ---
    const userIdString = String(userId);
    console.log(`Usuario ${userIdString} se unió con el socket ${socket.id}`);
    userSocketMap.set(userIdString, socket.id);
  });

  // Evento: Un usuario envía un mensaje
  // Evento: Un usuario envía un mensaje
  socket.on("sendMessage", async (data) => {
    console.log("Mensaje recibido:", data);
    // 1. (CORREGIDO) Aseguramos que los IDs sean strings
    const dataParaGuardar = {
      ...data,
      remitente_id: String(data.remitente_id),
      destinatario_id: String(data.destinatario_id),
    };

    try {
      // 2. (CORREGIDO) Guardamos los datos correctos (con strings)
      const mensajeGuardado = await guardarMensaje(dataParaGuardar); // 3. Buscamos al destinatario usando el ID de string

      const destinatarioSocketId = userSocketMap.get(
        dataParaGuardar.destinatario_id
      );
      if (destinatarioSocketId) {
        // 4. Emitimos el mensaje guardado (que tiene los strings)
        io.to(destinatarioSocketId).emit("receiveMessage", mensajeGuardado);
      }
    } catch (error) {
      console.error("Error al guardar o emitir el mensaje:", error);
    }
  });

  // Evento: El usuario se desconecta
  socket.on("disconnect", () => {
    console.log(`Usuario desconectado: ${socket.id}`);
    for (let [userIdString, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userIdString);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor API y Chat corriendo en http://localhost:${PORT}`);
});
