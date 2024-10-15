import React, { useState, useEffect } from 'react';
import { Card, Button, Form, ListGroup, Modal, Alert } from 'react-bootstrap';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, updateDoc, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { FaPlus, FaEdit, FaTrash, FaFile, FaDownload, FaFileAlt  } from 'react-icons/fa';

function AssignmentManagement({ classId }) {
    const [assignments, setAssignments] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentAssignment, setCurrentAssignment] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: '',
        dueTime: '',
        points: 0,
        file: null,
        fileUrl: ''
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAssignments();
    }, [classId]);

    const fetchAssignments = async () => {
        try {
            const q = query(
                collection(db, "Assignments"),
                where("classId", "==", classId),
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            setAssignments(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching assignments:", error);
            setError("Failed to load assignments. Please try again.");
        }
    };

    const handleShowModal = (assignment = null) => {
        setCurrentAssignment(assignment);
        if (assignment) {
            const [date, time] = assignment.dueDateTime.split('T');
            setFormData({ ...assignment, dueDate: date, dueTime: time });
        } else {
            setFormData({
                title: '',
                description: '',
                dueDate: '',
                dueTime: '',
                points: 0,
                file: null,
                fileUrl: ''
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setCurrentAssignment(null);
        setFormData({
            title: '',
            description: '',
            dueDate: '',
            dueTime: '',
            points: 0,
            file: null,
            fileUrl: ''
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({ ...prev, file: e.target.files[0] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let fileUrl = formData.fileUrl;
            if (formData.file) {
                const storageRef = ref(storage, `assignment/${classId}/${formData.file.name}`);
                await uploadBytes(storageRef, formData.file);
                fileUrl = await getDownloadURL(storageRef);
            }

            const assignmentData = {
                ...formData,
                dueDateTime: `${formData.dueDate}T${formData.dueTime}`,
                fileUrl,
                classId,
                createdAt: new Date()
            };

            delete assignmentData.file;
            delete assignmentData.dueDate;
            delete assignmentData.dueTime;

            if (currentAssignment) {
                await updateDoc(doc(db, "Assignments", currentAssignment.id), assignmentData);
            } else {
                await addDoc(collection(db, "Assignments"), assignmentData);
            }
            handleCloseModal();
            fetchAssignments();
        } catch (error) {
            console.error("Error saving assignment:", error);
            setError("Failed to save assignment. Please try again.");
        }
    };

    const handleDeleteAssignment = async (assignmentId) => {
        if (window.confirm("Are you sure you want to delete this assignment?")) {
            try {
                const assignmentDoc = await getDoc(doc(db, "Assignments", assignmentId));
                const assignmentData = assignmentDoc.data();
                if (assignmentData.fileUrl) {
                    const fileRef = ref(storage, assignmentData.fileUrl);
                    await deleteObject(fileRef);
                }
                await deleteDoc(doc(db, "Assignments", assignmentId));
                fetchAssignments();
            } catch (error) {
                console.error("Error deleting assignment:", error);
                setError("Failed to delete assignment. Please try again.");
            }
        }
    };

    const EmptyAssignmentState = ({ onAddAssignment }) => (
        <Card className="text-center shadow-sm border-primary">
            <Card.Body className="py-5">
                <FaFileAlt  size={64} className="mb-3 text-primary" />
                <Card.Title className="mb-3">ยังไม่มีการบ้านในห้องเรียนนี้</Card.Title>
                <Card.Text>
                    เริ่มสร้างการบ้านแรกของคุณเพื่อมอบหมายงานให้นักเรียน
                </Card.Text>
                <Button variant="primary" onClick={onAddAssignment}>
                    <FaPlus className="me-2" /> สร้างการบ้านใหม่
                </Button>
            </Card.Body>
        </Card>
    );

    return (
        <Card className="mt-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Assignments</h5>
                <Button variant="primary" onClick={() => handleShowModal()}>
                    <FaPlus /> Add Assignment
                </Button>
            </Card.Header>
            <Card.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                {assignments.length > 0 ? (
                    <ListGroup>
                        {assignments.map((assignment) => (
                            <ListGroup.Item key={assignment.id} className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6>{assignment.title}</h6>
                                    <small>Due: {new Date(assignment.dueDateTime).toLocaleString()}</small>
                                    {assignment.fileUrl && (
                                        <div>
                                            <FaFile className="me-2" />
                                            <a href={assignment.fileUrl} target="_blank" rel="noopener noreferrer">
                                                Attached File <FaDownload />
                                            </a>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleShowModal(assignment)}>
                                        <FaEdit />
                                    </Button>
                                    <Button variant="outline-danger" size="sm" onClick={() => handleDeleteAssignment(assignment.id)}>
                                        <FaTrash />
                                    </Button>
                                </div>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                ) : (
                    <EmptyAssignmentState onAddAssignment={() => handleShowModal()} />
                )}
            </Card.Body>

            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>{currentAssignment ? 'Edit Assignment' : 'Add New Assignment'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Title</Form.Label>
                            <Form.Control
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Due Date</Form.Label>
                            <Form.Control
                                type="date"
                                name="dueDate"
                                value={formData.dueDate}
                                onChange={handleInputChange}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Due Time</Form.Label>
                            <Form.Control
                                type="time"
                                name="dueTime"
                                value={formData.dueTime}
                                onChange={handleInputChange}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Points</Form.Label>
                            <Form.Control
                                type="number"
                                name="points"
                                value={formData.points}
                                onChange={handleInputChange}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Attach File</Form.Label>
                            <Form.Control
                                type="file"
                                onChange={handleFileChange}
                            />
                        </Form.Group>
                        {formData.fileUrl && (
                            <div className="mb-3">
                                <FaFile className="me-2" />
                                <a href={formData.fileUrl} target="_blank" rel="noopener noreferrer">
                                    Current File <FaDownload />
                                </a>
                            </div>
                        )}
                        <Button variant="primary" type="submit">
                            {currentAssignment ? 'Update' : 'Create'} Assignment
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </Card>
    );
}

export default AssignmentManagement;