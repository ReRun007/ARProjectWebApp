import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, ListGroup } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, doc, deleteDoc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { FaPlus, FaEdit, FaTrash, FaFile } from 'react-icons/fa';
import Header from './Header';

function LessonManagement() {
    const { classId } = useParams();
    const [lessons, setLessons] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [currentLesson, setCurrentLesson] = useState(null);
    const [formData, setFormData] = useState({
        ls_name: '',
        ls_number: '',
        lsd_description: '',
        lsd_file: ''
    });

    useEffect(() => {
        fetchLessons();
    }, [classId]);

    const fetchLessons = async () => {
        const q = query(collection(db, "Lessons"), where("sj_id", "==", classId));
        const querySnapshot = await getDocs(q);
        const lessonList = await Promise.all(querySnapshot.docs.map(async (docSnap) => {
            const lesson = { id: docSnap.id, ...docSnap.data() };
            const detailsDoc = await getDoc(doc(db, "LessonDetails", docSnap.id));
            if (detailsDoc.exists()) {
                lesson.details = detailsDoc.data();
            }
            return lesson;
        }));
        setLessons(lessonList);
    };

    const handleShowModal = (mode, lesson = null) => {
        setModalMode(mode);
        setCurrentLesson(lesson);
        if (mode === 'edit' && lesson) {
            setFormData({
                ls_name: lesson.ls_name,
                ls_number: lesson.ls_number,
                lsd_description: lesson.details?.lsd_description || '',
                lsd_file: lesson.details?.lsd_file || ''
            });
        } else {
            setFormData({ ls_name: '', ls_number: '', lsd_description: '', lsd_file: '' });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setCurrentLesson(null);
        setFormData({ ls_name: '', ls_number: '', lsd_description: '', lsd_file: '' });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (modalMode === 'add') {
            const lessonRef = await addDoc(collection(db, "Lessons"), {
                ls_name: formData.ls_name,
                ls_number: parseInt(formData.ls_number),
                sj_id: classId
            });
            await setDoc(doc(db, "LessonDetails", lessonRef.id), {
                ls_id: lessonRef.id,
                lsd_description: formData.lsd_description,
                lsd_file: formData.lsd_file
            });
        } else if (modalMode === 'edit' && currentLesson) {
            await updateDoc(doc(db, "Lessons", currentLesson.id), {
                ls_name: formData.ls_name,
                ls_number: parseInt(formData.ls_number)
            });
            await updateDoc(doc(db, "LessonDetails", currentLesson.id), {
                lsd_description: formData.lsd_description,
                lsd_file: formData.lsd_file
            });
        }
        handleCloseModal();
        fetchLessons();
    };

    const handleDeleteLesson = async (lessonId) => {
        if (window.confirm("คุณแน่ใจหรือไม่ที่จะลบบทเรียนนี้?")) {
            await deleteDoc(doc(db, "Lessons", lessonId));
            await deleteDoc(doc(db, "LessonDetails", lessonId));
            fetchLessons();
        }
    };

    return (
        <>
            <Header />
            <Container className="py-5">
                <h1 className="mb-4">จัดการบทเรียน</h1>
                <Button variant="primary" onClick={() => handleShowModal('add')} className="mb-3">
                    <FaPlus /> เพิ่มบทเรียนใหม่
                </Button>
                <ListGroup>
                    {lessons.map((lesson) => (
                        <ListGroup.Item key={lesson.id} className="d-flex justify-content-between align-items-center">
                            <div>
                                <h5>{lesson.ls_name}</h5>
                                <p className="mb-0 text-muted">บทที่ {lesson.ls_number}</p>
                                {lesson.details && <small>{lesson.details.lsd_description}</small>}
                            </div>
                            <div>
                                {lesson.details?.lsd_file && (
                                    <Button variant="outline-secondary" className="me-2" href={lesson.details.lsd_file} target="_blank">
                                        <FaFile /> ไฟล์
                                    </Button>
                                )}
                                <Button variant="outline-primary" className="me-2" onClick={() => handleShowModal('edit', lesson)}>
                                    <FaEdit /> แก้ไข
                                </Button>
                                <Button variant="outline-danger" onClick={() => handleDeleteLesson(lesson.id)}>
                                    <FaTrash /> ลบ
                                </Button>
                            </div>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </Container>

            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>{modalMode === 'add' ? 'เพิ่มบทเรียนใหม่' : 'แก้ไขบทเรียน'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>ชื่อบทเรียน</Form.Label>
                            <Form.Control
                                type="text"
                                name="ls_name"
                                value={formData.ls_name}
                                onChange={handleInputChange}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>บทที่</Form.Label>
                            <Form.Control
                                type="number"
                                name="ls_number"
                                value={formData.ls_number}
                                onChange={handleInputChange}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>รายละเอียดบทเรียน</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="lsd_description"
                                value={formData.lsd_description}
                                onChange={handleInputChange}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>ลิงก์ไฟล์</Form.Label>
                            <Form.Control
                                type="text"
                                name="lsd_file"
                                value={formData.lsd_file}
                                onChange={handleInputChange}
                                placeholder="URL ของไฟล์บทเรียน"
                            />
                        </Form.Group>
                        <Button variant="primary" type="submit">
                            {modalMode === 'add' ? 'เพิ่มบทเรียน' : 'บันทึกการแก้ไข'}
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </>
    );
}

export default LessonManagement;