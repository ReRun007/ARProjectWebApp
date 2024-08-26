import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Tab, Tabs, Spinner } from 'react-bootstrap';
import { db } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import Header from './Header';
import StudentPostDisplay from './model/StudentPostDisplay';
import { FaBook, FaClipboardList } from 'react-icons/fa';

function StudentClassroomDetails() {
    const { classId } = useParams();
    const [classroom, setClassroom] = useState(null);
    const [posts, setPosts] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClassroomData = async () => {
            setLoading(true);
            try {
                const classDoc = await getDoc(doc(db, 'Classrooms', classId));
                if (classDoc.exists()) {
                    setClassroom(classDoc.data());
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
                    where('sj_id', '==', classId),
                    orderBy('ls_number')
                );
                const lessonsSnapshot = await getDocs(lessonsQuery);
                setLessons(lessonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                // Fetch quizzes (assuming you have a Quizzes collection)
                const quizzesQuery = query(
                    collection(db, 'Quizzes'),
                    where('classId', '==', classId)
                );
                const quizzesSnapshot = await getDocs(quizzesQuery);
                setQuizzes(quizzesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            } catch (error) {
                console.error("Error fetching classroom data: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchClassroomData();
    }, [classId]);

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
                            </Card.Body>
                        </Card>

                        <Tabs defaultActiveKey="posts" id="classroom-tabs" className="mb-4">
                            <Tab eventKey="posts" title="โพสต์">
                                <StudentPostDisplay posts={posts} classId={classId} />
                            </Tab>
                            <Tab eventKey="lessons" title="บทเรียน">
                                <Card className="shadow-sm">
                                    <Card.Body>
                                        {lessons.length > 0 ? (
                                            lessons.map((lesson) => (
                                                <Card key={lesson.id} className="mb-3">
                                                    <Card.Body>
                                                        <Card.Title>
                                                            <FaBook className="me-2" />
                                                            บทที่ {lesson.ls_number}: {lesson.ls_name}
                                                        </Card.Title>
                                                        <Card.Text>{lesson.lsd_description}</Card.Text>
                                                        {lesson.lsd_file && (
                                                            <a href={lesson.lsd_file} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary">
                                                                ดูเอกสารประกอบการเรียน
                                                            </a>
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            ))
                                        ) : (
                                            <p className="text-center text-muted">ยังไม่มีบทเรียนในห้องเรียนนี้</p>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Tab>
                            <Tab eventKey="quizzes" title="แบบทดสอบ">
                                <Card className="shadow-sm">
                                    <Card.Body>
                                        {quizzes.length > 0 ? (
                                            quizzes.map((quiz) => (
                                                <Card key={quiz.id} className="mb-3">
                                                    <Card.Body>
                                                        <Card.Title>
                                                            <FaClipboardList className="me-2" />
                                                            {quiz.title}
                                                        </Card.Title>
                                                        <Card.Text>{quiz.description}</Card.Text>
                                                        <a href={`/student/quiz/${quiz.id}`} className="btn btn-primary">
                                                            เริ่มทำแบบทดสอบ
                                                        </a>
                                                    </Card.Body>
                                                </Card>
                                            ))
                                        ) : (
                                            <p className="text-center text-muted">ยังไม่มีแบบทดสอบในห้องเรียนนี้</p>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Tab>
                        </Tabs>
                    </Col>
                </Row>
            </Container>
        </>
    );
}

export default StudentClassroomDetails;