import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import { Button, Container, Row, Col, Card, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import { doc, getDoc, collection, setDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import Header from './Header';
import EmptyClassroomState from './EmptyClassroomState';
import { FaChalkboardTeacher, FaPlus, FaUsers, FaTasks } from 'react-icons/fa';

function Home() {
    const { user } = useUserAuth();
    const navigate = useNavigate();
    const [teacherInfo, setTeacherInfo] = useState(null);
    const [classrooms, setClassrooms] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [className, setClassName] = useState('');
    const [classDescription, setClassDescription] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await fetchUserData();
            await fetchClassrooms();
            setTimeout(() => {
                setLoading(false);
            }, 1000);
        };

        loadData();
    }, [user]);

    const fetchClassrooms = async () => {
        if (user && user.uid) {
            try {
                const q = query(
                    collection(db, 'Classrooms'),
                    where('TeachersID', '==', `/Teachers/${user.uid}`),
                    orderBy('ClassName', 'asc')
                );
                const querySnapshot = await getDocs(q);
                const classroomsData = await Promise.all(
                    querySnapshot.docs.map(async (doc) => {
                        const classroom = doc.data();
                        const enrollmentsQuery = query(
                            collection(db, 'ClassEnrollments'),
                            where('classId', '==', classroom.ClassId)
                        );
                        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
                        const studentCount = enrollmentsSnapshot.size;

                        const assignmentsQuery = query(
                            collection(db, 'Assignments'),
                            where('classId', '==', classroom.ClassId)
                        );
                        const assignmentsSnapshot = await getDocs(assignmentsQuery);
                        const assignmentCount = assignmentsSnapshot.size;

                        return { ...classroom, studentCount, assignmentCount };
                    })
                );
                setClassrooms(classroomsData);
            } catch (error) {
                console.error("Error fetching classrooms: ", error);
            }
        }
    };

    const fetchUserData = async () => {
        if (user && user.uid) {
            try {
                const docRef = doc(db, "Teachers", user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setTeacherInfo(docSnap.data());
                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.error("Error fetching teacher data: ", error);
            }
        }
    }

    const generateClassId = async () => {
        let classId;
        let isUnique = false;
        while (!isUnique) {
            classId = `${Math.random().toString(36).substring(2, 5).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;
            const q = query(collection(db, 'Classrooms'), where('ClassId', '==', classId));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                isUnique = true;
            }
        }
        return classId;
    };

    const handleAddClassroom = async (e) => {
        e.preventDefault();
        const classId = await generateClassId();

        try {
            const docRef = doc(db, 'Classrooms', classId);
            await setDoc(docRef, {
                ClassId: classId,
                ClassName: className,
                ClassDescription: classDescription,
                TeachersID: `/Teachers/${user.uid}`
            });
            setShowModal(false);
            setClassName('');
            setClassDescription('');
            fetchClassrooms();
        } catch (err) {
            console.error("Error adding classroom: ", err);
        }
    };

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center vh-100">
                <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </Container>
        );
    }

    return (
        <>
            <Header />
            <Container className="py-5">
                <h1 className="text-center mb-5">ยินดีต้อนรับ, {teacherInfo?.Username || 'คุณครู'}!</h1>

                <Row className="mb-4 align-items-center">
                    <Col>
                        <h2 className="m-0">ห้องเรียนของฉัน</h2>
                    </Col>
                    <Col xs="auto">
                        <Button variant="primary" size="lg" className="rounded-pill" onClick={() => setShowModal(true)}>
                            <FaPlus className="me-2" /> เพิ่มห้องเรียน
                        </Button>
                    </Col>
                </Row>

                {classrooms.length > 0 ? (
                    <Row xs={1} md={2} lg={3} xl={4} className="g-4">
                        {classrooms.map((classroom) => (
                            <Col key={classroom.ClassId}>
                                <Card className="h-100 shadow-sm">
                                    <Card.Body className="d-flex flex-column">
                                        <div className="text-center mb-3">
                                            <FaChalkboardTeacher size={50} className="text-primary" />
                                        </div>
                                        <Card.Title className="text-center">{classroom.ClassName}</Card.Title>
                                        <Card.Text className="text-muted text-center">
                                            {classroom.ClassDescription || 'ไม่มีรายละเอียด'}<br />
                                            <FaUsers className="me-1" /> จำนวนนักเรียน: {classroom.studentCount} คน<br />
                                            <FaTasks className="me-1" /> จำนวนงาน: {classroom.assignmentCount} งาน
                                        </Card.Text>
                                        <Button
                                            variant="outline-primary"
                                            className="mt-auto"
                                            onClick={() => navigate(`/teacher/classroom/${classroom.ClassId}`)}
                                        >
                                            เข้าสู่ห้องเรียน
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <EmptyClassroomState onAddClassroom={() => setShowModal(true)} />
                )}

                <Modal show={showModal} onHide={() => setShowModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>เพิ่มห้องเรียนใหม่</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form onSubmit={handleAddClassroom}>
                            <Form.Group className="mb-3">
                                <Form.Label>ชื่อห้องเรียน</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="กรอกชื่อห้องเรียน"
                                    value={className}
                                    onChange={(e) => setClassName(e.target.value)}
                                    required
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>รายละเอียดห้องเรียน</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    placeholder="กรอกรายละเอียดห้องเรียน"
                                    value={classDescription}
                                    onChange={(e) => setClassDescription(e.target.value)}
                                />
                            </Form.Group>
                            <Button variant="primary" type="submit">
                                บันทึก
                            </Button>
                        </Form>
                    </Modal.Body>
                </Modal>
            </Container>
        </>
    );
}

export default Home;