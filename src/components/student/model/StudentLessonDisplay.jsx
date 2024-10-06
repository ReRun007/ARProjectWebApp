import React, { useState } from 'react';
import { Card, Button, Modal } from 'react-bootstrap';
import { FaBook, FaDownload, FaEye } from 'react-icons/fa';

function StudentLessonDisplay({ lessons }) {
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [selectedLesson, setSelectedLesson] = useState(null);

    const handleShowLesson = (lesson) => {
        setSelectedLesson(lesson);
        setShowLessonModal(true);
    };

    return (
        <>
            <Card className="shadow-sm">
                <Card.Body>
                    {lessons.length > 0 ? (
                        lessons.map((lesson) => (
                            <Card key={lesson.id} className="mb-3">
                                <Card.Body>
                                    <Card.Title>
                                        <FaBook className="me-2" />
                                        บทที่ {lesson.order}: {lesson.title}
                                    </Card.Title>
                                    <Card.Text>{lesson.description}</Card.Text>
                                    <Button variant="primary" className="me-2" onClick={() => handleShowLesson(lesson)}>
                                        <FaEye className="me-2" />
                                        ดูรายละเอียด
                                    </Button>
                                    {lesson.fileUrl && (
                                        <Button variant="outline-primary" href={lesson.fileUrl} target="_blank" rel="noopener noreferrer">
                                            <FaDownload className="me-2" />
                                            ดาวน์โหลดเอกสาร
                                        </Button>
                                    )}
                                </Card.Body>
                            </Card>
                        ))
                    ) : (
                        <p className="text-center text-muted">ยังไม่มีบทเรียนในห้องเรียนนี้</p>
                    )}
                </Card.Body>
            </Card>

            <Modal show={showLessonModal} onHide={() => setShowLessonModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>บทที่ {selectedLesson?.order}: {selectedLesson?.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <h5>รายละเอียด</h5>
                    <p>{selectedLesson?.description}</p>
                    <h5>เนื้อหา</h5>
                    <div dangerouslySetInnerHTML={{ __html: selectedLesson?.content }} />
                    {selectedLesson?.fileUrl && (
                        <Button variant="primary" href={selectedLesson.fileUrl} target="_blank" rel="noopener noreferrer">
                            <FaDownload className="me-2" />
                            ดาวน์โหลดเอกสารประกอบ
                        </Button>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowLessonModal(false)}>
                        ปิด
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default StudentLessonDisplay;