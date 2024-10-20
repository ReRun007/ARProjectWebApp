import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Modal, Form, Alert, Dropdown, Badge, Image, InputGroup } from 'react-bootstrap';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { FaDownload, FaEdit, FaClipboardList, FaFile, FaInfoCircle, FaUndoAlt, FaEye, FaClipboardCheck, FaSearch } from 'react-icons/fa';




function TeacherAssignmentGrading({ classId }) {
    const [assignments, setAssignments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [students, setStudents] = useState({});
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [showGradingModal, setShowGradingModal] = useState(false);
    const [grade, setGrade] = useState('');
    const [feedback, setFeedback] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSubmissionModal, setShowSubmissionModal] = useState(false);
    const [selectedSubmissionFile, setSelectedSubmissionFile] = useState(null);
    const [progress, setProgress] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchAssignments();
        fetchStudentsInClass();
    }, [classId]);

    useEffect(() => {
        if (selectedAssignment) {
            fetchSubmissions(selectedAssignment.id);
        }
    }, [selectedAssignment]);

    useEffect(() => {
        if (submissions.length > 0) {
            const gradedSubmissions = submissions.filter(s => s.status === 'graded').length;
            setProgress((gradedSubmissions / submissions.length) * 100);
        }
    }, [submissions]);

    const fetchAssignments = async () => {
        try {
            const assignmentsQuery = query(collection(db, "Assignments"), where("classId", "==", classId));
            const assignmentsSnapshot = await getDocs(assignmentsQuery);
            const assignmentsData = assignmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAssignments(assignmentsData);
            if (assignmentsData.length > 0) {
                setSelectedAssignment(assignmentsData[0]);
            }
        } catch (error) {
            console.error("Error fetching assignments:", error);
            setError("Failed to load assignments. Please try again.");
        }
    };

    const fetchStudentsInClass = async () => {
        try {
            const enrollmentsQuery = query(collection(db, "ClassEnrollments"), where("classId", "==", classId));
            const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
            const studentIds = enrollmentsSnapshot.docs.map(doc => doc.data().studentId);

            if (studentIds.length === 0) {
                setStudents({});
                return;
            }

            const studentsQuery = query(collection(db, "Students"), where("__name__", "in", studentIds));
            const studentsSnapshot = await getDocs(studentsQuery);
            const studentsData = {};
            studentsSnapshot.docs.forEach(doc => {
                const student = doc.data();
                studentsData[doc.id] = `${student.FirstName} ${student.LastName}`;
            });
            setStudents(studentsData);
        } catch (error) {
            console.error("Error fetching students:", error);
            setError("Failed to load student information. Please try again.");
        }
    };


    const fetchSubmissions = async (assignmentId) => {
        try {
            const submissionsQuery = query(
                collection(db, "Submissions"),
                where("assignmentId", "==", assignmentId),
                where("classId", "==", classId)
            );
            const submissionsSnapshot = await getDocs(submissionsQuery);
            const submissionsData = submissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSubmissions(submissionsData);
        } catch (error) {
            console.error("Error fetching submissions:", error);
            setError("Failed to load submissions. Please try again.");
        }
    };

        const filteredStudents = Object.entries(students).filter(([studentId, studentName]) => {
        const submission = submissions.find(s => s.studentId === studentId);
        const matchesSearch = studentName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || 
                              (filterStatus === 'ungraded' && (!submission || submission.status !== 'graded'));
        return matchesSearch && matchesFilter;
    });




    const handleShowGradingModal = (submission) => {
        setSelectedSubmission(submission);
        setGrade(submission.grade || '');
        setFeedback(submission.feedback || '');
        setShowGradingModal(true);
    };

    const handleCloseGradingModal = () => {
        setShowGradingModal(false);
        setSelectedSubmission(null);
        setGrade('');
        setFeedback('');
        setError(null);
        setSuccess(null);
    };

    const handleGradeSubmit = async (e) => {
        e.preventDefault();
        try {
            const gradeNumber = Number(grade);

            if (isNaN(gradeNumber) || gradeNumber < 0 || gradeNumber > selectedAssignment.points) {
                setError(`Please enter a valid grade between 0 and ${selectedAssignment.points}.`);
                return;
            }

            await updateDoc(doc(db, "Submissions", selectedSubmission.id), {
                grade: gradeNumber,
                feedback: feedback,
                status: 'graded'  // อัพเดทสถานะเป็น 'graded'
            });

            console.log("Submission graded:", selectedSubmission.id, { grade: gradeNumber, feedback, status: 'graded' });

            setSuccess("Grade and feedback submitted successfully!");
            fetchSubmissions(selectedAssignment.id);
            handleCloseGradingModal();
        } catch (error) {
            console.error("Error submitting grade:", error);
            setError("Failed to submit grade. Please try again.");
        }
    };

    const EmptyAssignmentState = () => (
        <Card className="text-center border-warning">
            <Card.Body className="py-5">
                <FaClipboardList size={64} className="mb-3 text-warning" />
                <Card.Title>ยังไม่มีงานที่ต้องตรวจในห้องเรียนนี้</Card.Title>
                <Card.Text>
                    เมื่อคุณมอบหมายงานและนักเรียนส่งงาน คุณจะสามารถตรวจงานได้ที่นี่
                </Card.Text>
            </Card.Body>
        </Card>
    );

    const renderSubmissionDetails = (submission) => {
        if (!submission) return null;
        return (
            <>
                {submission.fileName && (
                    <div>
                        <FaFile className="me-2" />
                        <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer">
                            {submission.fileName}
                        </a>
                    </div>
                )}
                {submission.submissionText && (
                    <div>
                        <FaInfoCircle className="me-2" />
                        <small>{submission.submissionText}</small>
                    </div>
                )}
            </>
        );
    };

    const handleShowSubmission = (submission) => {
        setSelectedSubmissionFile(submission.fileUrl);
        setShowSubmissionModal(true);
    };

    const handleCloseSubmissionModal = () => {
        setShowSubmissionModal(false);
        setSelectedSubmissionFile(null);
    };

    const getFileExtension = (filename) => {
        const cleanFilename = filename.split('?')[0]; // ตัด query string ออก
        return cleanFilename.slice((cleanFilename.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
    };


    const renderSubmissionFile = () => {
        if (!selectedSubmissionFile) return null;

        const fileExtension = getFileExtension(selectedSubmissionFile);

        if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
            return (
                <Image src={selectedSubmissionFile} fluid />
            );
        } else if (fileExtension === 'pdf') {
            return (
                <iframe
                    src={`${selectedSubmissionFile}#toolbar=0`}
                    width="100%"
                    height="500px"
                    style={{ border: 'none' }}
                />
            );
        } else {
            return (
                <div>
                    <p>{fileExtension}</p>
                    <p>{selectedSubmissionFile}</p>
                    <p>This file type cannot be previewed.</p>
                    <a href={selectedSubmissionFile} target="_blank" rel="noopener noreferrer">
                        Download File
                    </a>
                </div>
            );
        }
    };

    const handleReturnAssignment = async (submission) => {
        try {
            await updateDoc(doc(db, "Submissions", submission.id), {
                status: 'returned',
                grade: null,
                feedback: 'งานถูกส่งคืนเพื่อแก้ไข'
            });

            console.log("Submission returned:", submission.id, { status: 'returned', grade: null, feedback: 'งานถูกส่งคืนเพื่อแก้ไข' });

            setSuccess("งานถูกส่งคืนให้นักเรียนแก้ไขแล้ว");
            fetchSubmissions(selectedAssignment.id);
        } catch (error) {
            console.error("Error returning assignment:", error);
            setError("เกิดข้อผิดพลาดในการส่งคืนงาน กรุณาลองอีกครั้ง");
        }
    };

    const getSubmissionStatus = (submission) => {
        if (!submission) {
            if (new Date() > new Date(selectedAssignment.dueDateTime)) {
                return <Badge bg="danger">เลยกำหนดส่ง</Badge>;
            }
            return <Badge bg="warning">ยังไม่ส่ง</Badge>;
        }

        const submittedDate = submission.submittedAt.toDate();
        const dueDate = new Date(selectedAssignment.dueDateTime);

        if (submission.status === 'returned') {
            return <Badge bg="info">ส่งคืนเพื่อแก้ไข</Badge>;
        }

        if (submission.status === 'graded') {
            if (submittedDate > dueDate) {
                return <Badge bg="warning">ให้คะแนนแล้ว (ส่งงานสาย)</Badge>;
            }
            return <Badge bg="success">ให้คะแนนแล้ว</Badge>;
        }

        if (submittedDate > dueDate) {
            return <Badge bg="warning">ส่งงานสาย</Badge>;
        }

        return <Badge bg="primary">ส่งแล้ว</Badge>;
    };

    const renderSubmissionCard = (studentId, studentName) => {
        const submission = submissions.find(s => s.studentId === studentId);
        return (
            <Card key={studentId} className="mb-3 shadow-sm">
                <Card.Body>
                    <Row>
                        <Col md={3}>
                            <h5>{studentName}</h5>
                            {getSubmissionStatus(submission)}
                        </Col>
                        <Col md={5}>
                            {renderSubmissionDetails(submission)}
                            {submission && (
                                <small className="d-block mt-2">
                                    ส่งเมื่อ: {submission.submittedAt.toDate().toLocaleString()}
                                </small>
                            )}
                        </Col>
                        <Col md={2} className="text-center">
                            <h6>คะแนน</h6>
                            <span className="fs-4">{submission?.grade !== undefined ? `${submission.grade}/${selectedAssignment.points}` : '-'}</span>
                        </Col>
                        <Col md={2}>
                            {submission && (
                                <div className="d-flex flex-column">
                                    <Button variant="outline-primary" size="sm" onClick={() => handleShowSubmission(submission)} className="mb-2">
                                        <FaEye /> ดูงาน
                                    </Button>
                                    <Button variant="outline-success" size="sm" onClick={() => handleShowGradingModal(submission)} className="mb-2">
                                        <FaEdit /> ให้คะแนน
                                    </Button>
                                    {(submission.grade === undefined || submission.grade === null) && (
                                        <Button variant="outline-warning" size="sm" onClick={() => handleReturnAssignment(submission)}>
                                            <FaUndoAlt /> ส่งคืน
                                        </Button>
                                    )}
                                </div>
                            )}
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        );
    };



    if (assignments.length === 0) {
        return <EmptyAssignmentState />;
    }

    return (
        <Card className="mt-4">

<Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="d-flex align-items-center">
                        <FaClipboardCheck size={30} className="text-primary me-3" />
                        <h2 className="mb-0">การตรวจงาน</h2>
                    </div>
                    <Badge bg="info" className="px-3 py-2">
                        จำนวนงานทั้งหมด: {assignments.length}
                    </Badge>
                </div>
                <hr className="my-4" />
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                <Row className="mb-4">
                    <Col md={4}>
                        <Dropdown>
                            <Dropdown.Toggle variant="primary" id="dropdown-assignment">
                                {selectedAssignment ? selectedAssignment.title : 'เลือกงานที่จะตรวจ'}
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                {assignments.map(assignment => (
                                    <Dropdown.Item key={assignment.id} onClick={() => setSelectedAssignment(assignment)}>
                                        {assignment.title}
                                    </Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        </Dropdown>
                    </Col>
                    <Col md={4}>
                        <InputGroup>
                            <InputGroup.Text>
                                <FaSearch />
                            </InputGroup.Text>
                            <Form.Control
                                type="text"
                                placeholder="ค้นหาชื่อนักเรียน..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                    </Col>
                    <Col md={4}>
                        <Dropdown>
                            <Dropdown.Toggle variant="outline-secondary" id="dropdown-filter">
                                {filterStatus === 'all' ? 'ทั้งหมด' : 'ยังไม่ตรวจ'}
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                <Dropdown.Item onClick={() => setFilterStatus('all')}>ทั้งหมด</Dropdown.Item>
                                <Dropdown.Item onClick={() => setFilterStatus('ungraded')}>ยังไม่ตรวจ</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </Col>
                </Row>

                {selectedAssignment && (
                    <Card className="mb-4 bg-light">
                        <Card.Body>
                            <h5>{selectedAssignment.title}</h5>
                            <p>{selectedAssignment.description}</p>
                            <Badge bg="info">คะแนนเต็ม: {selectedAssignment.points}</Badge>
                            <Badge bg="secondary" className="ms-2">กำหนดส่ง: {new Date(selectedAssignment.dueDateTime).toLocaleString()}</Badge>
                        </Card.Body>
                    </Card>
                )}

                {selectedAssignment && filteredStudents.map(([studentId, studentName]) => renderSubmissionCard(studentId, studentName))}
                
                {filteredStudents.length === 0 && (
                    <Alert variant="info">
                        ไม่พบนักเรียนที่ตรงกับเงื่อนไขการค้นหาหรือการกรอง
                    </Alert>
                )}
            </Card.Body>



            <Modal show={showGradingModal} onHide={handleCloseGradingModal}>
                <Modal.Header closeButton>
                    <Modal.Title>ให้คะแนนงาน</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleGradeSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>คะแนน (จากคะแนนเต็ม {selectedAssignment?.points})</Form.Label>
                            <Form.Control
                                type="number"
                                value={grade}
                                onChange={(e) => setGrade(e.target.value)}
                                required
                                min="0"
                                max={selectedAssignment?.points}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>ข้อเสนอแนะ</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                            />
                        </Form.Group>
                        <Button variant="primary" type="submit">
                            บันทึกคะแนน
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>

            <Modal show={showSubmissionModal} onHide={handleCloseSubmissionModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>ดูงานที่ส่ง</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {renderSubmissionFile()}
                </Modal.Body>
            </Modal>
        </Card>
    );
}

export default TeacherAssignmentGrading;