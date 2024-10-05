import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import { Navbar, Nav, NavDropdown, Container, Image, Spinner } from 'react-bootstrap';
import { db, storage } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { FaUser, FaSignOutAlt, FaHome, FaBook, FaChalkboardTeacher } from 'react-icons/fa';

function Header() {
    const [userInfo, setUserInfo] = useState(null);
    const [imageURL, setImageURL] = useState(null);
    const [userType, setUserType] = useState(null);
    const [classrooms, setClassrooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const { logOut, user } = useUserAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserInfo = async () => {
            if (user) {
                setLoading(true);
                try {
                    const userType = sessionStorage.getItem('userType');
                    setUserType(userType);
                    const collectionName = userType === 'teacher' ? 'Teachers' : 'Students';
                    const docRef = doc(db, collectionName, user.uid);
                    const docSnap = await getDoc(docRef);
                    
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setUserInfo(data);
                        
                        if (data.URLImage) {
                            const imageRef = ref(storage, data.URLImage);
                            const url = await getDownloadURL(imageRef);
                            setImageURL(url);
                        }

                        if (userType === 'teacher') {
                            await fetchClassrooms(user.uid);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching user info:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        fetchUserInfo();
    }, [user]);

    const fetchClassrooms = async (teacherId) => {
        try {
            const q = query(collection(db, "Classrooms"), where("TeachersID", "==", `/Teachers/${teacherId}`));
            const querySnapshot = await getDocs(q);
            const classroomList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setClassrooms(classroomList);
        } catch (error) {
            console.error("Error fetching classrooms:", error);
        }
    };

    const handleLogout = async () => {
        try {
            await logOut();
            sessionStorage.clear();
            navigate('/');
        } catch (err) {
            console.log(err.message);
        }
    };

    if (loading) {
        return (
            <Navbar bg="primary" variant="dark" expand="lg">
                <Container>
                    <Navbar.Brand href="/">LearningSystem</Navbar.Brand>
                    <Spinner animation="border" variant="light" />
                </Container>
            </Navbar>
        );
    }

    return (
        <Navbar bg="primary" variant="dark" expand="lg">
            <Container>
                <Navbar.Brand href={`/${userType}/home`}>LearningSystem - {userType === 'teacher' ? 'Teacher' : 'Student'}</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="ms-auto">
                        <Nav.Link href={`/${userType}/home`}><FaHome /> หน้าหลัก</Nav.Link>
                        {userType === 'teacher' ? (
                            <NavDropdown title={<><FaChalkboardTeacher /> ห้องเรียน</>} id="classrooms-dropdown">
                                {classrooms.map(classroom => (
                                    <NavDropdown.Item key={classroom.id} href={`/teacher/classroom/${classroom.id}`}>
                                        {classroom.ClassName}
                                    </NavDropdown.Item>
                                ))}
                                <NavDropdown.Divider />
                                <NavDropdown.Item href="/teacher/create-classroom">+ สร้างห้องเรียนใหม่</NavDropdown.Item>
                            </NavDropdown>
                        ) : (
                            <Nav.Link href="/student/courses"><FaBook /> วิชาเรียน</Nav.Link>
                        )}
                        <NavDropdown title={
                            <span>
                                {imageURL && <Image src={imageURL} roundedCircle width="30" height="30" className="me-2" />}
                                {userInfo?.FirstName || 'Profile'}
                            </span>
                        } id="basic-nav-dropdown">
                            <NavDropdown.Item href={`/${userType}/profile`}><FaUser /> โปรไฟล์</NavDropdown.Item>
                            <NavDropdown.Divider />
                            <NavDropdown.Item onClick={handleLogout}><FaSignOutAlt /> ออกจากระบบ</NavDropdown.Item>
                        </NavDropdown>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default Header;