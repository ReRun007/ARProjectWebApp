import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { FaClipboardList, FaInfoCircle } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';

function StudentQuizDisplay({ quizzes, classId: propClassId }) {
    const navigate = useNavigate();
    const { classId: paramClassId } = useParams();
    const classId = propClassId || paramClassId;

    const handleStartQuiz = (quizId) => {
        if (!classId) {
            console.error('Class ID is undefined');
            return;
        }
        navigate(`/student/classroom/${classId}/quiz/${quizId}`);
    };

    const EmptyQuizState = () => (
        <Card className="text-center ">
            <Card.Body className="py-5">
                <FaInfoCircle size={64} className="mb-3 text-primary" />
                <Card.Title>ยังไม่มีแบบทดสอบในห้องเรียนนี้</Card.Title>
                <Card.Text>
                    ครูผู้สอนยังไม่ได้สร้างแบบทดสอบสำหรับห้องเรียนนี้
                    <br />
                    คุณจะเห็นแบบทดสอบที่นี่เมื่อครูสร้างขึ้น
                </Card.Text>

            </Card.Body>
        </Card>
    );

    return (
        <Card className="shadow-sm">
            <Card.Body>
                {quizzes && quizzes.length > 0 ? (
                    quizzes.map((quiz) => (
                        <Card key={quiz.id} className="mb-3">
                            <Card.Body>
                                <Card.Title>
                                    <FaClipboardList className="me-2" />
                                    {quiz.title}
                                </Card.Title>
                                <Card.Text>{quiz.description}</Card.Text>
                                <Button 
                                    variant="primary" 
                                    onClick={() => handleStartQuiz(quiz.id)}
                                    disabled={!classId}
                                >
                                    เริ่มทำแบบทดสอบ
                                </Button>
                            </Card.Body>
                        </Card>
                    ))
                ) : (
                    <EmptyQuizState />
                )}
            </Card.Body>
        </Card>
    );
}

export default StudentQuizDisplay;