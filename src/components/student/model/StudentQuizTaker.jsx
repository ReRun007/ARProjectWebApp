import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Button, Alert, Image, Container, ProgressBar, Modal, Row, Col } from 'react-bootstrap';
import { db } from '../../../firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useUserAuth } from '../../../context/UserAuthContext';
import Header from '../Header';
import { FaCheckCircle, FaTimesCircle, FaClock, FaArrowRight, FaArrowLeft, FaQuestionCircle } from 'react-icons/fa';
import QuizResultDisplay from './QuizResultDisplay';
import QuizOptionDisplay from './QuizOptionDisplay';
import { recordQuizAttempt } from '../../../utils/attendanceUtils';

function StudentQuizTaker() {
    const { classId, quizId } = useParams();
    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [score, setScore] = useState(null);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [quizResult, setQuizResult] = useState(null);
    const { user } = useUserAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchQuizAndCheckAttempt();
    }, [quizId, user]);

    useEffect(() => {
        let timer;
        if (quiz && quiz.timeLimit && !submitted) {
            setTimeLeft(quiz.timeLimit * 60);
            timer = setInterval(() => {
                setTimeLeft(prevTime => {
                    if (prevTime <= 1) {
                        clearInterval(timer);
                        handleSubmit();
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [quiz, submitted]);

    const fetchQuizAndCheckAttempt = async () => {
        setLoading(true);
        try {
            if (!quizId) throw new Error('Quiz ID is missing');

            const quizDoc = await getDoc(doc(db, 'Quizzes', quizId));
            if (quizDoc.exists()) {
                const quizData = quizDoc.data();
                setQuiz(quizData);
                setTotalQuestions(quizData.questions.length);

                if (user && user.uid) {
                    const attemptQuery = query(
                        collection(db, 'QuizResults'),
                        where('quizId', '==', quizId),
                        where('userId', '==', user.uid)
                    );
                    const attemptSnapshot = await getDocs(attemptQuery);

                    if (!attemptSnapshot.empty) {
                        const attemptData = attemptSnapshot.docs[0].data();
                        setScore(attemptData.score);
                        setSubmitted(true);
                        setQuizResult(attemptData);
                        setAnswers(attemptData.answers);
                    }
                }
            } else {
                setError('ไม่พบแบบทดสอบ');
            }
        } catch (error) {
            console.error("Error fetching quiz:", error);
            setError('เกิดข้อผิดพลาดในการโหลดแบบทดสอบ: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (questionId, answer) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setError('');
        try {
            let correctAnswers = 0;
            quiz.questions.forEach((question, index) => {
                if (answers[index] === question.correctAnswer) {
                    correctAnswers++;
                }
            });
            const finalScore = correctAnswers;
            setScore(finalScore);
    
            const resultData = {
                quizId: quizId,
                userId: user.uid,
                score: finalScore,
                totalQuestions: totalQuestions,
                answers: answers,
                submittedAt: new Date()
            };
    
            await setDoc(doc(db, 'QuizResults', `${quizId}_${user.uid}`), resultData);
    
            // บันทึกการทำแบบทดสอบ
            await recordQuizAttempt(user.uid, classId, quizId);
    
            setSubmitted(true);
            setQuizResult(resultData);
        } catch (error) {
            console.error("Error submitting quiz:", error);
            setError('เกิดข้อผิดพลาดในการส่งคำตอบ');
        }
    };

    const handleNext = () => {
        if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <Alert variant="info">กำลังโหลดแบบทดสอบ...</Alert>
            </Container>
        );
    }

    if (error) {
        return (
            <>
                <Header />
                <Container className="py-4">
                    <Alert variant="danger">{error}</Alert>
                    <Button onClick={() => navigate(`/student/classroom/${classId}`)}>กลับสู่ห้องเรียน</Button>
                </Container>
            </>
        );
    }

    if (submitted) {
        return (
            <>
                <Header />
                <QuizResultDisplay
                    quiz={quiz}
                    answers={answers}
                    score={score}
                    totalQuestions={totalQuestions}
                    onBackToClassroom={() => navigate(`/student/classroom/${classId}`)}
                />
            </>
        );
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];

    return (
        <>
            <Header />
            <Container className="py-4">
                <Card className="shadow-lg border-0">
                    <Card.Body className="p-md-5">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2 className="text-primary mb-0">{quiz.title}</h2>
                            {timeLeft !== null && (
                                <Card className="bg-light">
                                    <Card.Body className="py-2 px-3">
                                        <h5 className="mb-0 d-flex align-items-center">
                                            <FaClock className="me-2 text-warning" />
                                            เวลาที่เหลือ: {formatTime(timeLeft)}
                                        </h5>
                                    </Card.Body>
                                </Card>
                            )}
                        </div>
                        <ProgressBar
                            now={(currentQuestionIndex + 1) / totalQuestions * 100}
                            label={`${currentQuestionIndex + 1}/${totalQuestions}`}
                            className="mb-4"
                            style={{ height: '10px' }}
                        />
                        <Form>
                            <Card className="mb-4 border-0 shadow">
                                <Card.Body>
                                    <h4 className="mb-3 d-flex align-items-center">
                                        <FaQuestionCircle className="text-primary me-2" />
                                        {currentQuestion.text}
                                    </h4>
                                    {currentQuestion.image && (
                                        <Image src={currentQuestion.image} alt="Question Image" fluid className="mb-3 rounded" />
                                    )}
                                    <Row xs={1} md={2} className="g-4">
                                        {currentQuestion.options.map((option, optionIndex) => (
                                            <QuizOptionDisplay
                                                key={optionIndex}
                                                option={option}
                                                optionIndex={optionIndex}
                                                isSelected={answers[currentQuestionIndex] === optionIndex}
                                                onSelect={() => handleAnswerChange(currentQuestionIndex, optionIndex)}
                                            />
                                        ))}
                                    </Row>
                                </Card.Body>
                            </Card>
                            <div className="d-flex justify-content-between">
                                <Button variant="outline-primary" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
                                    <FaArrowLeft className="me-2" />
                                    ก่อนหน้า
                                </Button>
                                {currentQuestionIndex === totalQuestions - 1 ? (
                                    <Button variant="success" onClick={() => setShowConfirmModal(true)}>
                                        ส่งคำตอบ
                                        <FaCheckCircle className="ms-2" />
                                    </Button>
                                ) : (
                                    <Button variant="primary" onClick={handleNext}>
                                        ถัดไป
                                        <FaArrowRight className="ms-2" />
                                    </Button>
                                )}
                            </div>
                        </Form>
                    </Card.Body>
                </Card>
            </Container>

            <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>ยืนยันการส่งคำตอบ</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    คุณแน่ใจหรือไม่ที่จะส่งคำตอบ? หลังจากส่งแล้วคุณจะไม่สามารถแก้ไขคำตอบได้
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
                        ยกเลิก
                    </Button>
                    <Button variant="primary" onClick={() => {
                        setShowConfirmModal(false);
                        handleSubmit();
                    }}>
                        ยืนยันการส่งคำตอบ
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default StudentQuizTaker;