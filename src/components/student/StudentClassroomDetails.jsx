import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Tab, Tabs, Spinner, Button, Modal, ListGroup, Form, InputGroup } from 'react-bootstrap';
import { db, storage } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import Header from './Header';
import StudentPostDisplay from './model/StudentPostDisplay';
import StudentLessonDisplay from './model/StudentLessonDisplay';
import StudentQuizDisplay from './model/StudentQuizDisplay';
import StudentAssignmentDisplay from './model/StudentAssignmentDisplay';
import { FaSearch, FaUserCircle } from 'react-icons/fa';

function StudentClassroomDetails() {
    const { classId } = useParams();
    const [classroom, setClassroom] = useState(null);
    const [posts, setPosts] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [members, setMembers] = useState([]);
    const [teacher, setTeacher] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchClassroomData = async () => {
            setLoading(true);
            try {
                const classDoc = await getDoc(doc(db, 'Classrooms', classId));
                if (classDoc.exists()) {
                    const classData = classDoc.data();
                    setClassroom(classDoc.data());

                    const teacherId = classData.TeachersID.split('/')[2]; // Assuming TeachersID is in format "/Teachers/teacherId"
                    const teacherDoc = await getDoc(doc(db, 'Teachers', teacherId));
                    if (teacherDoc.exists()) {
                        setTeacher({ id: teacherId, ...teacherDoc.data() });
                    }

                }

                // Fetch posts
                const postsQuery = query(
                    collection(db, 'Posts'),
                    where('classId', '==', classId),
                    orderBy('createdAt', 'desc')
                );
                const postsSnapshot = await getDocs(postsQuery);
                setPosts(postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                // Fetch lessons
                const lessonsQuery = query(
                    collection(db, 'Lessons'),
                    where('classId', '==', classId),
                    orderBy('order')
                );
                const lessonsSnapshot = await getDocs(lessonsQuery);
                setLessons(lessonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                // Fetch quizzes
                const quizzesQuery = query(
                    collection(db, 'Quizzes'),
                    where('classId', '==', classId)
                );
                const quizzesSnapshot = await getDocs(quizzesQuery);
                setQuizzes(quizzesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                await fetchMembers();

            } catch (error) {
                console.error("Error fetching classroom data: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchClassroomData();
    }, [classId]);


    const fetchMembers = async () => {
        try {
            const enrollmentsQuery = query(
                collection(db, 'ClassEnrollments'),
                where('classId', '==', classId)
            );
            const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
            const studentIds = enrollmentsSnapshot.docs.map(doc => doc.data().studentId);
    
            const studentsQuery = query(
                collection(db, 'Students'),
                where('__name__', 'in', studentIds)
            );
            const studentsSnapshot = await getDocs(studentsQuery);
            const studentsData = await Promise.all(studentsSnapshot.docs.map(async doc => {
                const data = doc.data();
                let profileImageUrl = null;
                if (data.URLImage) {
                    try {
                        profileImageUrl = await getDownloadURL(ref(storage, data.URLImage));
                    } catch (error) {
                        console.error("Error fetching profile image:", error);
                    }
                }
                return {
                    id: doc.id,
                    ...data,
                    profileImageUrl,
                    isTeacher: false
                };
            }));
    
            let allMembers = [...studentsData];
    
            // Add teacher to members list
            if (teacher) {
                let teacherProfileImageUrl = null;
                if (teacher.URLImage) {
                    try {
                        teacherProfileImageUrl = await getDownloadURL(ref(storage, teacher.URLImage));
                    } catch (error) {
                        console.error("Error fetching teacher profile image:", error);
                    }
                }
                allMembers.unshift({
                    ...teacher,
                    profileImageUrl: teacherProfileImageUrl,
                    isTeacher: true
                });
            }
    
            setMembers(allMembers);
        } catch (error) {
            console.error("Error fetching members: ", error);
        }
    };

    const filteredMembers = members.filter(member => 
        member.FirstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.LastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.Username.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
            <Container className="py-4">
                <Row className="justify-content-center">
                    <Col lg={10} xl={8}>
                        <Card className="shadow-sm mb-4">
                            <Card.Body>
                                <Card.Title className="display-4 mb-2">{classroom?.ClassName}</Card.Title>
                                <Card.Subtitle className="mb-4 text-muted">{classroom?.ClassId}</Card.Subtitle>
                                <Card.Text>{classroom?.ClassDescription}</Card.Text>
                                <Button variant="outline-primary" onClick={() => setShowMembersModal(true)}>
                                    ดูสมาชิก
                                </Button>
                            </Card.Body>
                        </Card>

                        <Tabs defaultActiveKey="posts" id="classroom-tabs" className="mb-4">
                            <Tab eventKey="posts" title="โพสต์">
                                <StudentPostDisplay posts={posts} classId={classId} />
                            </Tab>
                            <Tab eventKey="lessons" title="บทเรียน">
                                <StudentLessonDisplay lessons={lessons} classId={classId} />
                            </Tab>
                            <Tab eventKey="quizzes" title="แบบทดสอบ">
                                <StudentQuizDisplay quizzes={quizzes || []} />
                            </Tab>
                            <Tab eventKey="assignments" title="งานที่มอบหมาย">
                                <StudentAssignmentDisplay classId={classId} />
                            </Tab>
                        </Tabs>
                    </Col>
                </Row>
            </Container>

            <Modal show={showMembersModal} onHide={() => setShowMembersModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>สมาชิกในห้องเรียน</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <InputGroup className="mb-3">
                        <InputGroup.Text>
                            <FaSearch />
                        </InputGroup.Text>
                        <Form.Control
                            placeholder="ค้นหาสมาชิก..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>
                    <ListGroup>
                        {filteredMembers.map(member => (
                            <ListGroup.Item key={member.id} className="d-flex align-items-center">
                                {member.profileImageUrl ? (
                                    <img
                                        src={member.profileImageUrl}
                                        alt={`${member.FirstName} ${member.LastName}`}
                                        style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '10px' }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            backgroundColor: '#007bff',
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: '10px',
                                            fontSize: '18px'
                                        }}
                                    >
                                        {member.FirstName[0]}
                                    </div>
                                )}
                                <div>
                                    <div>
                                        <strong>{member.FirstName} {member.LastName}</strong>
                                        {member.isTeacher && <span className="ms-2 badge bg-primary">ครูผู้สอน</span>}
                                    </div>
                                    <small className="text-muted">@{member.Username}</small>
                                </div>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </Modal.Body>
            </Modal>
        </>
    );


}

export default StudentClassroomDetails;