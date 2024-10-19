import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from './Header';
import { useUserAuth } from '../../context/UserAuthContext';
import { db, storage } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs, deleteDoc, orderBy, updateDoc } from 'firebase/firestore';
import { Container, Row, Col, Card, ListGroup, Button, Spinner, Modal, Alert, Badge, Nav, Form } from 'react-bootstrap';
import { FaChalkboardTeacher, FaUsers, FaBook, FaClipboardList, FaKey, FaTasks, FaGraduationCap, FaCalendarCheck, FaEdit } from 'react-icons/fa';

import PostManagement from './model/PostManagement';
import StudentListModal from './model/StudentListModal';
import ShowClassCode from './model/ShowClassCode';
import LessonDisplay from './model/LessonDisplay';
import QuizDisplay from './model/QuizDisplay';
import AssignmentManagement from './AssignmentManagement';
import TeacherAssignmentGrading from './model/TeacherAssignmentGrading';
import GradeReport from './model/GradeReport';
import AttendanceReport from './AttendanceReport';



function ClassroomDetails() {
    const { classId } = useParams();
    const [classroom, setClassroom] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showClassCode, setShowClassCode] = useState(false);
    const [showStudents, setShowStudents] = useState(false);
    const [alertMessage, setAlertMessage] = useState(null);
    const [lessonCount, setLessonCount] = useState(0);
    const [quizCount, setQuizCount] = useState(0);
    const [assignmentCount, setAssignmentCount] = useState(0);
    const { user } = useUserAuth();
    const [showGradeReport, setShowGradeReport] = useState(false);
    const [activeTab, setActiveTab] = useState('posts');
    const [posts, setPosts] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editedClassroom, setEditedClassroom] = useState({ ClassName: '', ClassDescription: '' });




    const fetchPosts = async () => {
        try {
            const postsQuery = query(
                collection(db, 'Posts'),
                where('classId', '==', classId),
                orderBy('createdAt', 'desc')
            );
            const postsSnapshot = await getDocs(postsQuery);
            const postsData = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log("Fetched posts:", postsData);
            setPosts(postsData);
        } catch (error) {
            console.error("Error fetching posts: ", error);
            setAlertMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการโหลดโพสต์ กรุณาลองใหม่อีกครั้ง' });
        }
    };




    const fetchClassroomData = async () => {
        try {
            setLoading(true);

            const docRef = doc(db, 'Classrooms', classId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setClassroom(docSnap.data());

                const enrollmentsQuery = query(collection(db, 'ClassEnrollments'), where('classId', '==', classId));
                const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

                const studentPromises = enrollmentsSnapshot.docs.map(async (enrollDoc) => {
                    const studentRef = doc(db, 'Students', enrollDoc.data().studentId);
                    const studentSnap = await getDoc(studentRef);
                    if (studentSnap.exists()) {
                        return {
                            id: studentSnap.id,
                            ...studentSnap.data(),
                            enrollmentDate: enrollDoc.data().enrollmentDate
                        };
                    }
                    return null;
                });

                const studentList = (await Promise.all(studentPromises)).filter(student => student !== null);
                studentList.sort((a, b) => a.FirstName.localeCompare(b.FirstName));

                setStudents(studentList);
            } else {
                console.log("No such classroom!");
            }
        } catch (error) {
            console.error("Error fetching classroom data: ", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveStudent = async (studentId) => {
        try {
            const enrollmentQuery = query(
                collection(db, 'ClassEnrollments'),
                where('studentId', '==', studentId),
                where('classId', '==', classId)
            );
            const enrollmentSnapshot = await getDocs(enrollmentQuery);
            if (!enrollmentSnapshot.empty) {
                const enrollmentDoc = enrollmentSnapshot.docs[0];
                await deleteDoc(enrollmentDoc.ref);

                setStudents(prevStudents => prevStudents.filter(student => student.id !== studentId));
                setAlertMessage({ type: 'success', text: 'นำนักเรียนออกจากห้องเรียนสำเร็จ' });
            } else {
                throw new Error('ไม่พบข้อมูลการลงทะเบียนของนักเรียน');
            }
        } catch (error) {
            console.error("Error removing student: ", error);
            setAlertMessage({ type: 'danger', text: `เกิดข้อผิดพลาด: ${error.message}` });
        }
    };

    const checkLessons = async () => {
        try {
            const q = query(collection(db, "Lessons"), where("classId", "==", classId));
            const querySnapshot = await getDocs(q);
            setLessonCount(querySnapshot.size);
        } catch (error) {
            console.error("Error checking lessons:", error);
            setAlertMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการตรวจสอบบทเรียน' });
        }
    };

    const checkQuizzes = async () => {
        try {
            const q = query(collection(db, "Quizzes"), where("classId", "==", classId));
            const querySnapshot = await getDocs(q);
            setQuizCount(querySnapshot.size);
        } catch (error) {
            console.error("Error checking quizzes:", error);
            setAlertMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการตรวจสอบแบบทดสอบ' });
        }
    };

    const checkAssignments = async () => {
        try {
            const q = query(collection(db, "Assignments"), where("classId", "==", classId));
            const querySnapshot = await getDocs(q);
            setAssignmentCount(querySnapshot.size);
        } catch (error) {
            console.error("Error checking assignments:", error);
            setAlertMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการตรวจสอบงานที่มอบหมาย' });
        }
    };

    const handleShowEditModal = () => {
        setEditedClassroom({
            ClassName: classroom.ClassName,
            ClassDescription: classroom.ClassDescription
        });
        setShowEditModal(true);
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditedClassroom(prev => ({ ...prev, [name]: value }));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const classroomRef = doc(db, 'Classrooms', classId);
            await updateDoc(classroomRef, {
                ClassName: editedClassroom.ClassName,
                ClassDescription: editedClassroom.ClassDescription
            });
            setClassroom(prev => ({
                ...prev,
                ClassName: editedClassroom.ClassName,
                ClassDescription: editedClassroom.ClassDescription
            }));
            setShowEditModal(false);
            setAlertMessage({ type: 'success', text: 'อัปเดตข้อมูลห้องเรียนสำเร็จ' });
        } catch (error) {
            console.error("Error updating classroom:", error);
            setAlertMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลห้องเรียน' });
        }
    };

    useEffect(() => {
        const loadData = async () => {
            if (classId) {
                try {
                    setLoading(true);
                    await fetchClassroomData();
                    await fetchPosts();
                    await checkLessons();
                    await checkQuizzes();
                    await checkAssignments();
                } catch (error) {
                    console.error("Error loading data: ", error);
                    setAlertMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณารีเฟรชหน้าเว็บ' });
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        loadData();
    }, [classId]);

    if (loading) {
        return (
            <Container className="d-flex flex-column justify-content-center align-items-center" style={{ height: '100vh' }}>
                <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
                <h4 className="mt-3">กำลังโหลดข้อมูล...</h4>
            </Container>
        );
    }

    if (!classroom) {
        return <Container className="text-center mt-5"><h2>ไม่พบห้องเรียนที่ระบุ</h2></Container>;
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'posts':
                return <PostManagement classId={classId} />;
            case 'lessons':
                return <LessonDisplay classId={classId} />;
            case 'quizzes':
                return <QuizDisplay classId={classId} />;
            case 'assignments':
                return <AssignmentManagement classId={classId} />;
            case 'grading':
                return <TeacherAssignmentGrading classId={classId} />;
            case 'attendance':
                return <AttendanceReport classId={classId} />;
            default:
                return <div>เลือกเมนูเพื่อดูเนื้อหา</div>;
        }
    };


    return (
        <>
            <Header />
            <Container fluid className="py-4">
                <Row className="justify-content-center">
                    <Col lg={10} xl={8}>
                        {alertMessage && (
                            <Alert variant={alertMessage.type} onClose={() => setAlertMessage(null)} dismissible className="mb-4">
                                {alertMessage.text}
                            </Alert>
                        )}
                        <Card className="shadow-sm mb-4">
                            <Card.Body>
                                <Card.Title className="display-4 mb-2">{classroom.ClassName}</Card.Title>
                                <Card.Subtitle className="mb-4 text-muted">{classroom.ClassId}</Card.Subtitle>
                                <Card.Text>{classroom.ClassDescription}</Card.Text>
                            </Card.Body>
                        </Card>
                        <Row>
                            <Col lg={3}>
                                <Card className="shadow-sm mb-4">
                                    <Card.Body>
                                        <Nav variant="pills" className="flex-column" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                                            <Nav.Item>
                                                <Nav.Link eventKey="posts"><FaChalkboardTeacher className="me-2" />โพสต์</Nav.Link>
                                            </Nav.Item>
                                            <Nav.Item>
                                                <Nav.Link eventKey="lessons"><FaBook className="me-2" />บทเรียน</Nav.Link>
                                            </Nav.Item>
                                            <Nav.Item>
                                                <Nav.Link eventKey="quizzes"><FaClipboardList className="me-2" />แบบทดสอบ</Nav.Link>
                                            </Nav.Item>
                                            <Nav.Item>
                                                <Nav.Link eventKey="assignments"><FaTasks className="me-2" />งานที่มอบหมาย</Nav.Link>
                                            </Nav.Item>
                                            <Nav.Item>
                                                <Nav.Link eventKey="grading"><FaGraduationCap className="me-2" />ให้คะแนน</Nav.Link>
                                            </Nav.Item>
                                            <Nav.Item>
                                                <Nav.Link eventKey="attendance"><FaCalendarCheck className="me-2" />รายงานการเข้าเรียน</Nav.Link>
                                            </Nav.Item>
                                        </Nav>
                                    </Card.Body>
                                </Card>
                                <Card className="shadow-sm mb-4">
                                    <Card.Body>
                                        <Card.Title className="h5 mb-3">การจัดการห้องเรียน</Card.Title>
                                        <ListGroup variant="flush">

                                            <ListGroup.Item action onClick={handleShowEditModal}>
                                                <FaEdit className="me-2" /> แก้ไขห้องเรียน
                                            </ListGroup.Item>
                                            <ListGroup.Item action onClick={() => setShowStudents(true)} className="d-flex justify-content-between align-items-center">
                                                <span><FaUsers className="me-2" /> จัดการรายชื่อนักเรียน</span>
                                                <Badge bg="primary" pill>{students.length}</Badge>
                                            </ListGroup.Item>
                                            <ListGroup.Item action onClick={() => setShowClassCode(true)}>
                                                <FaKey className="me-2" /> แสดงรหัสห้องเรียน
                                            </ListGroup.Item>
                                            <ListGroup.Item action onClick={() => setShowGradeReport(true)}>
                                                <FaClipboardList className="me-2" /> แสดงรายงานคะแนน
                                            </ListGroup.Item>
                                        </ListGroup>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col lg={9}>
                                <Card className="shadow-sm mb-4">
                                    <Card.Body>
                                        {renderContent()}
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Container>

            <ShowClassCode
                show={showClassCode}
                onHide={() => setShowClassCode(false)}
                classId={classroom.ClassId}
            />

            <StudentListModal
                show={showStudents}
                onHide={() => setShowStudents(false)}
                students={students}
                onRemoveStudent={handleRemoveStudent}
            />

            <Modal show={showGradeReport} onHide={() => setShowGradeReport(false)} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>รายงานคะแนน</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <GradeReport classId={classId} />
                </Modal.Body>
            </Modal>

            <Modal show={showEditModal} onHide={handleCloseEditModal}>
                <Modal.Header closeButton>
                    <Modal.Title>แก้ไขข้อมูลห้องเรียน</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleEditSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>ชื่อห้องเรียน</Form.Label>
                            <Form.Control
                                type="text"
                                name="ClassName"
                                value={editedClassroom.ClassName}
                                onChange={handleEditInputChange}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>รายละเอียดห้องเรียน</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="ClassDescription"
                                value={editedClassroom.ClassDescription}
                                onChange={handleEditInputChange}
                            />
                        </Form.Group>
                        <Button variant="primary" type="submit">
                            บันทึกการเปลี่ยนแปลง
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>

        </>
    );
}

export default ClassroomDetails;