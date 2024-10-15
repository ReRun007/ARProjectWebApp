import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Form, Alert, Dropdown, Spinner } from 'react-bootstrap';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { FaDownload, FaEdit, FaClipboardList, FaExclamationTriangle } from 'react-icons/fa';


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

    useEffect(() => {
        fetchAssignments();
        fetchStudentsInClass();
    }, [classId]);

    useEffect(() => {
        if (selectedAssignment) {
            fetchSubmissions(selectedAssignment.id);
        }
    }, [selectedAssignment]);

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

    const fetchStudents = async () => {
        try {
            const studentsQuery = query(collection(db, "Students"));
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
            const maxPoints = selectedAssignment.points;
            const gradeNumber = Number(grade);

            if (isNaN(gradeNumber) || gradeNumber < 0 || gradeNumber > maxPoints) {
                setError(`Please enter a valid grade between 0 and ${maxPoints}.`);
                return;
            }

            await updateDoc(doc(db, "Submissions", selectedSubmission.id), {
                grade: gradeNumber,
                feedback: feedback
            });
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

    const getSubmissionStatus = (studentId) => {
        const submission = submissions.find(s => s.studentId === studentId);
        if (submission) {
            const submittedDate = new Date(submission.submittedAt.toDate());
            const dueDate = new Date(selectedAssignment.dueDateTime);
            if (submission.grade !== undefined) {
                if (submittedDate > dueDate) {
                    return <span className="text-warning">ให้คะแนนแล้ว(ส่งงานสาย)</span>;
                }
                return <span className="text-success">ให้คะแนนแล้ว</span>;
            }
            if (submittedDate > dueDate) {
                return <span className="text-warning">ส่งงานสาย</span>;
            }
            return <span className="text-info">ส่งแล้ว</span>;
        }
        if (new Date() > new Date(selectedAssignment.dueDateTime)) {
            return <span className="text-danger">เลยกำหนดส่ง</span>;
        }
        return <span className="text-warning">ยังไม่ส่ง</span>;
    };



    if (assignments.length === 0) {
        return <EmptyAssignmentState />;
    }

    return (
        <Card className="mt-4">
            <Card.Body>
                <Card.Title>การตรวจงาน</Card.Title>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}
                <Dropdown className="mb-3">
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
                {selectedAssignment && (
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>นักเรียน</th>
                                <th>สถานะ</th>
                                <th>ไฟล์งาน</th>
                                <th>คะแนน</th>
                                <th>การดำเนินการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(students).map(([studentId, studentName]) => {
                                const submission = submissions.find(s => s.studentId === studentId);
                                return (
                                    <tr key={studentId}>
                                        <td>{studentName}</td>
                                        <td>{getSubmissionStatus(studentId)}</td>

                                        <td>
                                            {submission && (
                                                <>
                                                    <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer">
                                                        <FaDownload /> {submission.fileName}
                                                    </a>
                                                    <br />
                                                    <small>ส่งเมื่อ: {submission.submittedAt.toDate().toLocaleString()}</small>
                                                </>
                                            )}
                                        </td>
                                        <td>{submission?.grade !== undefined ? `${submission.grade}/${selectedAssignment.points}` : '-'}</td>
                                        <td>
                                            {submission && (
                                                <Button variant="primary" onClick={() => handleShowGradingModal(submission)}>
                                                    <FaEdit /> ให้คะแนน
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
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
        </Card>
    );
}

export default TeacherAssignmentGrading;