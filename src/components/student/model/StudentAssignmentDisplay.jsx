import React, { useState, useEffect } from 'react';
import { Card, Button, ListGroup, Modal, Form, Alert, Badge } from 'react-bootstrap';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../firebase';
import { useUserAuth } from '../../../context/UserAuthContext';
import { FaUpload, FaDownload, FaClipboardList, FaInfoCircle, FaFile, FaEdit } from 'react-icons/fa';

function StudentAssignmentDisplay({ classId }) {
    const [assignments, setAssignments] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [submissionFile, setSubmissionFile] = useState(null);
    const [submissionText, setSubmissionText] = useState('');
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

            const assignmentsWithSubmission = await Promise.all(assignmentsData.map(async (assignment) => {
                const submissionQuery = query(
                    collection(db, "Submissions"),
                    where("assignmentId", "==", assignment.id),
                    where("studentId", "==", user.uid)
                );
                const submissionSnapshot = await getDocs(submissionQuery);
                const submission = submissionSnapshot.docs[0];
                if (submission) {
                    console.log("Submission found:", submission.id, submission.data());
                    return { 
                        ...assignment, 
                        submission: { 
                            id: submission.id, 
                            ...submission.data() 
                        } 
                    };
                }
                return assignment;
            }));

            console.log("Assignments with submissions:", assignmentsWithSubmission);
            setAssignments(assignmentsWithSubmission);
        } catch (error) {
            console.error("Error fetching assignments:", error);
            setError("Failed to load assignments. Please try again.");
        }
    };

    const handleShowModal = (assignment) => {
        setSelectedAssignment(assignment);
        setSubmissionText(assignment.submission?.submissionText || '');
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
        if (!submissionFile && !submissionText.trim()) {
            setError("กรุณาอัปโหลดไฟล์หรือเขียนข้อความเพื่อส่งงาน");
            return;
        }

        try {
            let fileUrl = '';
            let fileName = '';
            if (submissionFile) {
                const storageRef = ref(storage, `submissions/${classId}/${selectedAssignment.id}/${user.uid}/${submissionFile.name}`);
                await uploadBytes(storageRef, submissionFile);
                fileUrl = await getDownloadURL(storageRef);
                fileName = submissionFile.name;
            }

            const submissionData = {
                assignmentId: selectedAssignment.id,
                studentId: user.uid,
                fileUrl: fileUrl,
                fileName: fileName,
                submissionText: submissionText,
                submittedAt: new Date(),
                classId: classId,
                status: 'submitted'
            };

            let submissionId;
            if (selectedAssignment.submission && selectedAssignment.submission.id) {
                submissionId = selectedAssignment.submission.id;
                await updateDoc(doc(db, "Submissions", submissionId), submissionData);
            } else {
                const docRef = await addDoc(collection(db, "Submissions"), submissionData);
                submissionId = docRef.id;
            }

            console.log("Submission updated/added:", submissionId, submissionData);

            setSuccess("ส่งงานเรียบร้อยแล้ว!");
            await fetchAssignments();
            handleCloseModal();
        } catch (error) {
            console.error("Error submitting assignment:", error);
            setError("เกิดข้อผิดพลาดในการส่งงาน กรุณาลองอีกครั้ง");
        }
    };

    const getAssignmentStatus = (assignment) => {
        if (!assignment.submission) return <Badge bg="warning">ยังไม่ส่ง</Badge>;
        if (assignment.submission.status === 'returned') return <Badge bg="info">ส่งคืนเพื่อแก้ไข</Badge>;
        if (assignment.submission.grade === null) return <Badge bg="primary">รอตรวจ</Badge>;
        if (assignment.submission.grade !== undefined) return <Badge bg="success">ให้คะแนนแล้ว</Badge>;
        return <Badge bg="primary">รอตรวจ</Badge>;
    };

    const canUpdateSubmission = (assignment) => {
        return !assignment.submission ||
            assignment.submission.grade === undefined ||
            assignment.submission.status === 'returned';
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
                                                <FaDownload /> ดาวน์โหลดไฟล์งาน
                                            </a>
                                        </div>
                                    )}
                                    {assignment.submission && (
                                        <>
                                            {assignment.submission.fileName && (
                                                <div>
                                                    <small className="text-muted">
                                                        <FaFile className="me-1" />
                                                        ไฟล์ที่ส่ง: {assignment.submission.fileName}
                                                    </small>
                                                </div>
                                            )}
                                            {assignment.submission.submissionText && (
                                                <div>
                                                    <small className="text-muted">
                                                        <FaInfoCircle className="me-1" />
                                                        ข้อความเพิ่มเติม: {assignment.submission.submissionText}
                                                    </small>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                                {canUpdateSubmission(assignment) && (
                                    <Button
                                        variant={assignment.submission ? "outline-primary" : "primary"}
                                        onClick={() => handleShowModal(assignment)}
                                    >
                                        <FaEdit /> {assignment.submission ? "แก้ไขงาน" : "ส่งงาน"}
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
                    <Modal.Title>
                        {selectedAssignment?.submission ? "แก้ไขงาน" : "ส่งงาน"}: {selectedAssignment?.title}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>อัปโหลดไฟล์</Form.Label>
                            <Form.Control
                                type="file"
                                onChange={handleFileChange}
                            />
                        </Form.Group>
                        {submissionFile && (
                            <Alert variant="info">
                                <FaFile className="me-2" />
                                ไฟล์ที่เลือก: {submissionFile.name}
                            </Alert>
                        )}
                        <Form.Group className="mb-3">
                            <Form.Label>ข้อความเพิ่มเติม</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={submissionText}
                                onChange={(e) => setSubmissionText(e.target.value)}
                                placeholder="เขียนข้อความเพิ่มเติมหรือคำอธิบายงานของคุณ"
                            />
                        </Form.Group>
                        <Button variant="primary" type="submit">
                            <FaUpload className="me-2" />
                            {selectedAssignment?.submission ? "อัปเดตงาน" : "ส่งงาน"}
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </Card>
    );
}

export default StudentAssignmentDisplay;