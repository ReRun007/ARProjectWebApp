import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Form, Alert, Button, Container, Card, Row, Col, Image } from 'react-bootstrap';
import { useUserAuth } from '../../context/UserAuthContext';
import { FaEnvelope, FaLock } from 'react-icons/fa';

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { logIn, user } = useUserAuth();  
    let navigate = useNavigate();

    useEffect(() => {
        const checkAuthStatus = async () => {
            if (user) {
                const userType = await checkUserType(user.uid);
                if (userType === 'teacher') {
                    navigate("/teacher/home");
                } else if (userType === 'student') {
                    navigate("/student/home");
                }
            }
        };
        checkAuthStatus();
    }, [user, navigate]);

    const checkUserType = async (uid) => {
        const teacherDocRef = doc(db, "Teachers", uid);
        const studentDocRef = doc(db, "Students", uid);
        
        const teacherDocSnap = await getDoc(teacherDocRef);
        const studentDocSnap = await getDoc(studentDocRef);

        if (teacherDocSnap.exists()) {
            return 'teacher';
        } else if (studentDocSnap.exists()) {
            return 'student';
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const userCredential = await logIn(email, password);
            const user = userCredential.user;
            
            const userType = await checkUserType(user.uid);

            if (userType === 'teacher') {
                sessionStorage.setItem('userType', 'teacher');
                sessionStorage.setItem('teacherId', user.uid);
                navigate("/teacher/home");
            } else if (userType === 'student') {
                sessionStorage.setItem('userType', 'student');
                sessionStorage.setItem('studentId', user.uid);
                navigate("/student/home");
            } else {
                throw new Error("User data not found");
            }
        } catch (err) {
            setError(err.message);
            console.error("Login error:", err);
        }
    };

    return (
        <Container fluid className="bg-light vh-100 d-flex align-items-center">
            <Row className="justify-content-center w-100">
                <Col md={6} lg={5}>
                    <Card className="shadow border-0">
                        <Card.Body className="p-5">
                            <div className="text-center mb-4">
                                <Image 
                                    src="https://firebasestorage.googleapis.com/v0/b/arproject-b2e7b.appspot.com/o/Logo%2Flogo-no-background.png?alt=media&token=49d57db2-d023-490f-a923-8d0760b121d5" 
                                    alt="LearnMate Logo" 
                                    fluid 
                                    className="mb-4"
                                    style={{ maxWidth: '200px' }}
                                />
                                <h2 className="text-primary">เข้าสู่ระบบ</h2>
                            </div>
                            
                            {error && <Alert variant='danger'>{error}</Alert>}

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3" controlId="formBasicEmail">
                                    <Form.Label>
                                        <FaEnvelope className="me-2 text-primary"/>
                                        อีเมล
                                    </Form.Label>
                                    <Form.Control 
                                        type="email"
                                        placeholder="กรอกอีเมล"
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4" controlId="formBasicPassword">
                                    <Form.Label>
                                        <FaLock className="me-2 text-primary"/>
                                        รหัสผ่าน
                                    </Form.Label>
                                    <Form.Control 
                                        type="password"
                                        placeholder="กรอกรหัสผ่าน"
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </Form.Group>

                                <Button variant="primary" type="submit" size="lg" className="w-100">
                                    เข้าสู่ระบบ
                                </Button>
                            </Form>
                            <div className="text-center mt-4">
                                ยังไม่มีบัญชี? <Link to="/register" className="text-primary">ลงทะเบียน</Link>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    )
}

export default Login;