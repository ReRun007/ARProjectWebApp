import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Image, ListGroup } from 'react-bootstrap';
import { useUserAuth } from '../../context/UserAuthContext';
import { db, storage } from '../../firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FaFile, FaImage } from 'react-icons/fa';
import Header from './Header';

//ไฟล์นี้ไม่ใช้
function ClassroomPost() {
    const [content, setContent] = useState('');
    const [selectedRooms, setSelectedRooms] = useState([]);
    const [file, setFile] = useState(null);
    const [classrooms, setClassrooms] = useState([]);
    const [previewUrl, setPreviewUrl] = useState('');
    const { user } = useUserAuth();

    useEffect(() => {
        fetchClassrooms();
    }, [user]);

    const fetchClassrooms = async () => {
        if (user) {
            const q = query(collection(db, "Classrooms"), where("TeachersID", "==", `/Teachers/${user.uid}`));
            const querySnapshot = await getDocs(q);
            const classroomList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setClassrooms(classroomList);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);

        if (selectedFile && selectedFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(selectedFile);
        } else {
            setPreviewUrl('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (content.trim() === '' || selectedRooms.length === 0) {
            alert('กรุณากรอกเนื้อหาและเลือกอย่างน้อยหนึ่งห้องเรียน');
            return;
        }

        let fileUrl = '';
        if (file) {
            const storageRef = ref(storage, `User/${user.email}/Post/${file.name}`);
            await uploadBytes(storageRef, file);
            fileUrl = await getDownloadURL(storageRef);
        }

        const postData = {
            content,
            classrooms: selectedRooms,
            fileUrl,
            fileName: file ? file.name : '',
            createdAt: serverTimestamp(),
            createdBy: user.uid
        };

        await addDoc(collection(db, "Posts"), postData);

        setContent('');
        setSelectedRooms([]);
        setFile(null);
        setPreviewUrl('');
        alert('โพสต์สำเร็จ!');
    };

    return (
        <>
            <Header />
            <Container className="py-5">
                <h1 className="mb-4">สร้างโพสต์ใหม่</h1>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>เนื้อหา</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="เขียนเนื้อหาโพสต์ของคุณที่นี่..."
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>เลือกห้องเรียน</Form.Label>
                        {classrooms.map((classroom) => (
                            <Form.Check
                                key={classroom.id}
                                type="checkbox"
                                label={classroom.ClassName}
                                checked={selectedRooms.includes(classroom.id)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedRooms([...selectedRooms, classroom.id]);
                                    } else {
                                        setSelectedRooms(selectedRooms.filter(id => id !== classroom.id));
                                    }
                                }}
                            />
                        ))}
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>แนบไฟล์ (ถ้ามี)</Form.Label>
                        <Form.Control
                            type="file"
                            onChange={handleFileChange}
                        />
                    </Form.Group>

                    {previewUrl && (
                        <Card className="mb-3">
                            <Card.Body>
                                <Image src={previewUrl} alt="Preview" fluid />
                            </Card.Body>
                        </Card>
                    )}

                    {file && !previewUrl && (
                        <Card className="mb-3">
                            <Card.Body>
                                <FaFile /> {file.name}
                            </Card.Body>
                        </Card>
                    )}

                    <Button variant="primary" type="submit">
                        โพสต์
                    </Button>
                </Form>
            </Container>
        </>
    );
}

export default ClassroomPost;