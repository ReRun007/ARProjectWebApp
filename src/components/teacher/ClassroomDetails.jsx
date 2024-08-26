import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from './Header';

import { db } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';

import { Container, Row, Col, Card, ListGroup, Button, Spinner, Modal, Table } from 'react-bootstrap';
import { FaChalkboardTeacher, FaUsers, FaBook, FaClipboardList, FaKey } from 'react-icons/fa';

import StudentListModal from './model/StudentListModal';
import ShowClassCode from './model/ShowClassCode';


function ClassroomDetails() {

    const { classId } = useParams();
    const [classroom, setClassroom] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showClassCode, setShowClassCode] = useState(false);
    const [showStudents, setShowStudents] = useState(false);
    const [alertMessage, setAlertMessage] = useState(null);



    const fetchClassroomData = async () => {
        try {
            setLoading(true);

            const docRef = doc(db, 'Classrooms', classId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setClassroom(docSnap.data());

                // ดึงข้อมูลการลงทะเบียนจาก ClassEnrollments
                const enrollmentsQuery = query(collection(db, 'ClassEnrollments'), where('classId', '==', classId));
                const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

                // สร้างอาร์เรย์ของ Promise สำหรับการดึงข้อมูลนักเรียนแต่ละคน
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

                // รอให้ทุก Promise เสร็จสิ้น
                const studentList = (await Promise.all(studentPromises)).filter(student => student !== null);

                // เรียงลำดับตามชื่อ
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
            // ลบการลงทะเบียนของนักเรียนจาก ClassEnrollments
            const enrollmentQuery = query(
                collection(db, 'ClassEnrollments'),
                where('studentId', '==', studentId),
                where('classId', '==', classId)
            );
            const enrollmentSnapshot = await getDocs(enrollmentQuery);
            if (!enrollmentSnapshot.empty) {
                const enrollmentDoc = enrollmentSnapshot.docs[0];
                await deleteDoc(enrollmentDoc.ref);

                // อัพเดตรายชื่อนักเรียนในหน้าจอ
                setStudents(prevStudents => prevStudents.filter(student => student.id !== studentId));

                // แสดงข้อความแจ้งเตือนว่านำนักเรียนออกสำเร็จ
                setAlertMessage({ type: 'success', text: 'นำนักเรียนออกจากห้องเรียนสำเร็จ' });
            } else {
                throw new Error('ไม่พบข้อมูลการลงทะเบียนของนักเรียน');
            }
        } catch (error) {
            console.error("Error removing student: ", error);
            // แสดงข้อความแจ้งเตือนว่าเกิดข้อผิดพลาด
            setAlertMessage({ type: 'danger', text: `เกิดข้อผิดพลาด: ${error.message}` });
        }
    };

    function LoadingScreen() {
        return (
            <Container className="d-flex flex-column justify-content-center align-items-center" style={{ height: '100vh' }}>
                <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
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
        </>
    );
}

export default ClassroomDetails;