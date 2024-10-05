import React, { useState, useEffect } from 'react';
import { Card, Button, ListGroup, Modal, Form, Alert,Image  } from 'react-bootstrap';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, orderBy, writeBatch } from 'firebase/firestore';
import { db } from '../../../firebase';
import { FaArrowUp, FaArrowDown, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import EditQuestionModal from './EditQuestionModal';

function QuizDisplay({ classId }) {
    const [quizzes, setQuizzes] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [quizTitle, setQuizTitle] = useState('');
    const [quizDescription, setQuizDescription] = useState('');
    const [alertMessage, setAlertMessage] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentQuiz, setCurrentQuiz] = useState(null);
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(null);

    useEffect(() => {
        fetchQuizzes();
    }, [classId]);

    const fetchQuizzes = async () => {
        try {
            const q = query(
                collection(db, "Quizzes"),
                where("classId", "==", classId),
                orderBy("order", "asc")
            );
            const querySnapshot = await getDocs(q);
            const quizData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setQuizzes(quizData);
        } catch (error) {
            console.error("Error fetching quizzes: ", error);
            setAlertMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการโหลดแบบทดสอบ' });
        }
    };

    const handleCreateQuiz = async (e) => {
        e.preventDefault();
        try {
            const newQuizRef = await addDoc(collection(db, "Quizzes"), {
                title: quizTitle,
                description: quizDescription,
                classId: classId,
                createdAt: new Date(),
                order: quizzes.length // กำหนด order เป็นลำดับสุดท้าย
            });
            setShowModal(false);
            setQuizTitle('');
            setQuizDescription('');
            fetchQuizzes();
            setAlertMessage({ type: 'success', text: 'สร้างแบบทดสอบสำเร็จ' });
        } catch (error) {
            console.error("Error creating quiz: ", error);
            setAlertMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการสร้างแบบทดสอบ' });
        }
    };

    const handleDeleteQuiz = async (quizId) => {
        if (window.confirm("คุณแน่ใจหรือไม่ที่จะลบแบบทดสอบนี้?")) {
            try {
                await deleteDoc(doc(db, "Quizzes", quizId));
                fetchQuizzes();
                setAlertMessage({ type: 'success', text: 'ลบแบบทดสอบสำเร็จ' });
            } catch (error) {
                console.error("Error deleting quiz: ", error);
                setAlertMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการลบแบบทดสอบ' });
            }
        }
    };

    const handleEditQuiz = async (e) => {
        e.preventDefault();
        try {
            await updateDoc(doc(db, "Quizzes", currentQuiz.id), currentQuiz);
            setShowEditModal(false);
            fetchQuizzes();
            setAlertMessage({ type: 'success', text: 'แก้ไขแบบทดสอบสำเร็จ' });
        } catch (error) {
            console.error("Error editing quiz:", error);
            setAlertMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการแก้ไขแบบทดสอบ' });
        }
    };
    const handleAddQuestion = () => {
        setCurrentQuestion(null);
        setShowQuestionModal(true);
    };

    const handleEditQuestion = (question) => {
        setCurrentQuestion(question);
        setShowQuestionModal(true);
    };

    const handleSaveQuestion = (editedQuestion) => {
        const updatedQuestions = currentQuiz.questions ? [...currentQuiz.questions] : [];
        if (currentQuestion) {
            // แก้ไขคำถามที่มีอยู่
            const index = updatedQuestions.findIndex(q => q.id === currentQuestion.id);
            if (index !== -1) {
                updatedQuestions[index] = editedQuestion;
            }
        } else {
            // เพิ่มคำถามใหม่
            updatedQuestions.push({ ...editedQuestion, id: Date.now().toString() });
        }
        setCurrentQuiz({ ...currentQuiz, questions: updatedQuestions });
        setShowQuestionModal(false);
    };

    const handleReorderQuestion = async (quizId, questionId, direction) => {
        const quiz = quizzes.find(q => q.id === quizId);
        const questions = [...quiz.questions];
        const index = questions.findIndex(q => q.id === questionId);

        if ((direction === 'up' && index > 0) || (direction === 'down' && index < questions.length - 1)) {
            const newIndex = direction === 'up' ? index - 1 : index + 1;
            [questions[index], questions[newIndex]] = [questions[newIndex], questions[index]];

            try {
                await updateDoc(doc(db, "Quizzes", quizId), { questions: questions });
                fetchQuizzes();
                setAlertMessage({ type: 'success', text: 'เรียงลำดับคำถามสำเร็จ' });
            } catch (error) {
                console.error("Error reordering question:", error);
                setAlertMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการเรียงลำดับคำถาม' });
            }
        }
    };

    const handleDeleteQuestion = async (quizId, questionId) => {
        if (window.confirm("คุณแน่ใจหรือไม่ที่จะลบคำถามนี้?")) {
            try {
                const updatedQuiz = { ...currentQuiz };
                updatedQuiz.questions = updatedQuiz.questions.filter(q => q.id !== questionId);
                await updateDoc(doc(db, "Quizzes", quizId), { questions: updatedQuiz.questions });
                setCurrentQuiz(updatedQuiz);
                fetchQuizzes();
                setAlertMessage({ type: 'success', text: 'ลบคำถามสำเร็จ' });
            } catch (error) {
                console.error("Error deleting question:", error);
                setAlertMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการลบคำถาม' });
            }
        }
    };

    const handleReorderQuiz = async (quizId, direction) => {
        const index = quizzes.findIndex(q => q.id === quizId);
        if ((direction === 'up' && index > 0) || (direction === 'down' && index < quizzes.length - 1)) {
            const newQuizzes = [...quizzes];
            const swapIndex = direction === 'up' ? index - 1 : index + 1;
            [newQuizzes[index], newQuizzes[swapIndex]] = [newQuizzes[swapIndex], newQuizzes[index]];

            try {
                const batch = writeBatch(db);
                newQuizzes.forEach((quiz, idx) => {
                    const quizRef = doc(db, "Quizzes", quiz.id);
                    batch.update(quizRef, { order: idx });
                });
                await batch.commit();

                setQuizzes(newQuizzes);
                setAlertMessage({ type: 'success', text: 'เรียงลำดับแบบทดสอบสำเร็จ' });
            } catch (error) {
                console.error("Error reordering quiz:", error);
                setAlertMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการเรียงลำดับแบบทดสอบ' });
            }
        }
    };

    return (
        <>
            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <Card.Title>แบบทดสอบ</Card.Title>
                        <Button variant="primary" onClick={() => setShowModal(true)}>
                            <FaPlus className="me-2" /> สร้างแบบทดสอบใหม่
                        </Button>
                    </div>
                    {alertMessage && (
                        <Alert variant={alertMessage.type} onClose={() => setAlertMessage(null)} dismissible>
                            {alertMessage.text}
                        </Alert>
                    )}
                    <ListGroup>
                        {quizzes.map((quiz, index) => (
                            <ListGroup.Item key={quiz.id} className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5>{quiz.title}</h5>
                                    <p className="mb-0 text-muted">{quiz.description}</p>
                                    <small>จำนวนคำถาม: {quiz.questions?.length || 0}</small>
                                </div>
                                <div>
                                    <Button
                                        variant="outline-secondary"
                                        className="me-1"
                                        onClick={() => handleReorderQuiz(quiz.id, 'up')}
                                        disabled={index === 0}
                                    >
                                        <FaArrowUp />
                                    </Button>
                                    <Button
                                        variant="outline-secondary"
                                        className="me-1"
                                        onClick={() => handleReorderQuiz(quiz.id, 'down')}
                                        disabled={index === quizzes.length - 1}
                                    >
                                        <FaArrowDown />
                                    </Button>
                                    <Button
                                        variant="outline-primary"
                                        className="me-1"
                                        onClick={() => {
                                            setCurrentQuiz(quiz);
                                            setShowEditModal(true);
                                        }}
                                    >
                                        <FaEdit />
                                    </Button>
                                    <Button
                                        variant="outline-danger"
                                        onClick={() => handleDeleteQuiz(quiz.id)}
                                    >
                                        <FaTrash />
                                    </Button>
                                </div>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                    {quizzes.length === 0 && (
                        <p className="text-center text-muted mt-3">ยังไม่มีแบบทดสอบในห้องเรียนนี้</p>
                    )}
                </Card.Body>
            </Card>

            <EditQuestionModal
                show={showQuestionModal}
                onHide={() => setShowQuestionModal(false)}
                question={currentQuestion}
                onSave={handleSaveQuestion}
                classId={classId}
                quizId={currentQuiz?.id}
            />

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>สร้างแบบทดสอบใหม่</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleCreateQuiz}>
                        <Form.Group className="mb-3">
                            <Form.Label>ชื่อแบบทดสอบ</Form.Label>
                            <Form.Control
                                type="text"
                                value={quizTitle}
                                onChange={(e) => setQuizTitle(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>คำอธิบาย</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={quizDescription}
                                onChange={(e) => setQuizDescription(e.target.value)}
                            />
                        </Form.Group>
                        <Button variant="primary" type="submit">
                            สร้างแบบทดสอบ
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>

            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>แก้ไขแบบทดสอบ</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleEditQuiz}>
                        <Form.Group className="mb-3">
                            <Form.Label>ชื่อแบบทดสอบ</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentQuiz?.title || ''}
                                onChange={(e) => setCurrentQuiz({ ...currentQuiz, title: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>คำอธิบาย</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={currentQuiz?.description || ''}
                                onChange={(e) => setCurrentQuiz({ ...currentQuiz, description: e.target.value })}
                            />
                        </Form.Group>
                        <h5>คำถามในแบบทดสอบ</h5>
                        <ListGroup className="mb-3">
                            {currentQuiz?.questions?.map((question, index) => (
                                <ListGroup.Item key={question.id || index}>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <h6>{question.text}</h6>
                                        <div>
                                            <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEditQuestion(question)}>
                                                <FaEdit /> แก้ไข
                                            </Button>
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDeleteQuestion(currentQuiz.id, question.id)}>
                                                <FaTrash /> ลบ
                                            </Button>
                                        </div>
                                    </div>
                                    {question.image && (
                                        <Image src={question.image} fluid className="mb-2" style={{ maxHeight: '200px' }} />
                                    )}
                                    <ListGroup variant="flush">
                                        {question.options.map((option, optionIndex) => (
                                            <ListGroup.Item key={optionIndex} className={optionIndex === question.correctAnswer ? "text-success" : ""}>
                                                {option.text}
                                                {optionIndex === question.correctAnswer && " (คำตอบที่ถูกต้อง)"}
                                                {option.image && (
                                                    <Image src={option.image} fluid className="mt-2" style={{ maxWidth: '100px' }} />
                                                )}
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                        <Button variant="outline-primary" className="mb-3" onClick={() => handleAddQuestion(currentQuiz)}>
                            <FaPlus /> เพิ่มคำถามใหม่
                        </Button>
                        <div>
                            <Button variant="primary" type="submit">
                                บันทึกการแก้ไข
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </>
    );


}

export default QuizDisplay;

