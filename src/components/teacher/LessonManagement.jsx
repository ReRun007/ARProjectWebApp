import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Form, ListGroup, Modal, Image, Alert } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { db, storage } from '../../firebase';
import { collection, query, where, getDocs, addDoc, doc, deleteDoc, updateDoc, orderBy, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { FaPlus, FaEdit, FaTrash, FaArrowUp, FaArrowDown, FaFile, FaImage, FaVideo } from 'react-icons/fa';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Header from './Header';

function LessonManagement() {
    const { classId } = useParams();
    const [lessons, setLessons] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [currentLesson, setCurrentLesson] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        content: '',
        order: 0,
        file: null,
        fileUrl: '',
        fileType: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchLessons = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const q = query(collection(db, "Lessons"), where("classId", "==", classId), orderBy("order"));
            const querySnapshot = await getDocs(q);
            setLessons(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (err) {
            console.error("Error fetching lessons:", err);
            setError("Failed to load lessons. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [classId]);

    useEffect(() => {
        fetchLessons();
    }, [fetchLessons]);

    const handleShowModal = (mode, lesson = null) => {
        setModalMode(mode);
        setCurrentLesson(lesson);
        if (mode === 'edit' && lesson) {
            setFormData({ ...lesson, file: null });
        } else {
            setFormData({ title: '', description: '', content: '', order: lessons.length, file: null, fileUrl: '', fileType: '' });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setCurrentLesson(null);
        setFormData({ title: '', description: '', content: '', order: 0, file: null, fileUrl: '', fileType: '' });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleContentChange = (content) => {
        setFormData(prev => ({ ...prev, content }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const fileType = file.type.split('/')[0]; // 'image' or 'video'
            setFormData(prev => ({ ...prev, file, fileType }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            let fileUrl = formData.fileUrl;
            let fileType = formData.fileType;

            if (formData.file) {
                const storageRef = ref(storage, `lessons/${classId}/${formData.file.name}`);
                await uploadBytes(storageRef, formData.file);
                fileUrl = await getDownloadURL(storageRef);
                fileType = formData.file.type.split('/')[0];
            }

            const lessonData = {
                title: formData.title,
                description: formData.description,
                content: formData.content,
                order: formData.order,
                classId: classId,
                fileUrl: fileUrl,
                fileType: fileType
            };

            if (modalMode === 'add') {
                await addDoc(collection(db, "Lessons"), lessonData);
            } else if (modalMode === 'edit' && currentLesson) {
                await updateDoc(doc(db, "Lessons", currentLesson.id), lessonData);
            }

            handleCloseModal();
            fetchLessons();
        } catch (err) {
            console.error("Error submitting lesson:", err);
            setError("Failed to save lesson. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLesson = async (lessonId) => {
        if (window.confirm("คุณแน่ใจหรือไม่ที่จะลบบทเรียนนี้?")) {
            setLoading(true);
            setError(null);
            try {
                const lessonDoc = await getDoc(doc(db, "Lessons", lessonId));
                const lessonData = lessonDoc.data();
                
                if (lessonData.fileUrl) {
                    const fileRef = ref(storage, lessonData.fileUrl);
                    await deleteObject(fileRef);
                }
                
                await deleteDoc(doc(db, "Lessons", lessonId));
                fetchLessons();
            } catch (err) {
                console.error("Error deleting lesson:", err);
                setError("Failed to delete lesson. Please try again.");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleReorderLesson = async (lessonId, direction) => {
        const currentIndex = lessons.findIndex(lesson => lesson.id === lessonId);
        if ((direction === 'up' && currentIndex > 0) || (direction === 'down' && currentIndex < lessons.length - 1)) {
            setLoading(true);
            setError(null);
            try {
                const newLessons = [...lessons];
                const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
                [newLessons[currentIndex], newLessons[swapIndex]] = [newLessons[swapIndex], newLessons[currentIndex]];
                
                const batch = writeBatch(db);
                newLessons.forEach((lesson, index) => {
                    const lessonRef = doc(db, "Lessons", lesson.id);
                    batch.update(lessonRef, { order: index });
                });
                await batch.commit();

                setLessons(newLessons);
            } catch (err) {
                console.error("Error reordering lessons:", err);
                setError("Failed to reorder lessons. Please try again.");
            } finally {
                setLoading(false);
            }
        }
    };

    const renderFilePreview = (lesson) => {
        if (lesson.fileUrl) {
            if (lesson.fileType === 'image') {
                return <Image src={lesson.fileUrl} alt={lesson.title} thumbnail style={{ maxWidth: '100px', maxHeight: '100px' }} />;
            } else if (lesson.fileType === 'video') {
                return (
                    <video width="100" height="100" controls>
                        <source src={lesson.fileUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                );
            } else {
                return <FaFile size={30} />;
            }
        }
        return null;
    };

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
            ['link', 'image'],
            ['clean']
        ],
    };

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'bullet', 'indent',
        'link', 'image'
    ];

    if (loading) {
        return <Container className="py-5"><Alert variant="info">กำลังโหลด...</Alert></Container>;
    }

    return (
        <>
            <Header />
            <Container className="py-5">
                <h1 className="mb-4">จัดการบทเรียน</h1>
                {error && <Alert variant="danger">{error}</Alert>}
                <Button variant="primary" onClick={() => handleShowModal('add')} className="mb-3">
                    <FaPlus /> เพิ่มบทเรียนใหม่
                </Button>
                <ListGroup>
                    {lessons.map((lesson, index) => (
                        <ListGroup.Item key={lesson.id} className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                                {renderFilePreview(lesson)}
                                <div className="ms-3">
                                    <h5>{lesson.title}</h5>
                                    <p className="mb-0 text-muted">{lesson.description}</p>
                                </div>
                            </div>
                            <div>
                                <Button variant="outline-secondary" className="me-2" onClick={() => handleReorderLesson(lesson.id, 'up')} disabled={index === 0 || loading}>
                                    <FaArrowUp />
                                </Button>
                                <Button variant="outline-secondary" className="me-2" onClick={() => handleReorderLesson(lesson.id, 'down')} disabled={index === lessons.length - 1 || loading}>
                                    <FaArrowDown />
                                </Button>
                                <Button variant="outline-primary" className="me-2" onClick={() => handleShowModal('edit', lesson)} disabled={loading}>
                                    <FaEdit />
                                </Button>
                                <Button variant="outline-danger" onClick={() => handleDeleteLesson(lesson.id)} disabled={loading}>
                                    <FaTrash />
                                </Button>
                            </div>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </Container>

            <Modal show={showModal} onHide={handleCloseModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{modalMode === 'add' ? 'เพิ่มบทเรียนใหม่' : 'แก้ไขบทเรียน'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>ชื่อบทเรียน</Form.Label>
                            <Form.Control
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>คำอธิบายบทเรียน</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>เนื้อหาบทเรียน</Form.Label>
                            <ReactQuill 
                                theme="snow"
                                value={formData.content}
                                onChange={handleContentChange}
                                modules={modules}
                                formats={formats}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>ไฟล์แนบ</Form.Label>
                            <Form.Control
                                type="file"
                                onChange={handleFileChange}
                                accept="image/*,video/*"
                            />
                        </Form.Group>
                        {formData.fileUrl && (
                            <div className="mb-3">
                                <strong>ไฟล์ปัจจุบัน:</strong>
                                {renderFilePreview(formData)}
                            </div>
                        )}
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? 'กำลังบันทึก...' : (modalMode === 'add' ? 'เพิ่มบทเรียน' : 'บันทึกการแก้ไข')}
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </>
    );
}

export default LessonManagement;