import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from './Header';

import { db, storage } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs, deleteDoc, addDoc, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';


import { Container, Row, Col, Card, ListGroup, Button, Spinner, Modal, Form, Alert,Badge,Tabs, Tab  } from 'react-bootstrap';
import { FaChalkboardTeacher, FaUsers, FaBook, FaClipboardList, FaKey, FaFile, FaImage, FaPlusCircle } from 'react-icons/fa';

import StudentListModal from './model/StudentListModal';
import ShowClassCode from './model/ShowClassCode';
import PostDisplay from './model/PostDisplay';


import { useUserAuth } from '../../context/UserAuthContext';



function ClassroomDetails() {

    const { classId } = useParams();
    const [classroom, setClassroom] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showClassCode, setShowClassCode] = useState(false);
    const [showStudents, setShowStudents] = useState(false);
    const [alertMessage, setAlertMessage] = useState(null);
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState('');
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const { user } = useUserAuth();


    // ส่วนเพิ่มโพส
    const fetchPosts = async () => {
        try {
            const postsQuery = query(
                collection(db, 'Posts'),
                where('classId', '==', classId),
                orderBy('createdAt', 'desc')
            );
            const postsSnapshot = await getDocs(postsQuery);
            const postsData = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log("Fetched posts:", postsData); // เพิ่ม log นี้
            setPosts(postsData);
        } catch (error) {
            console.error("Error fetching posts: ", error);
            setAlertMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการโหลดโพสต์ กรุณาลองใหม่อีกครั้ง' });
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
            // สร้าง URL สำหรับแสดงตัวอย่างรูปภาพ
            if (e.target.files[0].type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviewUrl(reader.result);
                };
                reader.readAsDataURL(e.target.files[0]);
            } else {
                setPreviewUrl(null);
            }
        } else {
            setFile(null);
            setPreviewUrl(null);
        }
    };

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        if (newPost.trim() === '') return;

        try {
            let fileUrl = '';
            let fileName = '';
            if (file) {
                const storageRef = ref(storage, `User/${user.email}/Post/${file.name}`);
                await uploadBytes(storageRef, file);
                fileUrl = await getDownloadURL(storageRef);
                fileName = file.name;
            }

            const postData = {
                content: newPost,
                classId: classId,
                createdAt: serverTimestamp(),
                createdBy: user.uid,
                fileUrl,
                fileName
            };

            await addDoc(collection(db, 'Posts'), postData);
            setNewPost('');
            setFile(null);
            setPreviewUrl(null);
            fetchPosts();
            setAlertMessage({ type: 'success', text: 'โพสต์สำเร็จ!' });
        } catch (error) {
            console.error("Error posting: ", error);
            setAlertMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการโพสต์ กรุณาลองอีกครั้ง' });
        }
    };

    // คิวรี่ห้องเรียน
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
        const loadData = async () => {
            if (classId) {
                try {
                    setLoading(true);
                    await fetchClassroomData();
                    await fetchPosts();
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
        return <LoadingScreen />; // ใช้คอมโพเนนต์ LoadingScreen ที่สร้างใหม่
    }

    if (!classroom) {
        return <Container className="text-center mt-5"><h2>ไม่พบห้องเรียนที่ระบุ</h2></Container>;
    }

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
                        <Row>
                            <Col lg={8}>
                                <Card className="shadow-sm mb-4">
                                    <Card.Body>
                                        <Card.Title className="display-4 mb-2">{classroom.ClassName}</Card.Title>
                                        <Card.Subtitle className="mb-4 text-muted">{classroom.ClassId}</Card.Subtitle>
                                        <Card.Text>{classroom.ClassDescription}</Card.Text>
                                    </Card.Body>
                                </Card>

                                <Tabs defaultActiveKey="posts" id="classroom-tabs" className="mb-4">
                                    <Tab eventKey="posts" title="โพสต์">
                                        <Card className="shadow-sm mb-4">
                                            <Card.Body>
                                                <Card.Title>สร้างโพสต์ใหม่</Card.Title>
                                                <Form onSubmit={handlePostSubmit}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Control
                                                            as="textarea"
                                                            rows={3}
                                                            value={newPost}
                                                            onChange={(e) => setNewPost(e.target.value)}
                                                            placeholder="เขียนโพสต์ของคุณที่นี่..."
                                                        />
                                                    </Form.Group>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>
                                                            <FaPlusCircle className="me-2" />
                                                            เพิ่มไฟล์แนบ
                                                        </Form.Label>
                                                        <Form.Control type="file" onChange={handleFileChange} />
                                                    </Form.Group>
                                                    {previewUrl && (
                                                        <div className="mb-3">
                                                            <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px' }} className="rounded" />
                                                        </div>
                                                    )}
                                                    <Button variant="primary" type="submit">
                                                        <FaImage className="me-2" /> โพสต์
                                                    </Button>
                                                </Form>
                                            </Card.Body>
                                        </Card>

                                        <PostDisplay posts={posts} />
                                    </Tab>
                                    <Tab eventKey="lessons" title="บทเรียน">
                                        <Card className="shadow-sm mb-4">
                                            <Card.Body className="text-center py-5">
                                                <FaBook className="mb-3 text-primary" size={50} />
                                                <Card.Title>ยังไม่มีบทเรียนในห้องเรียนนี้</Card.Title>
                                                <Card.Text>เริ่มสร้างบทเรียนแรกของคุณเพื่อแบ่งปันความรู้กับนักเรียน</Card.Text>
                                                <Button variant="primary" className="mt-3">
                                                    <FaPlusCircle className="me-2" /> สร้างบทเรียนใหม่
                                                </Button>
                                            </Card.Body>
                                        </Card>
                                    </Tab>
                                    <Tab eventKey="quizzes" title="แบบทดสอบ">
                                        <Card className="shadow-sm mb-4">
                                            <Card.Body className="text-center py-5">
                                                <FaClipboardList className="mb-3 text-primary" size={50} />
                                                <Card.Title>ยังไม่มีแบบทดสอบในห้องเรียนนี้</Card.Title>
                                                <Card.Text>สร้างแบบทดสอบเพื่อวัดความเข้าใจของนักเรียน</Card.Text>
                                                <Button variant="primary" className="mt-3">
                                                    <FaPlusCircle className="me-2" /> สร้างแบบทดสอบใหม่
                                                </Button>
                                            </Card.Body>
                                        </Card>
                                    </Tab>
                                </Tabs>
                            </Col>

                            <Col lg={4}>
                                <Card className="shadow-sm mb-4">
                                    <Card.Body>
                                        <Card.Title className="h4 mb-4">การจัดการห้องเรียน</Card.Title>
                                        <ListGroup variant="flush">
                                            <ListGroup.Item action onClick={() => setShowStudents(true)} className="d-flex justify-content-between align-items-center">
                                                <span><FaUsers className="me-2" /> จัดการรายชื่อนักเรียน</span>
                                                <Badge bg="primary" pill>{students.length}</Badge>
                                            </ListGroup.Item>
                                            <ListGroup.Item action href="/teacher/classroom/:classId/lessons">
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