import React, { useState, useEffect } from 'react';
import { Card, Button, ListGroup, Modal, Form, Alert, Badge } from 'react-bootstrap';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../firebase';
import { useUserAuth } from '../../../context/UserAuthContext';
import { FaUpload, FaDownload, FaClipboardList, FaInfoCircle } from 'react-icons/fa';

function StudentAssignmentDisplay({ classId }) {
    const [assignments, setAssignments] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [submissionFile, setSubmissionFile] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const { user } = useUserAuth();

    useEffect(() => {
        fetchAssignments();
    }, [classId]);

    const fetchAssignments = async () => {
        try {
            const q = query(
                collection(db, "Assignments"),
                where("classId", "==", classId),
                orderBy("dueDateTime")
            );
            const querySnapshot = await getDocs(q);
            const assignmentsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Fetch submission status for each assignment
            const assignmentsWithSubmission = await Promise.all(assignmentsData.map(async (assignment) => {
                const submissionQuery = query(
                    collection(db, "Submissions"),
                    where("assignmentId", "==", assignment.id),
                    where("studentId", "==", user.uid)
                );
                const submissionSnapshot = await getDocs(submissionQuery);
                const submission = submissionSnapshot.docs[0]?.data();
                return { ...assignment, submission };
            }));

            setAssignments(assignmentsWithSubmission);
        } catch (error) {
            console.error("Error fetching assignments:", error);
            setError("Failed to load assignments. Please try again.");
        }
    };

    const handleShowModal = (assignment) => {
        setSelectedAssignment(assignment);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedAssignment(null);
        setSubmissionFile(null);
        setError(null);
        setSuccess(null);
    };

    const handleFileChange = (e) => {
        setSubmissionFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!submissionFile) {
            setError("Please select a file to submit.");
            return;
        }

        try {
            const storageRef = ref(storage, `submissions/${classId}/${selectedAssignment.id}/${user.uid}/${submissionFile.name}`);
            await uploadBytes(storageRef, submissionFile);
            const fileUrl = await getDownloadURL(storageRef);

            const submissionData = {
                assignmentId: selectedAssignment.id,
                studentId: user.uid,
                fileUrl: fileUrl,
                fileName: submissionFile.name,
                submittedAt: new Date(),
                classId: classId
            };

            if (selectedAssignment.submission) {
                // Update existing submission
                await updateDoc(doc(db, "Submissions", selectedAssignment.submission.id), submissionData);
            } else {
                // Create new submission
                await addDoc(collection(db, "Submissions"), submissionData);
            }

            setSuccess("Assignment submitted successfully!");
            fetchAssignments(); // Refresh assignments to update submission status
        } catch (error) {
            console.error("Error submitting assignment:", error);
            setError("Failed to submit assignment. Please try again.");
        }
    };

    const getAssignmentStatus = (assignment) => {
        const now = new Date();
        const dueDate = new Date(assignment.dueDateTime);

        if (assignment.submission) {
            const submittedDate = new Date(assignment.submission.submittedAt.toDate());
            if (assignment.submission.grade !== undefined) {
                if (submittedDate > dueDate) {
                    return <Badge bg="warning">ให้คะแนนแล้ว(ส่งงานสาย)</Badge>;
                }
                return <Badge bg="success">ให้คะแนนแล้ว</Badge>;
            }
            if (submittedDate > dueDate) {
                return <Badge bg="warning">ส่งงานสาย</Badge>;
            }
            return <Badge bg="info">ส่งแล้ว</Badge>;
        }
        if (now > dueDate) {
            return <Badge bg="danger">เลยกำหนดส่ง</Badge>;
        }
        return <Badge bg="warning">ยังไม่ส่ง</Badge>;
    };

    const canUpdateSubmission = (assignment) => {
        return !assignment.submission || assignment.submission.grade === undefined;
    };

    const EmptyAssignmentState = () => (
        <Card className="text-center ">
            <Card.Body className="py-5">
                <FaClipboardList size={64} className="mb-3 text-primary" />
                <Card.Title>ยังไม่มีงานที่มอบหมายในห้องเรียนนี้</Card.Title>
                <Card.Text>
                    ครูผู้สอนยังไม่ได้มอบหมายงานสำหรับห้องเรียนนี้
                    <br />
                    คุณจะเห็นงานที่มอบหมายที่นี่เมื่อครูสร้างขึ้น
                </Card.Text>
            </Card.Body>
        </Card>
    );

    return (
        <Card className="shadow-sm">
            <Card.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                {assignments.length > 0 ? (
                    <ListGroup>
                        {assignments.map((assignment) => (
                            <ListGroup.Item key={assignment.id} className="d-flex justify-content-between align-items-center">
                                <div>

                                    <h6>{getAssignmentStatus(assignment)}  {assignment.title}</h6>
                                    <small>กำหนดส่ง: {new Date(assignment.dueDateTime).toLocaleString()}</small>
                                    {assignment.fileUrl && (
                                        <div>
                                            <a href={assignment.fileUrl} target="_blank" rel="noopener noreferrer">
                                                <FaDownload /> ดาวน์โหลดงาน
                                            </a>
                                        </div>
                                    )}
                                </div>
                                {canUpdateSubmission(assignment) && (
                                    <Button
                                        variant={assignment.submission ? "outline-primary" : "primary"}
                                        onClick={() => handleShowModal(assignment)}
                                    >
                                        {assignment.submission ? "อัปเดตงาน" : "ส่งงาน"}
                                    </Button>
                                )}
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                ) : (
                    <EmptyAssignmentState />
                )}
            </Card.Body>


            {/* Model */}
            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Submit Assignment: {selectedAssignment?.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Upload File</Form.Label>
                            <Form.Control
                                type="file"
                                onChange={handleFileChange}
                                required
                            />
                        </Form.Group>
                        <Button variant="primary" type="submit">
                            <FaUpload className="me-2" />
                            {selectedAssignment?.submission ? "Update Submission" : "Submit Assignment"}
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </Card>
    );
}

export default StudentAssignmentDisplay;