import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { FaClipboardList } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';

function StudentQuizDisplay({ quizzes, classId: propClassId }) {
    const navigate = useNavigate();
    const { classId: paramClassId } = useParams(); // ใช้ useParams เพื่อรับ classId จาก URL

    // ใช้ classId จาก props ถ้ามี ถ้าไม่มีให้ใช้จาก URL params
    const classId = propClassId || paramClassId;

    const handleStartQuiz = (quizId) => {
        if (!classId) {
            console.error('Class ID is undefined');
            return;
        }
        navigate(`/student/classroom/${classId}/quiz/${quizId}`);
    };

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
                                    disabled={!classId} // ปิดปุ่มถ้าไม่มี classId
                                >
                                    เริ่มทำแบบทดสอบ
                                </Button>
                            </Card.Body>
                        </Card>
                    ))
                ) : (
                    <p className="text-center text-muted">ยังไม่มีแบบทดสอบในห้องเรียนนี้</p>
                )}
            </Card.Body>
        </Card>
    );
}

export default StudentQuizDisplay;