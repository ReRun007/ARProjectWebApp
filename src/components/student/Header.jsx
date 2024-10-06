import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import { storage, db } from '../../firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { Navbar, Nav, NavDropdown, Button, Offcanvas, Container, Image, Spinner, Badge, ListGroup } from 'react-bootstrap';
import { FaUser, FaSignOutAlt, FaHome, FaBook, FaCog, FaChalkboardTeacher, FaChevronRight, FaSearch, FaBell, FaGraduationCap, FaUserGraduate, FaCalendarAlt, FaTasks, FaPlus } from 'react-icons/fa';

function Header() {
    const { logOut, user } = useUserAuth();
    const navigate = useNavigate();

    const [show, setShow] = useState(false);
    const [studentInfo, setStudentInfo] = useState(null);
    const [imageURL, setImageURL] = useState(null);
    const [enrolledClasses, setEnrolledClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notificationCount, setNotificationCount] = useState(0);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const handleLogout = async () => {
        try {
            await logOut();
            sessionStorage.clear();
            navigate('/');
        } catch (err) {
            console.log(err.message);
        }
    }

    const fetchStudentInfo = async () => {
        if (user && user.uid) {
            try {
                const docRef = doc(db, "Students", user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setStudentInfo(data);
                    if (data.URLImage) {
                        const imageRef = ref(storage, data.URLImage);
                        const url = await getDownloadURL(imageRef);
                        setImageURL(url);
                    }
                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.error("Error fetching student data: ", error);
            }
        }
    };

    const fetchEnrolledClasses = async () => {
        if (user && user.uid) {
            try {
                const enrollmentsQuery = query(
                    collection(db, "ClassEnrollments"),
                    where('studentId', '==', user.uid)
                );
                const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
                const classIds = enrollmentsSnapshot.docs.map(doc => doc.data().classId);

                if (classIds.length > 0) {
                    const classroomsQuery = query(
                        collection(db, "Classrooms"),
                        where('ClassId', 'in', classIds)
                    );
                    const classroomsSnapshot = await getDocs(classroomsQuery);
                    const classroomsList = classroomsSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setEnrolledClasses(classroomsList);
                }
            } catch (error) {
                console.error("Error fetching enrolled classes: ", error);
            }
        }
    };

    const fetchNotifications = async () => {
        if (user && user.uid) {
            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const notificationsQuery = query(
                    collection(db, "Notifications"),
                    where('studentId', '==', user.uid),
                    where('createdAt', '>=', today),
                    where('read', '==', false)
                );
                const notificationsSnapshot = await getDocs(notificationsQuery);
                setNotificationCount(notificationsSnapshot.size);
            } catch (error) {
                console.error("Error fetching notifications: ", error);
            }
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await fetchStudentInfo();
            await fetchEnrolledClasses();
            await fetchNotifications();
            setLoading(false);
        };

        if (user) {
            loadData();
        } else {
            setLoading(false);
        }
    }, [user]);

    if (loading) {
        return (
            <Navbar bg="primary" variant="dark" expand="lg" className="py-3">
                <Container>
                    <Navbar.Brand href="/student/home" className="fs-4">
                        <FaUserGraduate className="me-2" />
                        LearningSystem
                    </Navbar.Brand>
                    <Spinner animation="border" variant="light" />
                </Container>
            </Navbar>
        );
    }

    return (
        <>
            <Navbar bg="primary" variant="dark" expand="lg" className="py-2 shadow-sm">
                <Container fluid>
                    <Navbar.Brand as={Link} to="/student/home" className="d-flex align-items-center">
                        <FaUserGraduate size={30} className="me-2" />
                        <span className="fs-4 fw-bold">LearningSystem</span>
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="ms-auto align-items-center">
                            <Nav.Link as={Link} to="/student/home" className="mx-2 d-flex align-items-center">
                                <FaHome className="me-2" /> หน้าหลัก
                            </Nav.Link>
                            <NavDropdown 
                                title={<span className="d-flex align-items-center"><FaChalkboardTeacher className="me-2" /> ห้องเรียน</span>} 
                                id="classrooms-dropdown" 
                                className="mx-2"
                            >
                                {enrolledClasses.map(classroom => (
                                    <NavDropdown.Item key={classroom.id} as={Link} to={`/student/classroom/${classroom.id}`}>
                                        <FaBook className="me-2" /> {classroom.ClassName}
                                    </NavDropdown.Item>
                                ))}
                                <NavDropdown.Divider />
                                <NavDropdown.Item as={Link} to="/student/join-class">
                                    <FaPlus className="me-2" /> เข้าร่วมห้องเรียน
                                </NavDropdown.Item>
                            </NavDropdown>
                            <Nav.Link as={Link} to="/student/assignments" className="mx-2 d-flex align-items-center">
                                <FaTasks className="me-2" /> งานที่ได้รับมอบหมาย
                            </Nav.Link>
                            <Nav.Link as={Link} to="/student/calendar" className="mx-2 d-flex align-items-center">
                                <FaCalendarAlt className="me-2" /> ปฏิทิน
                            </Nav.Link>
                            <Nav.Link className="mx-2 position-relative">
                                <FaBell size={20} />
                                <Badge bg="danger" className="position-absolute top-0 start-100 translate-middle rounded-pill">
                                    {notificationCount}
                                </Badge>
                            </Nav.Link>
                            <Nav.Item className="mx-2">
                                <Button variant="outline-light" onClick={handleShow} className="d-flex align-items-center">
                                    {imageURL ? (
                                        <Image src={imageURL} roundedCircle width="30" height="30" className="me-2" />
                                    ) : (
                                        <FaUser className="me-2" />
                                    )}
                                    <span className="d-none d-md-inline">{studentInfo?.FirstName}</span>
                                </Button>
                            </Nav.Item>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            <Offcanvas show={show} onHide={handleClose} placement="end">
                <Offcanvas.Header closeButton className="bg-primary text-white">
                    <Offcanvas.Title className="d-flex align-items-center">
                        {imageURL ? (
                            <Image src={imageURL} roundedCircle width="40" height="40" className="me-2" />
                        ) : (
                            <FaUser className="me-2" size={24} />
                        )}
                        <span>{studentInfo?.FirstName} {studentInfo?.LastName}</span>
                    </Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="p-0">
                    {studentInfo ? (
                        <ListGroup variant="flush">
                            <ListGroup.Item action as={Link} to="/student/profile">
                                <FaCog className="me-2" /> ตั้งค่าโปรไฟล์
                            </ListGroup.Item>
                            <ListGroup.Item>
                                <strong><FaChalkboardTeacher className="me-2" /> ห้องเรียนของฉัน</strong>
                                {enrolledClasses.length > 0 ? (
                                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                        <ListGroup variant="flush" className="mt-2">
                                            {enrolledClasses.map(classroom => (
                                                <ListGroup.Item 
                                                    key={classroom.ClassId} 
                                                    action 
                                                    onClick={() => {
                                                        navigate(`/student/classroom/${classroom.ClassId}`);
                                                        handleClose();
                                                    }}
                                                    className="d-flex justify-content-between align-items-center"
                                                >
                                                    <span>{classroom.ClassName}</span>
                                                    <FaChevronRight size={12} />
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    </div>
                                ) : (
                                    <div className="text-center text-muted py-2">
                                        <FaSearch className="mb-1" size={16} />
                                        <small className="d-block">ไม่พบห้องเรียน</small>
                                    </div>
                                )}
                            </ListGroup.Item>
                            <ListGroup.Item action as={Link} to="/student/grades">
                                <FaGraduationCap className="me-2" /> ผลการเรียน
                            </ListGroup.Item>
                            <ListGroup.Item action onClick={handleLogout} className="text-danger">
                                <FaSignOutAlt className="me-2" /> ออกจากระบบ
                            </ListGroup.Item>
                        </ListGroup>
                    ) : (
                        <div className="text-center py-3">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-2">กำลังโหลดข้อมูล...</p>
                        </div>
                    )}
                </Offcanvas.Body>
            </Offcanvas>
        </>
    );
}

export default Header;