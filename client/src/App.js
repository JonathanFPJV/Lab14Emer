import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [ws, setWs] = useState(null);
  const [potValue, setPotValue] = useState(null);
  const [ledStatus, setLedStatus] = useState(false);

  useEffect(() => {
    const socket = new WebSocket('ws://172.16.3.198:8080');

    socket.onopen = () => {
      console.log('Conectado al servidor WebSocket');
      setWs(socket);
    };

    socket.onmessage = (event) => {
      console.log(`Mensaje recibido del servidor: ${event.data}`);

      if (event.data.startsWith('POT:')) {
        const potValue = event.data.split(':')[1];
        setPotValue(potValue);
      }
    };

    socket.onclose = () => {
      console.log('Desconectado del servidor WebSocket');
    };

    return () => {
      socket.close();
    };
  }, []);

  const toggleLed = () => {
    if (ws) {
      const newStatus = ledStatus ? 'OFF' : 'ON';
      ws.send(newStatus);
      ledStatus ? setLedStatus(false) : setLedStatus(true);
    }
  };

  const getPotValue = () => {
    if (ws) {
      ws.send('GET_POT');
    }
  };

  return (
    <div className='App'>
      <header>
        <h1>Control del ESP32</h1>
      </header>
      <main>
        <div className='widget'>
          <p>El LED está: {ledStatus ? 'Encendido' : 'Apagado'}</p>
          <div className='toggle'>
            <input type='checkbox' id='green' onClick={toggleLed} checked={ledStatus} />
            <label htmlFor='green'></label>
          </div>
        </div>
        <div className='widget'>
          <button onClick={getPotValue}>Leer Potenciómetro</button>
          <p>Valor del Potenciómetro:</p>
          {potValue !== null && (
            <h1>{potValue}</h1>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
