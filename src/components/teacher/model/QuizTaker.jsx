import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Form, Alert, ProgressBar } from 'react-bootstrap';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useUserAuth } from '../../../context/UserAuthContext';

function QuizTaker() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const { user } = useUserAuth();
    const [quiz, setQuiz] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);

    useEffect(() => {
        fetchQuizData();
    }, [quizId]);

    const fetchQuizData = async () => {
        try {
            const quizDoc = await getDoc(doc(db, 'Quizzes', quizId));
            if (quizDoc.exists()) {
                setQuiz(quizDoc.data());
            } else {
                console.error("Quiz not found");
            }
        } catch (error) {
            console.error("Error fetching quiz:", error);
        }
    };

    const handleAnswerSelect = (questionIndex, optionIndex) => {
        setSelectedAnswers({
            ...selectedAnswers,
            [questionIndex]: optionIndex
        });
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            calculateScore();
        }
    };

    const calculateScore = () => {
        let calculatedScore = 0;
        quiz.questions.forEach((question, index) => {
            if (selectedAnswers[index] === question.correctAnswer) {
                calculatedScore++;
            }
        });
        setScore(calculatedScore);
        setShowResult(true);
        saveQuizResult(calculatedScore);
    };

    const saveQuizResult = async (calculatedScore) => {
        try {
            await setDoc(doc(db, 'QuizResults', `${quizId}_${user.uid}`), {
                quizId: quizId,
                userId: user.uid,
                score: calculatedScore,
                totalQuestions: quiz.questions.length,
                completedAt: new Date()
            });
        } catch (error) {
            console.error("Error saving quiz result:", error);
        }
    };

    if (!quiz) {
        return <div>Loading...</div>;
    }

    if (showResult) {
        return (
            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <Card.Title>ผลการทำแบบทดสอบ</Card.Title>
                    <Alert variant="info">
                        คุณได้คะแนน {score} จาก {quiz.questions.length} คะแนน
                    </Alert>
                    <ProgressBar 
                        now={(score / quiz.questions.length) * 100} 
                        label={`${((score / quiz.questions.length) * 100).toFixed(2)}%`}
                    />
                    <Button 
                        variant="primary" 
                        className="mt-3"
                        onClick={() => navigate(`/classroom/${quiz.classId}`)}
                    >
                        กลับสู่ห้องเรียน
                    </Button>
                </Card.Body>
            </Card>
        );
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];

    return (
        <Card className="shadow-sm mb-4">
            <Card.Body>
                <Card.Title>{quiz.title} - คำถามที่ {currentQuestionIndex + 1}</Card.Title>
                <ProgressBar 
                    now={((currentQuestionIndex + 1) / quiz.questions.length) * 100} 
                    label={`${currentQuestionIndex + 1}/${quiz.questions.length}`}
                    className="mb-3"
                />
                <Card.Text>{currentQuestion.text}</Card.Text>
                {currentQuestion.image && (
                    <img src={currentQuestion.image} alt="Question" className="img-fluid mb-3" />
                )}
                <Form>
                    {currentQuestion.options.map((option, index) => (
                        <Form.Check
                            key={index}
                            type="radio"
                            id={`option-${index}`}
                            label={option.text}
                            name="quizOption"
                            checked={selectedAnswers[currentQuestionIndex] === index}
                            onChange={() => handleAnswerSelect(currentQuestionIndex, index)}
                        />
                    ))}
                </Form>
                <Button 
                    variant="primary" 
                    className="mt-3"
                    onClick={handleNextQuestion}
                    disabled={selectedAnswers[currentQuestionIndex] === undefined}
                >
                    {currentQuestionIndex < quiz.questions.length - 1 ? 'ถัดไป' : 'ส่งคำตอบ'}
                </Button>
            </Card.Body>
        </Card>
    );
}

export default QuizTaker;