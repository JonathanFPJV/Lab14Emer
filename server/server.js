const WebSocket = require('ws');
const mongoose = require('mongoose');

// Conectar a MongoDB
mongoose.connect('mongodb+srv://esp32_user:esp32_pass@esp32-cluster.lldxu.mongodb.net/?retryWrites=true&w=majority&appName=ESP32-Cluster', {});

// Esquema para el valor del potenciómetro
const potSchema = new mongoose.Schema({
    value: Number,
    servoPosition: Number,  // Nueva propiedad para la posición del servo
    timestamp: { type: Date, default: Date.now },
});
const Potenciometro = mongoose.model('Potenciometro', potSchema);

// Esquema para el estado de los LEDs
const ledSchema = new mongoose.Schema({
    led: String,   // 'arranque' o 'reinicio'
    estado: String, // "ON" o "OFF"
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

        if (message === 'ESP32 conectado') {
            esp32Socket = ws;
        } else if (message.startsWith('POT:')) {
            const [potData, posData] = message.split(',');
            const potValue = parseInt(potData.split(':')[1], 10);
            const servoPosition = parseInt(posData.split(':')[1], 10);

            // Guardar en la base de datos
            const nuevaLectura = new Potenciometro({ value: potValue, servoPosition });
            await nuevaLectura.save();
            console.log(`Valor del potenciómetro: ${potValue}, posición del servo: ${servoPosition}`);

            // Enviar los valores del potenciómetro y la posición del servo a todos los clientes conectados
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(`POT:${potValue},POS:${servoPosition}`);
                }
            });
        } else if (message.startsWith('LED')) {
            const [led, estado] = message.split(':');
            const nuevoEstadoLed = new Led({ led, estado });
            await nuevoEstadoLed.save();
            console.log(`Estado del LED ${led}: ${estado}`);
        } else if (message === 'TOGGLE_CONTROL' && esp32Socket) {
            esp32Socket.send('TOGGLE_CONTROL');
        }
    });

    ws.on('close', () => {
        if (ws === esp32Socket) esp32Socket = null;
        console.log('Cliente desconectado');
    });
});

console.log('Servidor WebSocket activo en el puerto 8080');
