import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Image } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';
import { db, storage, auth  } from '../../firebase';
import { useUserAuth } from '../../context/UserAuthContext';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { FaLock } from 'react-icons/fa';
import Header from './Header';

function TeacherProfileEdit() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [gender, setGender] = useState("");
    const [birthdate, setBirthdate] = useState("");
    const [institution, setInstitution] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [avatarFile, setAvatarFile] = useState(null);
    const [defaultAvatars, setDefaultAvatars] = useState([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const { user } = useUserAuth();
    const navigate = useNavigate();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");

    useEffect(() => {
        const fetchTeacherData = async () => {
            if (user) {
                const docRef = doc(db, "Teachers", user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFirstName(data.FirstName);
                    setLastName(data.LastName);
                    setUsername(data.Username);
                    setEmail(data.Email);
                    setGender(data.Gender);
                    setBirthdate(data.BirthDate);
                    setInstitution(data.Institution);
                    setAvatarUrl(data.URLImage);
                }
            }
        };

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

        fetchTeacherData();
        fetchDefaultAvatars();
    }, [user]);

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
        setSuccess("");

        try {
            const docRef = doc(db, "Teachers", user.uid);
            let profileImageUrl = avatarUrl;

            if (avatarFile) {
                const avatarRef = ref(storage, `User/${user.email}/Profile/${avatarFile.name}`);
                await uploadBytes(avatarRef, avatarFile);
                profileImageUrl = await getDownloadURL(avatarRef);
            }

            await updateDoc(docRef, {
                FirstName: firstName,
                LastName: lastName,
                Username: username,
                Gender: gender,
                BirthDate: birthdate,
                Institution: institution,
                URLImage: profileImageUrl
            });

            setSuccess("อัพเดตโปรไฟล์สำเร็จ");
            setTimeout(() => navigate('/teacher/home'), 2000);
        } catch (err) {
            console.error("Update profile error:", err);
            setError(err.message);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordError("");
        setPasswordSuccess("");
    
        if (newPassword !== confirmNewPassword) {
            setPasswordError("รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน");
            return;
        }
    
        try {
            const credential = EmailAuthProvider.credential(
                auth.currentUser.email,
                currentPassword
            );
            await reauthenticateWithCredential(auth.currentUser, credential);
            await updatePassword(auth.currentUser, newPassword);
            setPasswordSuccess("อัปเดตรหัสผ่านสำเร็จ");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
        } catch (error) {
            console.error("Password change error:", error);
            setPasswordError("เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน: " + error.message);
        }
    };

    return (
        <>
            <Header />
            <Container className="py-5">
                <Row className="justify-content-center">
                    <Col md={8} lg={6}>
                        <Card className="shadow-lg">
                            <Card.Body className="p-5">
                                <h2 className="text-center mb-4">แก้ไขโปรไฟล์</h2>
                                {error && <Alert variant='danger'>{error}</Alert>}
                                {success && <Alert variant='success'>{success}</Alert>}

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

                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3" controlId="firstName">
                                                <Form.Label>ชื่อ</Form.Label>
                                                <Form.Control 
                                                    type="text"
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3" controlId="lastName">
                                                <Form.Label>นามสกุล</Form.Label>
                                                <Form.Control 
                                                    type="text"
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Form.Group className="mb-3" controlId="username">
                                        <Form.Label>ชื่อผู้ใช้</Form.Label>
                                        <Form.Control 
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3" controlId="email">
                                        <Form.Label>อีเมล</Form.Label>
                                        <Form.Control 
                                            type="email"
                                            value={email}
                                            disabled
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3" controlId="gender">
                                        <Form.Label>เพศ</Form.Label>
                                        <Form.Select value={gender} onChange={(e) => setGender(e.target.value)}>
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
                                            value={birthdate}
                                            onChange={(e) => setBirthdate(e.target.value)}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-4" controlId="institution">
                                        <Form.Label>สถาบัน</Form.Label>
                                        <Form.Control 
                                            type="text"
                                            value={institution}
                                            onChange={(e) => setInstitution(e.target.value)}
                                        />
                                    </Form.Group>

                                    <div className="d-grid gap-2">
                                        <Button variant="primary" type="submit" size="lg">บันทึกการเปลี่ยนแปลง</Button>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>

                        <Card className="shadow-lg">
                            <Card.Body className="p-5">
                                <h3 className="text-center mb-4">เปลี่ยนรหัสผ่าน</h3>
                                {passwordError && <Alert variant='danger'>{passwordError}</Alert>}
                                {passwordSuccess && <Alert variant='success'>{passwordSuccess}</Alert>}

                                <Form onSubmit={handlePasswordChange}>
                                    <Form.Group className="mb-3" controlId="currentPassword">
                                        <Form.Label><FaLock className="me-2" />รหัสผ่านปัจจุบัน</Form.Label>
                                        <Form.Control 
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            required
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3" controlId="newPassword">
                                        <Form.Label><FaLock className="me-2" />รหัสผ่านใหม่</Form.Label>
                                        <Form.Control 
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-4" controlId="confirmNewPassword">
                                        <Form.Label><FaLock className="me-2" />ยืนยันรหัสผ่านใหม่</Form.Label>
                                        <Form.Control 
                                            type="password"
                                            value={confirmNewPassword}
                                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                                            required
                                        />
                                    </Form.Group>

                                    <div className="d-grid">
                                        <Button variant="primary" type="submit">เปลี่ยนรหัสผ่าน</Button>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    );
}

export default TeacherProfileEdit;