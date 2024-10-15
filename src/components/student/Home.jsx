import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Modal, Alert, Spinner, ListGroup } from 'react-bootstrap';
import { useUserAuth } from '../../context/UserAuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, orderBy } from 'firebase/firestore';
import Header from './Header';
import { FaBook, FaClipboardList, FaCalendarAlt, FaPlus, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import EmptyClassroomState from './model/EmptyClassroomState';

function StudentHome() {
    const [classrooms, setClassrooms] = useState([]);
    const [assignments, setAssignments] = useState({
        today: [],
        overdue: [],
        upcoming: []
    });
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
                    await Promise.all([fetchClassrooms(), fetchAssignments()]);
                } catch (error) {
                    console.error("Error fetching data:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchData();
    }, [user]);

    const fetchClassrooms = async () => {
        const enrollmentsQuery = query(
            collection(db, "ClassEnrollments"),
            where("studentId", "==", user.uid)
        );
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
        const classIds = enrollmentsSnapshot.docs.map(doc => doc.data().classId);

        if (classIds.length > 0) {
            const classroomsQuery = query(
                collection(db, "Classrooms"),
                where("ClassId", "in", classIds)
            );
            const classroomsSnapshot = await getDocs(classroomsQuery);
            const classroomsData = classroomsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setClassrooms(classroomsData);
        } else {
            setClassrooms([]);
        }
    };

    const fetchAssignments = async () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Set to start of day
        const assignmentsQuery = query(
            collection(db, "Assignments"),
            orderBy("dueDateTime")
        );
        const assignmentsSnapshot = await getDocs(assignmentsQuery);
        const assignmentsData = assignmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
        // ดึงข้อมูลการส่งงานของผู้ใช้
        const submissionsQuery = query(
            collection(db, "Submissions"),
            where("studentId", "==", user.uid)
        );
        const submissionsSnapshot = await getDocs(submissionsQuery);
        const submittedAssignments = submissionsSnapshot.docs.map(doc => doc.data().assignmentId);
    
        const grouped = {
            today: [],
            overdue: [],
            upcoming: []
        };
    
        // ดึง classIds ที่นักเรียนลงทะเบียนอยู่
        const classIds = classrooms.map(classroom => classroom.id);
    
        assignmentsData.forEach(assignment => {
            const dueDate = new Date(assignment.dueDateTime);
    
            // ตรวจสอบว่างานนี้ถูกส่งแล้วหรือไม่
            const isSubmitted = submittedAssignments.includes(assignment.id);
            
            // ตรวจสอบว่า assignment นี้อยู่ใน classIds หรือไม่
            const isInClassroom = classIds.includes(assignment.classId); // ตรวจสอบว่า classId ของ assignment ตรงกับ classId ที่นักเรียนมี
    
            // ถ้างานถูกส่งแล้ว หรือไม่อยู่ในห้องเรียนที่นักเรียนมี ให้ข้ามไปไม่เพิ่มเข้าในรายการ
            if (!isSubmitted && isInClassroom) {
                if (dueDate.toDateString() === now.toDateString()) {
                    grouped.today.push(assignment);
                } else if (dueDate < now) {
                    grouped.overdue.push(assignment);
                } else {
                    grouped.upcoming.push(assignment);
                }
            }
        });
    
        setAssignments(grouped);
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
            await fetchClassrooms();
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

    const renderAssignmentList = (assignmentList, icon, title) => (
        <Card className="mb-3">
            <Card.Header className="bg-light">
                <h6 className="mb-0"><FaClipboardList className="me-2" />{title}</h6>
            </Card.Header>
            <ListGroup variant="flush">
                {assignmentList.map((assignment) => (
                    <ListGroup.Item key={assignment.id} className="d-flex justify-content-between align-items-center">
                        <div>
                            <div>{assignment.title}</div>
                            <small className="text-muted">
                                <FaClock className="me-1" />
                                กำหนดส่ง: {new Date(assignment.dueDateTime).toLocaleString()}
                            </small>
                        </div>
                        {icon}
                    </ListGroup.Item>
                ))}
                {assignmentList.length === 0 && (
                    <ListGroup.Item className="text-muted">ไม่มีงาน</ListGroup.Item>
                )}
            </ListGroup>
        </Card>
    );

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
                                {classrooms.length > 0 ? (
                                    <Row xs={1} md={2} className="g-4">
                                        {classrooms.map((classroom) => (
                                            <Col key={classroom.id}>
                                                <Card className="h-100 shadow-sm">
                                                    <Card.Body>
                                                        <Card.Title>{classroom.ClassName}</Card.Title>
                                                        <Card.Text>{classroom.ClassDescription}</Card.Text>
                                                    </Card.Body>
                                                    <Card.Footer>
                                                        <Button variant="outline-primary" as={Link} to={`/student/classroom/${classroom.id}`}>
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
                                <h5 className="mb-0"><FaClipboardList /> งานที่ได้รับมอบหมาย</h5>
                            </Card.Header>
                            <Card.Body>
                                {renderAssignmentList(assignments.today, <FaClock className="text-warning" />, "ส่งวันนี้")}
                                {renderAssignmentList(assignments.overdue, <FaExclamationTriangle className="text-danger" />, "เลยกำหนดส่ง")}
                                {renderAssignmentList(assignments.upcoming, <FaCalendarAlt className="text-info" />, "กำหนดส่งในอนาคต")}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>

            {/* Modal สำหรับเข้าร่วมชั้นเรียน */}
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