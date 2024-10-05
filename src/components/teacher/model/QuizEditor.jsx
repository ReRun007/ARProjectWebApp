import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Button, ListGroup, Alert, Image, Container, Row, Col, Badge } from 'react-bootstrap';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../firebase';
import { FaPlus, FaTrash, FaSave, FaImage, FaEdit, FaCheck } from 'react-icons/fa';

function QuizEditor() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [newQuestion, setNewQuestion] = useState({
        text: '',
        image: null,
        options: [{ text: '', image: null }, { text: '', image: null }],
        correctAnswer: 0
    });
    const [alertMessage, setAlertMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(true);





    const fetchQuizData = async () => {
        setIsLoading(true);
        try {
            const quizDoc = await getDoc(doc(db, 'Quizzes', quizId));
            if (quizDoc.exists()) {
                setQuiz(quizDoc.data());
                setQuestions(quizDoc.data().questions || []);
            } else {
                setAlertMessage({ type: 'danger', text: 'ไม่พบแบบทดสอบที่ระบุ' });
            }
        } catch (error) {
            console.error("Error fetching quiz:", error);
            setAlertMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการโหลดข้อมูลแบบทดสอบ' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchQuizData();
    }, [quizId]);

    if (isLoading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">กำลังโหลด...</span>
                </div>
            </Container>
        );
    }

    if (!quiz) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">ไม่พบแบบทดสอบที่ระบุ</Alert>
            </Container>
        );
    }

    const handleQuestionChange = (e) => {
        setNewQuestion({ ...newQuestion, text: e.target.value });
    };

    const handleOptionChange = (index, field, value) => {
        const updatedOptions = [...newQuestion.options];
        updatedOptions[index] = { ...updatedOptions[index], [field]: value };
        setNewQuestion({ ...newQuestion, options: updatedOptions });
    };

    const handleAddOption = () => {
        if (newQuestion.options.length < 4) {
            setNewQuestion({
                ...newQuestion,
                options: [...newQuestion.options, { text: '', image: null }]
            });
        }
    };

    const handleRemoveOption = (index) => {
        if (newQuestion.options.length > 2) {
            const updatedOptions = newQuestion.options.filter((_, i) => i !== index);
            setNewQuestion({
                ...newQuestion,
                options: updatedOptions,
                correctAnswer: newQuestion.correctAnswer >= updatedOptions.length ? 0 : newQuestion.correctAnswer
            });
        }
    };

    const handleCorrectAnswerChange = (index) => {
        setNewQuestion({ ...newQuestion, correctAnswer: index });
    };

    const handleImageUpload = async (file, type, index = null) => {
        try {
            const storageRef = ref(storage, `quizzes/${quizId}/${file.name}`);
            await uploadBytes(storageRef, file);
            const imageUrl = await getDownloadURL(storageRef);

            if (type === 'question') {
                setNewQuestion({ ...newQuestion, image: imageUrl });
            } else if (type === 'option') {
                handleOptionChange(index, 'image', imageUrl);
            }

            setAlertMessage({ type: 'success', text: 'อัปโหลดรูปภาพสำเร็จ' });
        } catch (error) {
            console.error("Error uploading image:", error);
            setAlertMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ' });
        }
    };

    const handleAddQuestion = async () => {
        if (newQuestion.text.trim() === '' || newQuestion.options.some(opt => opt.text.trim() === '')) {
            setAlertMessage({ type: 'warning', text: 'กรุณากรอกคำถามและตัวเลือกให้ครบถ้วน' });
            return;
        }

        try {
            const quizRef = doc(db, 'Quizzes', quizId);
            await updateDoc(quizRef, {
                questions: arrayUnion(newQuestion)
            });
            setQuestions([...questions, newQuestion]);
            setNewQuestion({
                text: '',
                image: null,
                options: [{ text: '', image: null }, { text: '', image: null }],
                correctAnswer: 0
            });
            setAlertMessage({ type: 'success', text: 'เพิ่มคำถามสำเร็จ' });
        } catch (error) {
            console.error("Error adding question:", error);
            setAlertMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการเพิ่มคำถาม' });
        }
    };

    const handleRemoveQuestion = async (index) => {
        try {
            const quizRef = doc(db, 'Quizzes', quizId);
            await updateDoc(quizRef, {
                questions: arrayRemove(questions[index])
            });
            const updatedQuestions = questions.filter((_, i) => i !== index);
            setQuestions(updatedQuestions);
            setAlertMessage({ type: 'success', text: 'ลบคำถามสำเร็จ' });
        } catch (error) {
            console.error("Error removing question:", error);
            setAlertMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการลบคำถาม' });
        }
    };

    const handleSaveQuiz = async () => {
        try {
            const quizRef = doc(db, 'Quizzes', quizId);
            await updateDoc(quizRef, { questions: questions });
            setAlertMessage({ type: 'success', text: 'บันทึกแบบทดสอบสำเร็จ' });
            navigate(`/teacher/classroom/${quiz.classId}`);
        } catch (error) {
            console.error("Error saving quiz:", error);
            setAlertMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการบันทึกแบบทดสอบ' });
        }
    };

    if (!quiz) {
        return <div>Loading...</div>;
    }

    return (
        <Container className="py-4">
            <Card className="shadow-sm mb-4">
                <Card.Header className="bg-primary text-white">
                    <h4 className="mb-0">{quiz.title}</h4>
                </Card.Header>
                <Card.Body>
                    <Card.Subtitle className="mb-3 text-muted">{quiz.description}</Card.Subtitle>

                    {alertMessage && (
                        <Alert variant={alertMessage.type} onClose={() => setAlertMessage(null)} dismissible>
                            {alertMessage.text}
                        </Alert>
                    )}

                    <h5 className="mt-4 mb-3">คำถามในแบบทดสอบ</h5>
                    <ListGroup className="mb-4">
                        {questions.map((question, index) => (
                            <ListGroup.Item key={index} className="mb-3 border rounded">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <h6 className="mb-0">
                                        <Badge bg="secondary" className="me-2">{index + 1}</Badge>
                                        {question.text}
                                    </h6>
                                    <Button variant="outline-danger" size="sm" onClick={() => handleRemoveQuestion(index)}>
                                        <FaTrash /> ลบ
                                    </Button>
                                </div>
                                {question.image && <Image src={question.image} fluid className="mb-2 rounded" style={{ maxHeight: '200px' }} />}
                                <ListGroup variant="flush">
                                    {question.options.map((option, optIndex) => (
                                        <ListGroup.Item key={optIndex} className={optIndex === question.correctAnswer ? "text-success" : ""}>
                                            <FaCheck className={`me-2 ${optIndex === question.correctAnswer ? "text-success" : "invisible"}`} />
                                            {option.text}
                                            {option.image && <Image src={option.image} fluid className="mt-1 rounded" style={{ maxWidth: '100px', maxHeight: '100px' }} />}
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>

                    <Card className="shadow-sm mb-4">
                        <Card.Header className="bg-light">
                            <h5 className="mb-0">เพิ่มคำถามใหม่</h5>
                        </Card.Header>
                        <Card.Body>
                            <Form>
                                <Form.Group className="mb-3">
                                    <Form.Label>คำถาม</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newQuestion.text}
                                        onChange={handleQuestionChange}
                                        placeholder="พิมพ์คำถามที่นี่"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>รูปภาพประกอบคำถาม (ถ้ามี)</Form.Label>
                                    <Form.Control
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e.target.files[0], 'question')}
                                    />
                                    {newQuestion.image && (
                                        <Image src={newQuestion.image} fluid className="mt-2 rounded" style={{ maxWidth: '200px' }} />
                                    )}
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>ตัวเลือกคำตอบ</Form.Label>
                                    {newQuestion.options.map((option, index) => (
                                        <Card key={index} className="mb-2">
                                            <Card.Body>
                                                <Row className="align-items-center">
                                                    <Col xs="auto">
                                                        <Form.Check
                                                            type="radio"
                                                            id={`correct-answer-${index}`}
                                                            name="correctAnswer"
                                                            checked={newQuestion.correctAnswer === index}
                                                            onChange={() => handleCorrectAnswerChange(index)}
                                                            label={<span className="text-success">คำตอบที่ถูกต้อง</span>}
                                                        />
                                                    </Col>
                                                    <Col>
                                                        <Form.Control
                                                            type="text"
                                                            value={option.text}
                                                            onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                                                            placeholder={`ตัวเลือกที่ ${index + 1}`}
                                                        />
                                                    </Col>
                                                    <Col xs="auto">
                                                        {index > 1 && (
                                                            <Button variant="outline-danger" size="sm" onClick={() => handleRemoveOption(index)}>
                                                                <FaTrash />
                                                            </Button>
                                                        )}
                                                    </Col>
                                                </Row>
                                                <Row className="mt-2">
                                                    <Col>
                                                        <Form.Control
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleImageUpload(e.target.files[0], 'option', index)}
                                                        />
                                                    </Col>
                                                </Row>
                                                {option.image && (
                                                    <Image src={option.image} fluid className="mt-2 rounded" style={{ maxWidth: '100px' }} />
                                                )}
                                            </Card.Body>
                                        </Card>
                                    ))}
                                </Form.Group>

                                {newQuestion.options.length < 4 && (
                                    <Button variant="outline-secondary" className="mb-3" onClick={handleAddOption}>
                                        <FaPlus /> เพิ่มตัวเลือก
                                    </Button>
                                )}

                                <div className="d-flex justify-content-between">
                                    <Button variant="primary" onClick={handleAddQuestion}>
                                        <FaPlus /> เพิ่มคำถาม
                                    </Button>
                                    <Button variant="success" onClick={handleSaveQuiz}>
                                        <FaSave /> บันทึกแบบทดสอบ
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>

                    <div className="d-flex justify-content-between">
                        <Button variant="secondary" onClick={() => navigate(`/teacher/classroom/${quiz.classId}`)}>
                            ยกเลิก
                        </Button>
                        <Button variant="success" onClick={handleSaveQuiz}>
                            <FaSave /> บันทึกแบบทดสอบ
                        </Button>
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
}

export default QuizEditor;