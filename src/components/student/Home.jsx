import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Modal, Alert, Spinner } from 'react-bootstrap';
import { useUserAuth } from '../../context/UserAuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, orderBy, limit } from 'firebase/firestore';
import Header from './Header';
import { FaBook, FaClipboardList, FaCalendarAlt, FaPlus, FaClock } from 'react-icons/fa';

import EmptyClassroomState from './EmptyClassroomState';

function StudentHome() {
    const [courses, setCourses] = useState([]);
    const [upcomingAssignments, setUpcomingAssignments] = useState([]);
    const { user } = useUserAuth();
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [classCode, setClassCode] = useState('');
    const [joinError, setJoinError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (user && user.uid) {
                try {
                    setLoading(true);
                    await Promise.all([fetchCourses(), fetchUpcomingAssignments()]);
                } catch (error) {
                    console.error("Error fetching data:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchData();
    }, [user]);

    const fetchCourses = async () => {

        const enrollmentsQuery = query(
            collection(db, "ClassEnrollments"),
            where("studentId", "==", user.uid)
        );
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
        const classIds = enrollmentsSnapshot.docs.map(doc => doc.data().classId);

        if (classIds.length > 0) {  // เพิ่มการตรวจสอบนี้
            const coursesQuery = query(
                collection(db, "Classrooms"),
                where("ClassId", "in", classIds)
            );
            const coursesSnapshot = await getDocs(coursesQuery);
            const coursesData = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCourses(coursesData);
        } else {
            setCourses([]);  // ตั้งค่าเป็นอาร์เรย์ว่างถ้าไม่มี classIds
        }
    };

    const fetchUpcomingAssignments = async () => {
        const now = new Date();
        const assignmentsQuery = query(
            collection(db, "Assignments"),
            where("dueDate", ">", now),
            orderBy("dueDate"),
            limit(5)
        );
        const assignmentsSnapshot = await getDocs(assignmentsQuery);
        const assignmentsData = assignmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUpcomingAssignments(assignmentsData);
    };

    const handleJoinClass = async () => {
        setJoinError('');
        try {
            const classQuery = query(collection(db, "Classrooms"), where("ClassId", "==", classCode));
            const classSnapshot = await getDocs(classQuery);

            if (classSnapshot.empty) {
                setJoinError('ไม่พบรหัสห้องเรียนนี้');
                return;
            }

            const classDoc = classSnapshot.docs[0];

            const enrollmentQuery = query(
                collection(db, "ClassEnrollments"),
                where("studentId", "==", user.uid),
                where("classId", "==", classDoc.id)
            );
            const enrollmentSnapshot = await getDocs(enrollmentQuery);

            if (!enrollmentSnapshot.empty) {
                setJoinError('คุณได้ลงทะเบียนในห้องเรียนนี้แล้ว');
                return;
            }

            await addDoc(collection(db, "ClassEnrollments"), {
                classId: classDoc.id,
                studentId: user.uid,
                enrollmentDate: new Date().toISOString()
            });

            setShowJoinModal(false);
            setClassCode('');
            await fetchCourses();
        } catch (error) {
            console.error("Error joining class:", error);
            setJoinError('เกิดข้อผิดพลาดในการเข้าร่วมชั้นเรียน');
        }
    };

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">กำลังโหลด...</span>
                </Spinner>
            </Container>
        );
    }

    return (
        <>
            <Header />
            <Container className="py-5">
                <h1 className="mb-4">ยินดีต้อนรับ, {user?.displayName || 'นักเรียน'}!</h1>

                <Row>
                    <Col lg={8}>
                        {/* การ์ดแสดงห้องเรียน */}
                        <Card className="mb-4 shadow-sm">
                            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                                <h2 className="mb-0">วิชาเรียนของคุณ</h2>
                                <Button variant="light" size="sm" onClick={() => setShowJoinModal(true)}>
                                    <FaPlus /> เข้าร่วมชั้นเรียน
                                </Button>
                            </Card.Header>
                            <Card.Body>
                                {courses.length > 0 ? (
                                    <Row xs={1} md={2} className="g-4">
                                        {courses.map((course) => (
                                            <Col key={course.id}>
                                                <Card className="h-100 shadow-sm">
                                                    <Card.Body>
                                                        <Card.Title>{course.ClassName}</Card.Title>
                                                        <Card.Text>{course.ClassDescription}</Card.Text>
                                                    </Card.Body>
                                                    <Card.Footer>
                                                        <Button variant="outline-primary" href={`/student/course/${course.id}`}>
                                                            เข้าสู่ห้องเรียน
                                                        </Button>
                                                    </Card.Footer>
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>
                                ) : (
                                    <EmptyClassroomState onJoinClass={() => setShowJoinModal(true)} />
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={4}>
                        <Card className="mb-4 shadow-sm">
                            <Card.Header className="bg-info text-white">
                                <h5 className="mb-0"><FaClipboardList /> งานที่กำลังจะถึงกำหนดส่ง</h5>
                            </Card.Header>
                            <Card.Body>
                                {upcomingAssignments.length > 0 ? (
                                    upcomingAssignments.map((assignment) => (
                                        <div key={assignment.id} className="mb-2">
                                            <h6>{assignment.title}</h6>
                                            <p className="text-muted mb-0">
                                                <FaClock /> กำหนดส่ง: {new Date(assignment.dueDate.toDate()).toLocaleDateString()}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted">ไม่มีงานที่กำลังจะถึงกำหนดส่ง</p>
                                )}
                            </Card.Body>
                        </Card>
                        <Card className="shadow-sm">
                            <Card.Header className="bg-success text-white">
                                <h5 className="mb-0"><FaCalendarAlt /> ปฏิทินการเรียน</h5>
                            </Card.Header>
                            <Card.Body>
                                <p>ดูกำหนดการและวันสำคัญ</p>
                                <Button variant="outline-success" className="w-100">เปิดปฏิทิน</Button>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>

            <Modal show={showJoinModal} onHide={() => setShowJoinModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>เข้าร่วมชั้นเรียน</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>รหัสห้องเรียน</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="กรอกรหัสห้องเรียน"
                                value={classCode}
                                onChange={(e) => setClassCode(e.target.value)}
                            />
                        </Form.Group>
                        {joinError && <Alert variant="danger">{joinError}</Alert>}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowJoinModal(false)}>
                        ยกเลิก
                    </Button>
                    <Button variant="primary" onClick={handleJoinClass}>
                        เข้าร่วม
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default StudentHome;