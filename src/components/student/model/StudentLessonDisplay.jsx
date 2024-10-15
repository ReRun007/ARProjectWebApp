import React, { useState } from 'react';
import { Card, Button, Modal } from 'react-bootstrap';
import { FaBook, FaDownload, FaEye, FaInfoCircle } from 'react-icons/fa';
import { useUserAuth } from '../../../context/UserAuthContext';
import { recordLessonView } from '../../../utils/attendanceUtils';

function StudentLessonDisplay({ lessons, classId }) {
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [viewStartTime, setViewStartTime] = useState(null);
    const { user } = useUserAuth();


    const handleShowLesson = (lesson) => {
        setSelectedLesson(lesson);
        setShowLessonModal(true);
        setViewStartTime(Date.now());
    };


    const handleCloseLesson = async () => {
        if (viewStartTime && user && selectedLesson && classId) {
            const duration = Math.round((Date.now() - viewStartTime) / 1000);
            try {
                console.log('Recording lesson view:', { 
                    studentId: user.uid, 
                    classId, 
                    lessonId: selectedLesson.id, 
                    duration 
                });
                await recordLessonView(user.uid, classId, selectedLesson.id, duration);
                console.log('Lesson view recorded successfully');
            } catch (error) {
                console.error('Error recording lesson view:', error);
            }
        } else {
            console.warn('Missing required data for recording lesson view', { 
                user, selectedLesson, classId, viewStartTime 
            });
        }
        setShowLessonModal(false);
        setSelectedLesson(null);
        setViewStartTime(null);
    };

    const EmptyLessonState = () => (
        <Card className="text-center ">
            <Card.Body className="py-5">
                <FaInfoCircle size={64} className="mb-3 text-primary" />
                <Card.Title>ยังไม่มีบทเรียนในห้องเรียนนี้</Card.Title>
                <Card.Text>
                    ครูผู้สอนยังไม่ได้เพิ่มบทเรียนสำหรับห้องเรียนนี้
                    <br />
                    คุณจะเห็นบทเรียนที่นี่เมื่อครูเพิ่มเข้ามา
                </Card.Text>
            </Card.Body>
        </Card>
    );


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
                        <EmptyLessonState />
                    )}
                </Card.Body>
            </Card>

            <Modal show={showLessonModal} onHide={handleCloseLesson} size="lg">
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
                    <Button variant="secondary" onClick={handleCloseLesson}>
                        ปิด
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default StudentLessonDisplay;