import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Alert, Button, Container, Card, Row, Col, Image } from 'react-bootstrap';
import { db, storage } from '../../firebase';
import { collection, setDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';
import { useUserAuth } from '../../context/UserAuthContext';
import { FaUser, FaEnvelope, FaLock, FaCalendar, FaSchool, FaUserGraduate, FaChalkboardTeacher, FaImage } from 'react-icons/fa';

function Register() {
    const [firstName, setName] = useState("");
    const [lastName, setSurname] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [gender, setGender] = useState("");
    const [birthdate, setBirthdate] = useState("");
    const [institution, setInstitution] = useState("");
    const [userType, setUserType] = useState("");
    const [error, setError] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [avatarFile, setAvatarFile] = useState(null);
    const [defaultAvatars, setDefaultAvatars] = useState([]);
    const { signUp } = useUserAuth();

    let navigate = useNavigate();

    useEffect(() => {
        // Fetch default avatars from Firebase Storage
        const fetchDefaultAvatars = async () => {
            const avatarsRef = ref(storage, 'Profile/Avata');
            const avatarsList = await listAll(avatarsRef);
            const avatarUrls = await Promise.all(
                avatarsList.items.map(async (item) => {
                    const url = await getDownloadURL(item);
                    return { name: item.name, url };
                })
            );
            setDefaultAvatars(avatarUrls);
        };

        fetchDefaultAvatars();
    }, []);

    const handleAvatarChange = (e) => {
        if (e.target.files[0]) {
            setAvatarFile(e.target.files[0]);
            setAvatarUrl(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleDefaultAvatarSelect = (url) => {
        setAvatarUrl(url);
        setAvatarFile(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        if (!userType) {
            setError("Please select user type (Student or Teacher)");
            return;
        }

        try {
            const userCredential = await signUp(email, password);
            const user = userCredential.user;
            const collectionName = userType === 'student' ? 'Students' : 'Teachers';
            const docRef = doc(db, collectionName, user.uid);

            let profileImageUrl = avatarUrl;

            // If user uploaded a custom avatar
            if (avatarFile) {
                const avatarRef = ref(storage, `User/${user.email}/Profile/${avatarFile.name}`);
                await uploadBytes(avatarRef, avatarFile);
                profileImageUrl = await getDownloadURL(avatarRef);
            } else if (avatarUrl) {
                // If a default avatar was selected, we keep the existing Storage path
                profileImageUrl = avatarUrl;
            } else {
                // If no avatar was selected, use a default one
                profileImageUrl = "gs://arproject-b2e7b.appspot.com/Profile/Avata/a01.jpg";
            }

            await setDoc(docRef, {
                FirstName: firstName,
                LastName: lastName,
                Username: username,
                Email: email,
                Gender: gender,
                BirthDate: birthdate,
                Institution: institution,
                UserType: userType,
                URLImage: profileImageUrl
            });

            navigate("/");
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <Card className="shadow-lg">
                        <Card.Body className="p-5">
                            <h2 className="text-center mb-4">ลงทะเบียน</h2>
                            {error && <Alert variant='danger'>{error}</Alert>}

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3 text-center">
                                    <Form.Label>รูปโปรไฟล์</Form.Label>
                                    <div className="d-flex justify-content-center mb-3">
                                        <Image src={avatarUrl || 'https://via.placeholder.com/150'} roundedCircle width={150} height={150} />
                                    </div>
                                    <div className="d-flex justify-content-center flex-wrap mb-3">
                                        {defaultAvatars.map((avatar, index) => (
                                            <Image
                                                key={index}
                                                src={avatar.url}
                                                roundedCircle
                                                width={50}
                                                height={50}
                                                className="m-1 cursor-pointer"
                                                onClick={() => handleDefaultAvatarSelect(avatar.url)}
                                            />
                                        ))}
                                    </div>
                                    <Form.Control
                                        type="file"
                                        onChange={handleAvatarChange}
                                        accept="image/*"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="userType">
                                    <Form.Label>ประเภทผู้ใช้</Form.Label>
                                    <div>
                                        <Form.Check
                                            inline
                                            type="radio"
                                            label="นักเรียน"
                                            name="userType"
                                            id="student"
                                            onChange={() => setUserType('student')}
                                        />
                                        <Form.Check
                                            inline
                                            type="radio"
                                            label="ครู"
                                            name="userType"
                                            id="teacher"
                                            onChange={() => setUserType('teacher')}
                                        />
                                    </div>
                                </Form.Group>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3" controlId="name">
                                            <Form.Label>ชื่อ</Form.Label>
                                            <Form.Control 
                                                type="text"
                                                placeholder="กรอกชื่อ"
                                                onChange={(e) => setName(e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3" controlId="surname">
                                            <Form.Label>นามสกุล</Form.Label>
                                            <Form.Control 
                                                type="text"
                                                placeholder="กรอกนามสกุล"
                                                onChange={(e) => setSurname(e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3" controlId="username">
                                    <Form.Label>ชื่อผู้ใช้</Form.Label>
                                    <Form.Control 
                                        type="text"
                                        placeholder="กรอกชื่อผู้ใช้"
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="email">
                                    <Form.Label>อีเมล</Form.Label>
                                    <Form.Control 
                                        type="email"
                                        placeholder="กรอกอีเมล"
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </Form.Group>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3" controlId="password">
                                            <Form.Label>รหัสผ่าน</Form.Label>
                                            <Form.Control 
                                                type="password"
                                                placeholder="กรอกรหัสผ่าน"
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3" controlId="confirmPassword">
                                            <Form.Label>ยืนยันรหัสผ่าน</Form.Label>
                                            <Form.Control 
                                                type="password"
                                                placeholder="ยืนยันรหัสผ่าน"
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3" controlId="gender">
                                    <Form.Label>เพศ</Form.Label>
                                    <Form.Select onChange={(e) => setGender(e.target.value)}>
                                        <option value="">เลือกเพศ</option>
                                        <option value="male">ชาย</option>
                                        <option value="female">หญิง</option>
                                        <option value="other">อื่นๆ</option>
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="birthdate">
                                    <Form.Label>วันเกิด</Form.Label>
                                    <Form.Control 
                                        type="date"
                                        onChange={(e) => setBirthdate(e.target.value)}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4" controlId="institution">
                                    <Form.Label>สถาบัน</Form.Label>
                                    <Form.Control 
                                        type="text"
                                        placeholder="กรอกชื่อสถาบัน"
                                        onChange={(e) => setInstitution(e.target.value)}
                                    />
                                </Form.Group>

                                <div className="d-grid gap-2">
                                    <Button variant="primary" type="submit" size="lg">ลงทะเบียน</Button>
                                </div>
                            </Form>
                            <div className="text-center mt-4">
                                มีบัญชีอยู่แล้ว? <Link to="/login">เข้าสู่ระบบ</Link>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    )
}

export default Register;