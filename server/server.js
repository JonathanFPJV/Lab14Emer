const WebSocket = require('ws');
const mongoose = require('mongoose');

// Conectar a MongoDB
mongoose.connect('mongodb+srv://esp32_user:esp32_pass@esp32-cluster.lldxu.mongodb.net/?retryWrites=true&w=majority&appName=ESP32-Cluster', { });

// POTENCIOMETRO: Esquema y Modelo
const potSchema = new mongoose.Schema({
    value: Number,
    timestamp: { type: Date, default: Date.now },
});
const Potenciometro = mongoose.model('Potenciometro', potSchema);

// LED: Esquema y Modelo
const ledSchema = new mongoose.Schema({
    estado: String,  // "ON" o "OFF"
    timestamp: { type: Date, default: Date.now },
});
const Led = mongoose.model('Led', ledSchema);

const wss = new WebSocket.Server({ port: 8080 });

let esp32Socket = null;

wss.on('connection', (ws) => {
    console.log('Nuevo cliente conectado');

    ws.on('message', async (message) => {
        message = String(message);
        console.log(`Mensaje recibido: ${message}`);

        if (message === 'ESP32') {
            esp32Socket = ws;
            console.log('ESP32 conectado');
        }
        else if (message === 'ON' || message === 'OFF' || message === 'GET_POT') {
            if (esp32Socket) {
                esp32Socket.send(message);
                console.log(`Comando enviado al ESP32: ${message}`);
                if (message === 'ON' || message === 'OFF') {
                    const nuevoEstadoLED = new Led({ estado: message });
                    await nuevoEstadoLED.save();
                    console.log(`Estado del LED guardado en DB: ${message}`);
                }
            } else {
                console.log('ESP32 no está conectado');
            }
        }
        // Cambiar a la condición else if para manejar valores de potenciómetro en formato correcto
        else if (message.startsWith("POT:")) {
            const potValue = parseInt(message.split(':')[1], 10);
            if (!isNaN(potValue)) {
                const nuevaLectura = new Potenciometro({ value: potValue });
                await nuevaLectura.save();
                console.log(`Valor del potenciómetro guardado en DB: ${potValue}`);
            } else {
                console.log("Error: el valor del potenciómetro es NaN");
            }

            // Enviar a otros clientes
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(`POT:${potValue}`);
                }
            });
        }
    });

    ws.on('close', () => {
        console.log('Cliente desconectado');
        if (ws === esp32Socket) {
            esp32Socket = null;
            console.log('ESP32 desconectado');
        }
    });
});

console.log('Servidor WebSockets escuchando en http://localhost:8080');
