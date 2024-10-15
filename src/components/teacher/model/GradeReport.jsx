import React, { useState, useEffect } from 'react';
import { Card, Table, Alert, Spinner, Button, ButtonGroup, Form, Row, Col, ProgressBar } from 'react-bootstrap';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { FaSearch, FaSortAmountDown, FaSortAmountUp, FaTrash } from 'react-icons/fa';

function GradeReport({ classId }) {
    const [students, setStudents] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [grades, setGrades] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quizzes, setQuizzes] = useState([]);
    const [quizResults, setQuizResults] = useState({});
    const [deletingQuizResult, setDeletingQuizResult] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });


    useEffect(() => {
        fetchData();
    }, [classId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [studentsData, assignmentsData, gradesData, quizzesData] = await Promise.all([
                fetchStudents(),
                fetchAssignments(),
                fetchGrades(),
                fetchQuizzes()
            ]);
            setStudents(studentsData);
            setAssignments(assignmentsData);
            setGrades(gradesData);
            setQuizzes(quizzesData);

            // Fetch quiz results after we have the quizzes
            const quizResultsData = await fetchQuizResults(quizzesData.map(q => q.id));
            setQuizResults(quizResultsData);

            setLoading(false);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load grade report. Please try again.");
            setLoading(false);
        }
    };

    const fetchQuizzes = async () => {
        const quizzesQuery = query(collection(db, "Quizzes"), where("classId", "==", classId));
        const quizzesSnapshot = await getDocs(quizzesQuery);
        return quizzesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            totalQuestions: doc.data().questions.length // เพิ่มจำนวนคำถามทั้งหมด
        }));
    };

    const fetchQuizResults = async (quizIds) => {
        if (!quizIds || quizIds.length === 0) return {};
        const quizResultsQuery = query(collection(db, "QuizResults"), where("quizId", "in", quizIds));
        const quizResultsSnapshot = await getDocs(quizResultsQuery);
        const quizResultsData = {};
        quizResultsSnapshot.docs.forEach(doc => {
            const result = doc.data();
            if (!quizResultsData[result.userId]) {
                quizResultsData[result.userId] = {};
            }
            quizResultsData[result.userId][result.quizId] = result.score;
        });
        return quizResultsData;
    };

    const fetchStudents = async () => {
        const enrollmentsQuery = query(collection(db, "ClassEnrollments"), where("classId", "==", classId));
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
        const studentIds = enrollmentsSnapshot.docs.map(doc => doc.data().studentId);

        const studentsQuery = query(collection(db, "Students"), where("__name__", "in", studentIds));
        const studentsSnapshot = await getDocs(studentsQuery);
        return studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    const fetchAssignments = async () => {
        const assignmentsQuery = query(collection(db, "Assignments"), where("classId", "==", classId));
        const assignmentsSnapshot = await getDocs(assignmentsQuery);
        return assignmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    const fetchGrades = async () => {
        const submissionsQuery = query(collection(db, "Submissions"), where("classId", "==", classId));
        const submissionsSnapshot = await getDocs(submissionsQuery);
        const gradesData = {};
        submissionsSnapshot.docs.forEach(doc => {
            const submission = doc.data();
            if (!gradesData[submission.studentId]) {
                gradesData[submission.studentId] = {};
            }
            gradesData[submission.studentId][submission.assignmentId] = submission.grade;
        });
        return gradesData;
    };

    const filteredStudents = students.filter(student =>
        `${student.FirstName} ${student.LastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );



    const handleSort = () => {
        setSortConfig(prevConfig => ({
            key: 'totalScore',
            direction: prevConfig.direction === 'ascending' ? 'descending' : 'ascending'
        }));
    };

    const calculateTotalScore = (studentId) => {
        const assignmentScore = assignments.reduce((total, assignment) => {
            return total + (grades[studentId]?.[assignment.id] || 0);
        }, 0);

        const quizScore = quizzes.reduce((total, quiz) => {
            return total + (quizResults[studentId]?.[quiz.id] || 0);
        }, 0);

        return assignmentScore + quizScore;
    };

    const sortedStudents = [...filteredStudents].sort((a, b) => {
        if (!sortConfig.key) return 0;
        const aValue = calculateTotalScore(a.id);
        const bValue = calculateTotalScore(b.id);
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
    });

    const calculateMaxScore = () => {
        const maxAssignmentScore = assignments.reduce((total, assignment) => total + Number(assignment.points), 0);
        const maxQuizScore = quizzes.reduce((total, quiz) => total + quiz.totalQuestions, 0);
        return maxAssignmentScore + maxQuizScore;
    };

    const deleteQuizResult = async (studentId, quizId) => {
        try {
            const quizResultRef = doc(db, "QuizResults", `${quizId}_${studentId}`);
            await deleteDoc(quizResultRef);

            // อัปเดต state หลังจากลบข้อมูล
            setQuizResults(prevResults => {
                const newResults = { ...prevResults };
                if (newResults[studentId]) {
                    delete newResults[studentId][quizId];
                }
                return newResults;
            });

            // แสดงข้อความแจ้งเตือนว่าลบสำเร็จ
            alert("ลบผลการทดสอบสำเร็จ นักเรียนสามารถทำแบบทดสอบใหม่ได้");
        } catch (error) {
            console.error("Error deleting quiz result:", error);
            alert("เกิดข้อผิดพลาดในการลบผลการทดสอบ");
        }
    };

    if (loading) {
        return (
            <div className="text-center mt-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">กำลังโหลดข้อมูล...</p>
            </div>
        );
    }

    if (error) {
        return <Alert variant="danger">{error}</Alert>;
    }

    return (
        <Card className="shadow-sm">
            <Card.Body>
                <Card.Title className="mb-4">รายงานคะแนน</Card.Title>
                <Row className="mb-3">
                    <Col md={6}>
                        <Form.Group>
                            <Form.Control
                                type="text"
                                placeholder="ค้นหาชื่อนักเรียน..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={6} className="text-md-end">
                        <Button variant="outline-primary" onClick={handleSort}>
                            {sortConfig.direction === 'ascending' ? <FaSortAmountUp /> : <FaSortAmountDown />} เรียงตามคะแนนรวม
                        </Button>
                    </Col>
                </Row>
                <div className="table-responsive">
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>ชื่อ-นามสกุล</th>
                                {assignments.map(assignment => (
                                    <th key={assignment.id}>{assignment.title} ({assignment.points})</th>
                                ))}
                                {quizzes.map(quiz => (
                                    <th key={quiz.id}>{quiz.title} ({quiz.totalQuestions})</th>
                                ))}
                                <th>คะแนนรวม</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedStudents.map(student => (
                                <tr key={student.id}>
                                    <td>{student.FirstName} {student.LastName}</td>
                                    {assignments.map(assignment => (
                                        <td key={assignment.id}>
                                            {grades[student.id]?.[assignment.id] || '-'}
                                        </td>
                                    ))}
                                    {quizzes.map(quiz => (
                                        <td key={quiz.id}>
                                            {quizResults[student.id]?.[quiz.id] !== undefined ? (
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span>{quizResults[student.id][quiz.id]}</span>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => deleteQuizResult(student.id, quiz.id)}
                                                    >
                                                        <FaTrash />
                                                    </Button>
                                                </div>
                                            ) : '-'}
                                        </td>
                                    ))}
                                    <td>
                                        <strong>{calculateTotalScore(student.id)}</strong> / {calculateMaxScore()}
                                        <ProgressBar 
                                            now={(calculateTotalScore(student.id) / calculateMaxScore()) * 100} 
                                            label={`${((calculateTotalScore(student.id) / calculateMaxScore()) * 100).toFixed(0)}%`}
                                            variant="info"
                                            className="mt-1"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
                {sortedStudents.length === 0 && (
                    <Alert variant="info">ไม่พบข้อมูลนักเรียนที่ตรงกับการค้นหา</Alert>
                )}
            </Card.Body>
        </Card>
    );
}

export default GradeReport;