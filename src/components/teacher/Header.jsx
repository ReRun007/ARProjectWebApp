import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';

import { storage, db } from '../../firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';

import { Navbar, Nav, NavDropdown, Button, Offcanvas, Container, Image, Accordion } from 'react-bootstrap';
import { FaUser, FaSignOutAlt, FaHome, FaBook, FaCog, FaChalkboardTeacher, FaChevronRight, FaSearch } from 'react-icons/fa';

function Header() {
    const teacherId = sessionStorage.getItem('teacherId');
    const { logOut, user } = useUserAuth();
    const navigate = useNavigate();

    const [show, setShow] = useState(false);
    const [teacherInfo, setTeacherInfo] = useState(null);
    const [imageURL, setImageURL] = useState(null);
    const [classrooms, setClassrooms] = useState([]);

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
        if (teacherId) {
            const docRef = doc(db, "Teachers", teacherId);
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
        }
    }

    const fetchClassrooms = async () => {
        if (teacherId) {
            try {
                const classroomsRef = collection(db, "Classrooms");
                const q = query(classroomsRef, where('TeachersID', '==', `/Teachers/${teacherId}`));
                const querySnapshot = await getDocs(q);
                let classroomsList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // เรียงลำดับตามชื่อห้องเรียน
                classroomsList.sort((a, b) => a.ClassName.localeCompare(b.ClassName));

                setClassrooms(classroomsList);
            } catch (error) {
                console.error("Error fetching classrooms: ", error);
            }
        }
    };

    useEffect(() => {
        if (teacherId) {
            fetchTeacherInfo();
            fetchClassrooms();
        }
    }, [teacherId]);

    return (
        <>
            <Navbar bg="primary" variant="dark" expand="lg" className="py-3">
                <Container>
                    <Button variant="outline-light" onClick={handleShow} className="me-3">
                        <FaUser />
                    </Button>
                    <Navbar.Brand href="/teacher/home" className="fs-4">LearningSystem</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="ms-auto">
                            <Nav.Link href="/teacher/home" className="mx-2"><FaHome /> หน้าหลัก</Nav.Link>
                            <NavDropdown title={<><FaChalkboardTeacher /> ห้องเรียน</>} id="classrooms-dropdown" className="mx-2">
                                {classrooms.map(classroom => (
                                    <NavDropdown.Item key={classroom.id} href={`/classroom/${classroom.id}`}>
                                        {classroom.ClassName}
                                    </NavDropdown.Item>
                                ))}
                                <NavDropdown.Divider />
                                <NavDropdown.Item href="/create-classroom">+ สร้างห้องเรียนใหม่</NavDropdown.Item>
                            </NavDropdown>
                            <NavDropdown title={<><FaCog /> ตั้งค่า</>} id="settings-dropdown" className="mx-2">
                                <NavDropdown.Item href="/profile">โปรไฟล์</NavDropdown.Item>
                                <NavDropdown.Item href="/account">บัญชี</NavDropdown.Item>
                                <NavDropdown.Divider />
                                <NavDropdown.Item onClick={handleLogout}>
                                    <FaSignOutAlt /> ออกจากระบบ
                                </NavDropdown.Item>
                            </NavDropdown>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            <Offcanvas show={show} onHide={handleClose} placement="start">
                <Offcanvas.Header closeButton className="bg-primary text-white">
                    <Offcanvas.Title className="fs-4">โปรไฟล์ครู</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    {teacherInfo ? (
                        <div className="text-center">
                            {imageURL && (
                                <Image src={imageURL} roundedCircle className="mb-3" style={{ width: '150px', height: '150px', objectFit: 'cover' }} />
                            )}
                            <h3>{`${teacherInfo.FirstName} ${teacherInfo.LastName}`}</h3>
                            <p className="text-muted">{teacherInfo.Email}</p>
                            <hr />
                            <Accordion className="mb-3 custom-accordion">
                                <Accordion.Item eventKey="0">
                                    <Accordion.Header className="d-flex align-items-center">
                                        <FaChalkboardTeacher className="me-2 text-primary" />
                                        <span className="fw-bold">ห้องเรียนของฉัน</span>
                                    </Accordion.Header>
                                    <Accordion.Body className="p-3">
                                        {classrooms.length > 0 ? (
                                            <div>
                                                {classrooms.map(classroom => (
                                                    <div key={classroom.ClassId} className="mb-2">
                                                        <Button
                                                            variant="outline-primary"
                                                            className="w-100 text-start d-flex align-items-start p-3 rounded-3 shadow-sm hover-shadow transition"
                                                            onClick={() => {
                                                                navigate(`/classroom/${classroom.ClassId}`);
                                                                handleClose();
                                                            }}
                                                        >
                                                            <FaBook className="me-3 mt-1 text-primary" size={24} />
                                                            <div className="flex-grow-1 overflow-hidden">
                                                                <h5 className="mb-1 text-truncate">{classroom.ClassName}</h5>
                                                                <p className="mb-0 text-muted small">{classroom.ClassDescription}</p>
                                                            </div>
                                                            <FaChevronRight className="ms-2 text-primary" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center text-muted py-3">
                                                <FaSearch className="mb-2" size={24} />
                                                <p className="mb-0">ไม่พบห้องเรียน</p>
                                            </div>
                                        )}
                                    </Accordion.Body>
                                </Accordion.Item>
                            </Accordion>
                            <Button onClick={handleLogout} variant='danger' className="mt-3 w-100">
                                <FaSignOutAlt className="me-2" /> ออกจากระบบ
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">กำลังโหลด...</span>
                            </div>
                            <p className="mt-3">กำลังโหลดข้อมูลครู...</p>
                        </div>
                    )}
                </Offcanvas.Body>
            </Offcanvas>
        </>
    )
}

export default Header;