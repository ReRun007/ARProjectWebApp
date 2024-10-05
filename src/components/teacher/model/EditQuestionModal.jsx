import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, ListGroup, Image, Row, Col, Card } from 'react-bootstrap';
import { FaPlus, FaTrash, FaImage } from 'react-icons/fa';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../firebase';

function EditQuestionModal({ show, onHide, question, onSave, classId, quizId }) {
    const [editedQuestion, setEditedQuestion] = useState({
        text: '',
        image: null,
        options: [{ text: '', image: null }, { text: '', image: null }],
        correctAnswer: 0
    });

    useEffect(() => {
        if (question) {
            setEditedQuestion({ ...question });
        } else {
            setEditedQuestion({
                text: '',
                image: null,
                options: [{ text: '', image: null }, { text: '', image: null }],
                correctAnswer: 0
            });
        }
    }, [question]);

    const handleQuestionChange = (e) => {
        setEditedQuestion({ ...editedQuestion, text: e.target.value });
    };

    const handleOptionChange = (index, field, value) => {
        const updatedOptions = [...editedQuestion.options];
        updatedOptions[index] = { ...updatedOptions[index], [field]: value };
        setEditedQuestion({ ...editedQuestion, options: updatedOptions });
    };

    const handleAddOption = () => {
        if (editedQuestion.options.length < 4) {
            setEditedQuestion({
                ...editedQuestion,
                options: [...editedQuestion.options, { text: '', image: null }]
            });
        }
    };

    const handleRemoveOption = (index) => {
        if (editedQuestion.options.length > 2) {
            const updatedOptions = editedQuestion.options.filter((_, i) => i !== index);
            setEditedQuestion({
                ...editedQuestion,
                options: updatedOptions,
                correctAnswer: editedQuestion.correctAnswer >= updatedOptions.length ? 0 : editedQuestion.correctAnswer
            });
        }
    };

    const handleCorrectAnswerChange = (index) => {
        setEditedQuestion({ ...editedQuestion, correctAnswer: index });
    };

    const handleImageUpload = async (file, type, index = null) => {
        try {
            if (!file) return;
    
            const fileExtension = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExtension}`;
            const storagePath = `quizzes/${classId}/${quizId}/${type === 'question' ? 'question' : `option_${index}`}_${fileName}`;
            
            const storageRef = ref(storage, storagePath);
            await uploadBytes(storageRef, file);
            const imageUrl = await getDownloadURL(storageRef);
    
            if (type === 'question') {
                setEditedQuestion({ ...editedQuestion, image: imageUrl });
            } else if (type === 'option') {
                handleOptionChange(index, 'image', imageUrl);
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ กรุณาลองใหม่อีกครั้ง");
        }
    };

    const handleSave = () => {
        if (!editedQuestion.text || editedQuestion.options.some(opt => !opt.text)) {
            alert("กรุณากรอกคำถามและตัวเลือกทุกข้อให้ครบถ้วน");
            return;
        }
        
        // สร้าง object ใหม่ที่มีเฉพาะข้อมูลที่จำเป็น
        const questionToSave = {
            text: editedQuestion.text,
            image: editedQuestion.image,
            options: editedQuestion.options.map(option => ({
                text: option.text,
                image: option.image
            })),
            correctAnswer: editedQuestion.correctAnswer
        };
        
        onSave(questionToSave);
        onHide();
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>{question ? 'แก้ไขคำถาม' : 'เพิ่มคำถามใหม่'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>คำถาม</Form.Label>
                        <Form.Control
                            type="text"
                            value={editedQuestion.text}
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
                        {editedQuestion.image && (
                            <Image src={editedQuestion.image} fluid className="mt-2" style={{ maxWidth: '200px' }} />
                        )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>ตัวเลือกคำตอบ</Form.Label>
                        {editedQuestion.options.map((option, index) => (
                            <Card key={index} className="mb-2">
                                <Card.Body>
                                    <Row className="align-items-center">
                                        <Col xs="auto">
                                            <Form.Check
                                                type="radio"
                                                id={`correct-answer-${index}`}
                                                name="correctAnswer"
                                                checked={editedQuestion.correctAnswer === index}
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
                                        <Image src={option.image} fluid className="mt-2" style={{ maxWidth: '100px' }} />
                                    )}
                                </Card.Body>
                            </Card>
                        ))}
                    </Form.Group>

                    {editedQuestion.options.length < 4 && (
                        <Button variant="outline-secondary" className="mb-3" onClick={handleAddOption}>
                            <FaPlus /> เพิ่มตัวเลือก
                        </Button>
                    )}
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    ยกเลิก
                </Button>
                <Button variant="primary" onClick={handleSave}>
                    บันทึก
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default EditQuestionModal;