import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from './Header';

import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

import { Container, Row, Col, Card, ListGroup, Button, Spinner, Modal, Table } from 'react-bootstrap';
import { FaChalkboardTeacher, FaUsers, FaBook, FaClipboardList, FaKey } from 'react-icons/fa';


function ClassroomDetails() {
    const { classId } = useParams();
    const [classroom, setClassroom] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showClassCode, setShowClassCode] = useState(false);
    const [showStudents, setShowStudents] = useState(false);


    const fetchClassroomData = async () => {
        try {
            setLoading(true);

            const docRef = doc(db, 'Classrooms', classId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setClassroom(docSnap.data());
                
                const studentsQuery = query(collection(db, 'Students'), where('ClassId', '==', classId));
                const studentsSnapshot = await getDocs(studentsQuery);
                const studentList = studentsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

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

    function LoadingScreen() {
        return (
          <Container className="d-flex flex-column justify-content-center align-items-center" style={{height: '100vh'}}>
            <Spinner animation="border" variant="primary" style={{width: '3rem', height: '3rem'}} />
            <h4 className="mt-3">กำลังโหลดข้อมูล...</h4>
          </Container>
        );
      }

    useEffect(() => {
        if (classId) {
            fetchClassroomData();
        } else {
            setLoading(false); // ถ้าไม่มี classId ให้ set loading เป็น false ทันที
        }
    }, [classId]);

    if (loading) {
        return <LoadingScreen />; // ใช้คอมโพเนนต์ LoadingScreen ที่สร้างใหม่
    }

    if (!classroom) {
        return <Container className="text-center mt-5"><h2>ไม่พบห้องเรียนที่ระบุ</h2></Container>;
    } 

    return (
        <>
            <Header />
            <Container className="py-5">
                <Row>
                    <Col lg={8}>
                        <Card className="shadow-sm mb-4">
                            <Card.Body>
                                <Card.Title className="display-4 mb-4">{classroom.ClassName}</Card.Title>
                                <Card.Text className="lead">{classroom.ClassDescription}</Card.Text>
                            </Card.Body>
                        </Card>
                        
                        <Card className="shadow-sm mb-4">
                            <Card.Body>
                                <Card.Title className="h4 mb-4">ภาพรวมห้องเรียน</Card.Title>
                                <ListGroup variant="flush">
                                    <ListGroup.Item className="d-flex justify-content-between align-items-center">
                                        <div><FaUsers className="me-2" /> จำนวนนักเรียน</div>
                                        <span>{students.length} คน</span>
                                    </ListGroup.Item>
                                    <ListGroup.Item className="d-flex justify-content-between align-items-center">
                                        <div><FaBook className="me-2" /> จำนวนบทเรียน</div>
                                        <span>0 บท</span>
                                    </ListGroup.Item>
                                    <ListGroup.Item className="d-flex justify-content-between align-items-center">
                                        <div><FaClipboardList className="me-2" /> จำนวนแบบทดสอบ</div>
                                        <span>0 ชุด</span>
                                    </ListGroup.Item>
                                </ListGroup>
                            </Card.Body>
                        </Card>
                    </Col>
                    
                    <Col lg={4}>
                        <Card className="shadow-sm mb-4">
                            <Card.Body>
                                <Card.Title className="h4 mb-4">การจัดการห้องเรียน</Card.Title>
                                <ListGroup variant="flush">
                                    <ListGroup.Item action onClick={() => setShowStudents(true)}>
                                        <FaUsers className="me-2" /> จัดการรายชื่อนักเรียน
                                    </ListGroup.Item>
                                    <ListGroup.Item action href="#manage-lessons">
                                        <FaBook className="me-2" /> จัดการบทเรียน
                                    </ListGroup.Item>
                                    <ListGroup.Item action href="#manage-quizzes">
                                        <FaClipboardList className="me-2" /> จัดการแบบทดสอบ
                                    </ListGroup.Item>
                                    <ListGroup.Item action onClick={() => setShowClassCode(true)}>
                                        <FaKey className="me-2" /> แสดงรหัสห้องเรียน
                                    </ListGroup.Item>
                                </ListGroup>
                            </Card.Body>
                        </Card>
                        
                        <Button variant="primary" size="lg" className="w-100">
                            <FaChalkboardTeacher className="me-2" /> เข้าสู่ห้องเรียน
                        </Button>
                    </Col>
                </Row>
            </Container>

            <Modal show={showClassCode} onHide={() => setShowClassCode(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>รหัสห้องเรียน</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center">
                    <h2 className="display-4">{classroom.ClassId}</h2>
                    <p className="text-muted">ใช้รหัสนี้เพื่อเชิญนักเรียนเข้าร่วมห้องเรียน</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowClassCode(false)}>
                        ปิด
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showStudents} onHide={() => setShowStudents(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>รายชื่อนักเรียนในห้องเรียน</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>ชื่อ</th>
                                <th>นามสกุล</th>
                                <th>อีเมล</th>
                                <th>Username</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student, index) => (
                                <tr key={student.id}>
                                    <td>{index + 1}</td>
                                    <td>{student.FirstName}</td>
                                    <td>{student.LastName}</td>
                                    <td>{student.Email}</td>
                                    <td>{student.Username}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowStudents(false)}>
                        ปิด
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default ClassroomDetails;