import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Form, Container, Row, Col, Card } from 'react-bootstrap';
import './App.css';

const App = () => {
  const [ws, setWs] = useState(null);
  const [potValue, setPotValue] = useState(null);
  const [ledStatus, setLedStatus] = useState(false);
  const [led2Status, setLed2Status] = useState(false);

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

  const toggleLed = (ledNumber) => {
    if (ws) {
      const newStatus = ledNumber === 1 ? (ledStatus ? 'OFF' : 'ON') : (led2Status ? 'LED2_OFF' : 'LED2_ON');
      ws.send(newStatus);

      if (ledNumber === 1) {
        setLedStatus(!ledStatus);
      } else {
        setLed2Status(!led2Status);
      }
    }
  };

  const getPotValue = () => {
    if (ws) {
      ws.send('GET_POT');
    }
  };

  return (
    <Container className="App d-flex flex-column align-items-center justify-content-center vh-100">
      <header className="text-center my-4">
        <h1>Control del ESP32</h1>
      </header>
      <main className="w-100">
        <Row className="justify-content-center mb-4">
          <Col xs={12} md={8} lg={6}>
            <Card className="text-center shadow-lg">
              <Card.Body>
                <Card.Title>Control del LED 1</Card.Title>
                <p>El LED 1 está: {ledStatus ? 'Encendido' : 'Apagado'}</p>
                <Form>
                  <Form.Check
                    type="switch"
                    id="led1-switch"
                    label="Encender/Apagar LED 1"
                    checked={ledStatus}
                    onChange={() => toggleLed(1)}
                    className="form-switch-lg"
                  />
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Row className="justify-content-center mb-4">
          <Col xs={12} md={8} lg={6}>
            <Card className="text-center shadow-lg">
              <Card.Body>
                <Card.Title>Control del LED 2</Card.Title>
                <p>El LED 2 está: {led2Status ? 'Encendido' : 'Apagado'}</p>
                <Form>
                  <Form.Check
                    type="switch"
                    id="led2-switch"
                    label="Encender/Apagar LED 2"
                    checked={led2Status}
                    onChange={() => toggleLed(2)}
                    className="form-switch-lg"
                  />
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Row className="justify-content-center">
          <Col xs={12} md={8} lg={6}>
            <Card className="text-center shadow-lg">
              <Card.Body>
                <Card.Title>Lectura del Potenciómetro</Card.Title>
                <Button onClick={getPotValue} className="mb-3">Leer Potenciómetro</Button>
                <p className="mt-3">Valor del Potenciómetro:</p>
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
