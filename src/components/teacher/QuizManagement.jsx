import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Form, ListGroup, Modal, Alert } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, doc, deleteDoc, updateDoc, orderBy, writeBatch } from 'firebase/firestore';
import { FaPlus, FaEdit, FaTrash, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import Header from './Header';
import EditQuestionModal from './model/EditQuestionModal';

function QuizManagement() {
    const { classId } = useParams();
    const [quizzes, setQuizzes] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [currentQuiz, setCurrentQuiz] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        questions: [],
        order: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchQuizzes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const q = query(collection(db, "Quizzes"), where("classId", "==", classId));
            const querySnapshot = await getDocs(q);
            const quizData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setQuizzes(quizData);
        } catch (err) {
            setError(`Failed to load quizzes: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [classId]);

    useEffect(() => {
        fetchQuizzes();
    }, [fetchQuizzes]);

const handleShowModal = (mode, quiz = null) => {
    setModalMode(mode);
    setCurrentQuiz(quiz);
    if (mode === 'edit' && quiz) {
        setFormData({ ...quiz });
    } else {
        setFormData({ 
            title: '', 
            description: '', 
            questions: [], 
            order: quizzes.length 
        });
    }
    setShowModal(true);
};

    const handleCloseModal = () => {
        setShowModal(false);
        setCurrentQuiz(null);
        setFormData({ title: '', description: '', questions: [], order: 0 });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {

        e.preventDefault();
        if (!formData.title || formData.questions.length === 0) {
            setError("กรุณากรอกชื่อแบบทดสอบและเพิ่มอย่างน้อยหนึ่งคำถาม");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const quizData = {
                title: formData.title,
                description: formData.description,
                questions: formData.questions,
                order: formData.order || 0,
                classId: classId
            };

            if (modalMode === 'add') {
                await addDoc(collection(db, "Quizzes"), quizData);
            } else if (modalMode === 'edit' && currentQuiz) {
                await updateDoc(doc(db, "Quizzes", currentQuiz.id), quizData);
            }

            handleCloseModal();
            fetchQuizzes();
        } catch (err) {
            console.error("Error submitting quiz:", err);
            setError("Failed to save quiz. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteQuiz = async (quizId) => {
        if (window.confirm("คุณแน่ใจหรือไม่ที่จะลบแบบทดสอบนี้?")) {
            setLoading(true);
            setError(null);
            try {
                await deleteDoc(doc(db, "Quizzes", quizId));
                fetchQuizzes();
            } catch (err) {
                console.error("Error deleting quiz:", err);
                setError("Failed to delete quiz. Please try again.");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleReorderQuiz = async (quizId, direction) => {
        const currentIndex = quizzes.findIndex(quiz => quiz.id === quizId);
        if ((direction === 'up' && currentIndex > 0) || (direction === 'down' && currentIndex < quizzes.length - 1)) {
            setLoading(true);
            setError(null);
            try {
                const newQuizzes = [...quizzes];
                const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
                [newQuizzes[currentIndex], newQuizzes[swapIndex]] = [newQuizzes[swapIndex], newQuizzes[currentIndex]];

                const batch = writeBatch(db);
                newQuizzes.forEach((quiz, index) => {
                    const quizRef = doc(db, "Quizzes", quiz.id);
                    batch.update(quizRef, { order: index });
                });
                await batch.commit();

                setQuizzes(newQuizzes);
            } catch (err) {
                console.error("Error reordering quizzes:", err);
                setError("Failed to reorder quizzes. Please try again.");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleAddQuestion = () => {
        setCurrentQuestion(null);
        setShowQuestionModal(true);
    };

    const handleEditQuestion = (question, index) => {
        setCurrentQuestion({ ...question, index });
        setShowQuestionModal(true);
    };

    const handleSaveQuestion = (question) => {
        const updatedQuestions = [...formData.questions];
        if (currentQuestion && currentQuestion.index !== undefined) {
            updatedQuestions[currentQuestion.index] = question;
        } else {
            updatedQuestions.push(question);
        }
        setFormData({ ...formData, questions: updatedQuestions });
        setShowQuestionModal(false);
    };

    const handleDeleteQuestion = (index) => {
        const updatedQuestions = formData.questions.filter((_, i) => i !== index);
        setFormData({ ...formData, questions: updatedQuestions });
    };

    if (loading) {
        return <Container className="py-5"><Alert variant="info">กำลังโหลด...</Alert></Container>;
    }

    return (
        <>
            <Header />
            <Container className="py-5">
                <h1 className="mb-4">จัดการแบบทดสอบ</h1>
                {error && <Alert variant="danger">{error}</Alert>}
                <Button variant="primary" onClick={() => handleShowModal('add')} className="mb-3">
                    <FaPlus /> เพิ่มแบบทดสอบใหม่
                </Button>
                <ListGroup>
                    {quizzes.map((quiz, index) => (
                        <ListGroup.Item key={quiz.id} className="d-flex justify-content-between align-items-center">
                            <div>
                                <h5>{quiz.title}</h5>
                                <p className="mb-0 text-muted">{quiz.description}</p>
                            </div>
                            <div>
                                <Button variant="outline-secondary" className="me-2" onClick={() => handleReorderQuiz(quiz.id, 'up')} disabled={index === 0 || loading}>
                                    <FaArrowUp />
                                </Button>
                                <Button variant="outline-secondary" className="me-2" onClick={() => handleReorderQuiz(quiz.id, 'down')} disabled={index === quizzes.length - 1 || loading}>
                                    <FaArrowDown />
                                </Button>
                                <Button variant="outline-primary" className="me-2" onClick={() => handleShowModal('edit', quiz)} disabled={loading}>
                                    <FaEdit />
                                </Button>
                                <Button variant="outline-danger" onClick={() => handleDeleteQuiz(quiz.id)} disabled={loading}>
                                    <FaTrash />
                                </Button>
                            </div>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </Container>

            <Modal show={showModal} onHide={handleCloseModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{modalMode === 'add' ? 'เพิ่มแบบทดสอบใหม่' : 'แก้ไขแบบทดสอบ'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>ชื่อแบบทดสอบ</Form.Label>
                            <Form.Control
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="กรอกชื่อแบบทดสอบ"
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>รายละเอียดแบบทดสอบ</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="กรอกรายละเอียดแบบทดสอบ"
                            />
                        </Form.Group>
                        <h5 className="mt-4">คำถามในแบบทดสอบ</h5>
                        <ListGroup className="mb-3">
                            {formData.questions.map((question, index) => (
                                <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                                    <div>{question.text}</div>
                                    <div>
                                        <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEditQuestion(question, index)}>
                                            <FaEdit />
                                        </Button>
                                        <Button variant="outline-danger" size="sm" onClick={() => handleDeleteQuestion(index)}>
                                            <FaTrash />
                                        </Button>
                                    </div>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                        <Button variant="outline-primary" onClick={handleAddQuestion} className="mb-3">
                            <FaPlus /> เพิ่มคำถามใหม่
                        </Button>
                        <div>
                            <Button variant="primary" type="submit" disabled={loading}>
                                {loading ? 'กำลังบันทึก...' : (modalMode === 'add' ? 'เพิ่มแบบทดสอบ' : 'บันทึกการแก้ไข')}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>


            <EditQuestionModal
                show={showQuestionModal}
                onHide={() => setShowQuestionModal(false)}
                question={currentQuestion}
                onSave={handleSaveQuestion}
            />
        </>
    );
}

export default QuizManagement;