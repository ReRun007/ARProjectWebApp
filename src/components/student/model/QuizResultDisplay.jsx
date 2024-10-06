import React from 'react';
import { Card, ListGroup, Image, Button, Container, ProgressBar, Row, Col } from 'react-bootstrap';
import { FaCheckCircle, FaTimesCircle, FaInfoCircle, FaQuestionCircle } from 'react-icons/fa';

function QuizResultDisplay({ quiz, answers, score, totalQuestions, onBackToClassroom }) {
    return (
        <Container className="py-4">
            <Card className="shadow">
                <Card.Body>
                    <Card.Title className="text-center mb-4 display-4">ผลการทำแบบทดสอบ</Card.Title>
                    <Row className="justify-content-center mb-4">
                        <Col md={6}>
                            <Card className="text-center bg-light">
                                <Card.Body>
                                    <h1 className="display-1 mb-0">{score}/{totalQuestions}</h1>
                                    <p className="lead mt-2">คะแนนของคุณ</p>
                                    <ProgressBar
                                        now={(score / totalQuestions) * 100}
                                        label={`${((score / totalQuestions) * 100).toFixed(0)}%`}
                                        variant={score === totalQuestions ? "success" : score >= totalQuestions / 2 ? "warning" : "danger"}
                                        className="mt-3"
                                        style={{ height: '20px' }}
                                    />
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                    <p className="text-center lead mb-4">
                        {score === totalQuestions
                            ? "🎉 ยอดเยี่ยม! คุณทำคะแนนได้เต็ม"
                            : score >= totalQuestions / 2
                            ? "👍 ดีมาก! คุณผ่านเกณฑ์แล้ว"
                            : "💪 พยายามต่อไป! คุณสามารถทำได้ดีกว่านี้"}
                    </p>
                    
                    <h3 className="mb-4 text-center">รายละเอียดคำตอบ</h3>
                    <ListGroup className="mb-4">
                        {quiz.questions.map((question, index) => (
                            <ListGroup.Item key={index} className="mb-4 border rounded shadow-sm">
                                <h5 className="mb-3">
                                    <FaQuestionCircle className="me-2 text-primary" />
                                    {index + 1}. {question.text}
                                </h5>
                                {question.image && (
                                    <Image src={question.image} alt="Question Image" fluid className="mb-3 rounded" style={{ maxHeight: '200px' }} />
                                )}
                                <Row xs={1} md={2} className="g-4">
                                    {question.options.map((option, optionIndex) => {
                                        const isCorrect = optionIndex === question.correctAnswer;
                                        const isSelected = answers[index] === optionIndex;
                                        let style = {};
                                        let icon = null;

                                        if (isCorrect && isSelected) {
                                            style = { backgroundColor: '#d4edda', borderColor: '#28a745' };
                                            icon = <FaCheckCircle className="text-success me-2" />;
                                        } else if (isCorrect && !isSelected) {
                                            style = { backgroundColor: '#cce5ff', borderColor: '#007bff' };
                                            icon = <FaInfoCircle className="text-primary me-2" />;
                                        } else if (!isCorrect && isSelected) {
                                            style = { backgroundColor: '#f8d7da', borderColor: '#dc3545' };
                                            icon = <FaTimesCircle className="text-danger me-2" />;
                                        }

                                        return (
                                            <Col key={optionIndex}>
                                                <Card style={style} className="h-100">
                                                    <Card.Body>
                                                        <div className="d-flex align-items-center mb-2">
                                                            {icon}
                                                            <span>{typeof option === 'string' ? option : option.text}</span>
                                                        </div>
                                                        {typeof option !== 'string' && option.image && (
                                                            <Image
                                                                src={option.image}
                                                                alt={`Option ${optionIndex + 1}`}
                                                                fluid
                                                                className="mt-2 rounded"
                                                                style={{ maxHeight: '150px', objectFit: 'cover' }}
                                                            />
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        );
                                    })}
                                </Row>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                    <div className="text-center">
                        <Button variant="primary" size="lg" onClick={onBackToClassroom}>
                            กลับสู่ห้องเรียน
                        </Button>
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
}

export default QuizResultDisplay;