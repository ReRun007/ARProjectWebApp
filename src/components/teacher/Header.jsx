import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import { storage, db } from '../../firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { Navbar, Nav, NavDropdown, Button, Offcanvas, Container, Image, Accordion, Spinner, Badge, ListGroup } from 'react-bootstrap';
import { FaUser, FaSignOutAlt, FaHome, FaBook, FaCog, FaChalkboardTeacher, FaChevronRight, FaSearch, FaBell, FaPlus } from 'react-icons/fa';

function Header({ teacherInfo: propTeacherInfo, classrooms: propClassrooms }) {
    const { logOut, user } = useUserAuth();
    const navigate = useNavigate();

    const [show, setShow] = useState(false);
    const [teacherInfo, setTeacherInfo] = useState(propTeacherInfo || null);
    const [imageURL, setImageURL] = useState(null);
    const [classrooms, setClassrooms] = useState(propClassrooms || []);
    const [loading, setLoading] = useState(!propTeacherInfo);

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

    const fetchTeacherInfo = async () => {
        if (user && user.uid) {
            try {
                const docRef = doc(db, "Teachers", user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setTeacherInfo(data);
                    if (data.URLImage) {
                        const imageRef = ref(storage, data.URLImage);
                        const url = await getDownloadURL(imageRef);
                        setImageURL(url);
                    }
                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.error("Error fetching teacher data: ", error);
            }
        }
    }

    const fetchClassrooms = async () => {
        if (user && user.uid) {
            try {
                const q = query(
                    collection(db, "Classrooms"),
                    where('TeachersID', '==', `/Teachers/${user.uid}`),
                    orderBy('ClassName', 'asc')
                );
                const querySnapshot = await getDocs(q);
                let classroomsList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setClassrooms(classroomsList);
            } catch (error) {
                console.error("Error fetching classrooms: ", error);
            }
        }
    };

    useEffect(() => {
        const loadData = async () => {
            if (!propTeacherInfo || !propClassrooms) {
                setLoading(true);
                await fetchTeacherInfo();
                await fetchClassrooms();
                setLoading(false);
            }
        };

        loadData();
    }, [user, propTeacherInfo, propClassrooms]);

    if (loading) {
        return (
            <Navbar bg="primary" variant="dark" expand="lg" className="py-3">
                <Container>
                    <Navbar.Brand href="/teacher/home" className="fs-4">LearnMate</Navbar.Brand>
                    <Spinner animation="border" variant="light" />
                </Container>
            </Navbar>
        );
    }


    return (
        <>
            <Navbar bg="primary" variant="dark" expand="lg" className="py-2 shadow-sm">
                <Container fluid>
                    <Navbar.Brand as={Link} to="/teacher/home" className="d-flex align-items-center">
                        <Image src="https://firebasestorage.googleapis.com/v0/b/arproject-b2e7b.appspot.com/o/Logo%2Flearnmate-high-resolution-logo-white-transparent.png?alt=media&token=81946893-7f22-489c-9477-fcf7c20f6ec8" height="30" className="me-2" alt="LearnMate Logo" />
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="ms-auto align-items-center">
                            <Nav.Link as={Link} to="/teacher/home" className="mx-2">
                                <FaHome className="me-1" /> หน้าหลัก
                            </Nav.Link>
                            <NavDropdown title={<span><FaChalkboardTeacher className="me-1" /> ห้องเรียน</span>} id="classrooms-dropdown" className="mx-2">
                                {classrooms.map(classroom => (
                                    <NavDropdown.Item key={classroom.id} as={Link} to={`/teacher/classroom/${classroom.id}`}>
                                        {classroom.ClassName}
                                    </NavDropdown.Item>
                                ))}
                            </NavDropdown>
                            <Nav.Item className="mx-2">
                                <Button variant="outline-light" onClick={handleShow} className="d-flex align-items-center">
                                    {imageURL ? (
                                        <Image src={imageURL} roundedCircle width="30" height="30" className="me-2" />
                                    ) : (
                                        <FaUser className="me-2" />
                                    )}
                                    <span className="d-none d-md-inline">{teacherInfo?.FirstName}</span>
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
                        <span>{teacherInfo?.FirstName} {teacherInfo?.LastName}</span>
                    </Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="p-0">
                    {teacherInfo ? (
                        <ListGroup variant="flush">
                            <ListGroup.Item action as={Link} to="/teacher/profile/edit">
                                <FaCog className="me-2" /> ตั้งค่าโปรไฟล์
                            </ListGroup.Item>
                            <ListGroup.Item>
                                <strong><FaChalkboardTeacher className="me-2" /> ห้องเรียนของฉัน</strong>
                                {classrooms.length > 0 ? (
                                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                        <ListGroup variant="flush" className="mt-2">
                                            {classrooms.map(classroom => (
                                                <ListGroup.Item 
                                                    key={classroom.ClassId} 
                                                    action 
                                                    onClick={() => {
                                                        navigate(`/teacher/classroom/${classroom.ClassId}`);
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