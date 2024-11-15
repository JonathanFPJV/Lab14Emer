import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Alert, Container, Row, Col, Card } from 'react-bootstrap';
import './App.css';

const App = () => {
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [controlEnabled, setControlEnabled] = useState(false);
  const [potValue, setPotValue] = useState(null);
  const [servoPosition, setServoPosition] = useState(null);
  const [ledResetStatus, setLedResetStatus] = useState(false);

  useEffect(() => {
    const socket = new WebSocket('ws://192.168.129.24:8080');
  
    socket.onopen = () => {
      console.log('Conectado al servidor WebSocket');
      setWs(socket);
      setIsConnected(true);
    };
  
    socket.onmessage = (event) => {
      console.log(`Mensaje recibido del servidor: ${event.data}`);
      
      // Aquí se procesan los datos del potenciómetro y la posición del servo
      if (event.data.startsWith('POT:')) {
        const [_, potValue, pos] = event.data.match(/POT:(\d+),POS:(\d+)/);
        setPotValue(potValue);
        setServoPosition(pos);
      }
    };
  
    socket.onclose = () => {
      console.log('Desconectado del servidor WebSocket');
      setIsConnected(false);
    };
  
    return () => {
      socket.close();
    };
  }, []);
  

  const toggleControl = () => {
    if (ws) {
      ws.send('TOGGLE_CONTROL');
      setControlEnabled(!controlEnabled);
    }
  };

  const resetServo = () => {
    if (ws) {
      ws.send('RESET_SERVO');
      setLedResetStatus(true);
      setTimeout(() => setLedResetStatus(false), 500);
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
            <Alert variant={isConnected ? 'success' : 'danger'}>
              {isConnected ? 'ESP32 Conectado' : 'ESP32 Desconectado'}
            </Alert>
          </Col>
        </Row>

        <Row className="justify-content-center mb-4">
          <Col xs={12} md={8} lg={6}>
            <Card className="text-center shadow-lg">
              <Card.Body>
                <Card.Title>Control del Sistema</Card.Title>
                <Button variant="primary" onClick={toggleControl} className="mb-3">
                  {controlEnabled ? 'Desactivar Control' : 'Activar Control'}
                </Button>
                <p>El LED de arranque está: {controlEnabled ? 'Encendido' : 'Apagado'}</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="justify-content-center mb-4">
          <Col xs={12} md={8} lg={6}>
            <Card className="text-center shadow-lg">
              <Card.Body>
                <Card.Title>Resetear Servo</Card.Title>
                <Button variant="warning" onClick={resetServo} className="mb-3">
                  Reiniciar Servo
                </Button>
                {ledResetStatus && <p>El LED de reinicio está: Encendido</p>}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="justify-content-center mb-4">
          <Col xs={12} md={8} lg={6}>
            <Card className="text-center shadow-lg">
              <Card.Body>
                <Card.Title>Lectura del Potenciómetro</Card.Title>
                {potValue && servoPosition ? (
                  <p>Valor del potenciómetro: {potValue}, Posición del servo: {servoPosition}</p>
                ) : (
                  <p>Esperando valores...</p>
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
