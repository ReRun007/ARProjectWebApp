import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Tab, Tabs, Spinner } from 'react-bootstrap';
import { db } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import Header from './Header';
import StudentPostDisplay from './model/StudentPostDisplay';
import StudentLessonDisplay from './model/StudentLessonDisplay';
import StudentQuizDisplay from './model/StudentQuizDisplay';
import StudentAssignmentDisplay from './model/StudentAssignmentDisplay';

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
        </>
    );
}

export default StudentClassroomDetails;