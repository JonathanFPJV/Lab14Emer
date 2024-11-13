import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Form, Container, Row, Col, Card } from 'react-bootstrap';
import './App.css';

const App = () => {
  const [ws, setWs] = useState(null);
  const [potValue, setPotValue] = useState(null);
  const [ledStatus, setLedStatus] = useState(false);

  useEffect(() => {
    const socket = new WebSocket('ws://192.168.2.24:8080');

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
      setLedStatus(!ledStatus);
    }
  };

  const getPotValue = () => {
    if (ws) {
      ws.send('GET_POT');
    }
  };

  return (
    <Container className='App'>
      <header className='my-4'>
        <h1>Control del ESP32</h1>
      </header>
      <main>
        <Row className='mb-4'>
          <Col>
            <Card>
              <Card.Body>
                <Card.Title>Control del LED</Card.Title>
                <p>El LED está: {ledStatus ? 'Encendido' : 'Apagado'}</p>
                <Form>
                  <Form.Check
                    type="switch"
                    id="led-switch"
                    label="Encender/Apagar LED"
                    checked={ledStatus}
                    onChange={toggleLed}
                  />
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col>
            <Card>
              <Card.Body>
                <Card.Title>Lectura del Potenciómetro</Card.Title>
                <Button onClick={getPotValue}>Leer Potenciómetro</Button>
                <p className='mt-3'>Valor del Potenciómetro:</p>
                {potValue !== null && (
                  <h3>{potValue}</h3>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </main>
    </Container>
  );
};

export default App;
