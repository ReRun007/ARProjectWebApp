import React from 'react';
import { Card, Form, Image, Row, Col } from 'react-bootstrap';

function QuizOptionDisplay({ option, optionIndex, isSelected, onSelect }) {
    return (
        <Col xs={12} md={6} className="mb-3">
            <Card 
                className={`h-100 ${isSelected ? 'border-primary' : ''}`}
                onClick={onSelect}
                style={{cursor: 'pointer'}}
            >
                <Card.Body className="d-flex flex-column">
                    <Form.Check
                        type="radio"
                        id={`option-${optionIndex}`}
                        name="quizOption"
                        checked={isSelected}
                        onChange={() => {}}
                        label={
                            <div className="d-flex flex-column align-items-start w-100">
                                <span className="mb-2">{typeof option === 'string' ? option : option.text}</span>
                                {typeof option !== 'string' && option.image && (
                                    <div className="image-container" style={{ width: '100%', height: '200px', overflow: 'hidden' }}>
                                        <Image
                                            src={option.image}
                                            alt={`Option ${optionIndex + 1}`}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                objectPosition: 'center'
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        }
                    />
                </Card.Body>
            </Card>
        </Col>
    );
}

export default QuizOptionDisplay;
