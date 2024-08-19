import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Alert, Button, Container, Card, Row, Col } from 'react-bootstrap';
import { useUserAuth } from '../../context/UserAuthContext';
import { FaEnvelope, FaLock } from 'react-icons/fa';

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { logIn } = useUserAuth();  

    let navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const userCredential = await logIn(email, password);
            const user = userCredential.user;
            sessionStorage.setItem('teacherId', user.uid);
            navigate("/home");
        } catch(err) {
            setError(err.message);
        }
    }

    return (
        <Container className="py-5" >
            <Row className="justify-content-center">
                <Col md={6} lg={5}>
                    <Card className="shadow-lg" style={{ borderColor: '#fb8500' }}>
                        <Card.Body className="p-5">
                            <h2 className="text-center mb-4" style={{ color: '#133c6f' }}>เข้าสู่ระบบ</h2>
                            {error && <Alert variant='danger'>{error}</Alert>}

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3" controlId="formBasicEmail">
                                    <Form.Label><FaEnvelope className="me-2" style={{ color: '#fb8500' }}/>อีเมล</Form.Label>
                                    <Form.Control 
                                        type="email"
                                        placeholder="กรอกอีเมล"
                                        onChange={(e) => setEmail(e.target.value)}
                                        style={{ borderColor: '#133c6f' }}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4" controlId="formBasicPassword">
                                    <Form.Label><FaLock className="me-2" style={{ color: '#fb8500' }}/>รหัสผ่าน</Form.Label>
                                    <Form.Control 
                                        type="password"
                                        placeholder="กรอกรหัสผ่าน"
                                        onChange={(e) => setPassword(e.target.value)}
                                        style={{ borderColor: '#133c6f' }}
                                    />
                                </Form.Group>

                                <div className="d-grid gap-2">
                                    <Button type="submit" size="lg" style={{ backgroundColor: '#fb8500', borderColor: '#fb8500', color: '#ffffff' }}>เข้าสู่ระบบ</Button>
                                </div>
                            </Form>
                            <div className="text-center mt-4">
                                ยังไม่มีบัญชี? <Link to="/register" style={{ color: '#fb8500' }}>ลงทะเบียน</Link>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    )
}

export default Login;