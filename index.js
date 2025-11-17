require("dotenv").config(); 
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const db = require("./db/index");
const http = require("http");
const { Server } = require("socket.io"); 
const { guardarMensaje } = require("./controllers/mensajesController");
const app = express();

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
       WHERE estado_actual = $1`,
      [idEstadoActivo]
    );

    const newNotifications = [];

    for (const maq of rows) {
      const horasDesdeMtto = maq.horometro_actual - maq.horometro_ultimo_mtto;
      const estado = maq.horometro_prox_mtto - horasDesdeMtto;

      let notificacion = null;

      if (estado <= 4) {
        notificacion = {
          id: `not-maq-${maq.maquinaria_id}`,
          tipo: "alerta",
          titulo: "Mantenimiento Urgente",
          mensaje: `¡Mantenimiento requerido YA! para ${
            maq.nombre_equipo
          }. Horas restantes: ${estado.toFixed(2)}`,
          fecha: new Date().toISOString(),
          leida: false,
          enlace: "/machinery",
        };
      } else if (estado >= 5 && estado <= 8) {
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

let currentUserId = null;
io.on("connection", (socket) => {
  console.log(`Un usuario se conectó: ${socket.id}`);
  socket.on("join", (userId) => {
    const userIdString = String(userId);
    console.log(`Usuario ${userIdString} se unió con el socket ${socket.id}`);
    userSocketMap.set(userIdString, socket.id);
  });

  socket.on("sendMessage", async (data) => {
    console.log("Mensaje recibido:", data);
    const dataParaGuardar = {
      ...data,
      remitente_id: String(data.remitente_id),
      destinatario_id: String(data.destinatario_id),
    };

    socket.on("markAsRead", async (data) => {
    if (!currentUserId) return;
    const { remitente_id, destinatario_id } = data;
    const updatedData = await markMessagesAsRead(remitente_id, destinatario_id);

    if (updatedData) {
      const senderSocketId = userSocketMap.get(String(remitente_id));
      
      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesRead", { 
          chatWithUserId: String(destinatario_id)
        });
      }
    }
  });

    try {
      const mensajeGuardado = await guardarMensaje(dataParaGuardar);

      const destinatarioSocketId = userSocketMap.get(
        dataParaGuardar.destinatario_id
      );
      if (destinatarioSocketId) {
        io.to(destinatarioSocketId).emit("receiveMessage", mensajeGuardado);
      }
    } catch (error) {
      console.error("Error al guardar o emitir el mensaje:", error);
    }
  });

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
