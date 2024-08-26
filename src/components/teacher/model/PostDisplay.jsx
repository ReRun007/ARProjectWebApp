import React, { useState, useEffect } from 'react';
import { Card, Badge, Modal, Button } from 'react-bootstrap';
import { FaUser, FaClock, FaPaperclip, FaImage, FaDownload } from 'react-icons/fa';
import { db, storage } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';

function PostDisplay({ posts }) {
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [usersData, setUsersData] = useState({});

    useEffect(() => {
        const fetchUsersData = async () => {
            const userData = {};
            for (const post of posts) {
                if (!userData[post.createdBy]) {
                    const userDoc = await getDoc(doc(db, 'Teachers', post.createdBy));
                    if (userDoc.exists()) {
                        const user = userDoc.data();
                        let profileImageUrl = null;
                        if (user.URLImage) {
                            try {
                                profileImageUrl = await getDownloadURL(ref(storage, user.URLImage));
                            } catch (error) {
                                console.error("Error fetching profile image:", error);
                            }
                        }
                        userData[post.createdBy] = {
                            username: user.Username,
                            firstName: user.FirstName,
                            lastName: user.LastName,
                            profileImage: profileImageUrl
                        };
                    }
                }
            }
            setUsersData(userData);
        };

        fetchUsersData();
    }, [posts]);

    const formatDate = (date) => {
        if (!date) return '';
        return date.toLocaleString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleMediaClick = (mediaUrl, mediaType) => {
        setSelectedMedia({ url: mediaUrl, type: mediaType });
        setShowMediaModal(true);
    };

    const renderFileAttachment = (post) => {
        if (!post.fileUrl) return null;

        const fileType = post.fileName ? post.fileName.split('.').pop().toLowerCase() : '';
        const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileType);
        const isVideo = ['mp4', 'webm', 'ogg'].includes(fileType);

        const mediaStyle = {
            maxWidth: '100%',
            maxHeight: '200px',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            cursor: 'pointer'
        };

        if (isImage) {
            return (
                <div className="mt-3">
                    <img
                        src={post.fileUrl}
                        alt="Attached"
                        style={mediaStyle}
                        onClick={() => handleMediaClick(post.fileUrl, 'image')}
                        className="rounded shadow-sm"
                    />
                </div>
            );
        } else if (isVideo) {
            return (
                <div className="mt-3">
                    <video
                        controls
                        style={mediaStyle}
                        className="rounded shadow-sm"
                        onClick={() => handleMediaClick(post.fileUrl, 'video')}
                    >
                        <source src={post.fileUrl} type={`video/${fileType}`} />
                        Your browser does not support the video tag.
                    </video>
                </div>
            );
        } else {
            return (
                <Button
                    variant="outline-primary"
                    size="sm"
                    href={post.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3"
                >
                    <FaDownload className="me-2" /> {post.fileName || 'ดาวน์โหลดไฟล์แนบ'}
                </Button>
            );
        }
    };

    return (
        <>
            {posts.length > 0 ? (
                posts.map((post) => (
                    <Card key={post.id} className="shadow-sm mb-4 border-0 overflow-hidden">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-3">
                                {usersData[post.createdBy]?.profileImage ? (
                                    <img
                                        src={usersData[post.createdBy].profileImage}
                                        alt="Profile"
                                        className="rounded-circle me-3"
                                        style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div className="bg-primary text-white rounded-circle p-2 me-3">
                                        <FaUser />
                                    </div>
                                )}
                                <div>
                                    <strong className="d-block">
                                        {usersData[post.createdBy]?.firstName} {usersData[post.createdBy]?.lastName} (@{usersData[post.createdBy]?.username || 'ไม่ระบุชื่อ'})
                                    </strong>
                                    <small className="text-muted">
                                        <FaClock className="me-1" />
                                        {formatDate(post.createdAt?.toDate())}
                                    </small>
                                </div>
                            </div>
                            <Card.Text className="mb-3">{post.content}</Card.Text>
                            {post.fileUrl && (
                                <Badge bg="light" text="dark" className="mb-3">
                                    <FaPaperclip className="me-1" /> ไฟล์แนบ
                                </Badge>
                            )}
                            {renderFileAttachment(post)}
                        </Card.Body>
                    </Card>
                ))
            ) : (
                <Card className="shadow-sm mb-4 border-0 text-center py-5">
                    <Card.Body>
                        <FaImage className="mb-3 text-muted" size={50} />
                        <Card.Title>ยังไม่มีโพสต์ในห้องเรียนนี้</Card.Title>
                        <Card.Text className="text-muted">เริ่มแบ่งปันความรู้และประกาศสำคัญกับนักเรียนของคุณ!</Card.Text>
                    </Card.Body>
                </Card>
            )}

            <Modal show={showMediaModal} onHide={() => setShowMediaModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>{selectedMedia?.type === 'image' ? 'รูปภาพเต็ม' : 'วิดีโอ'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center p-0">
                    {selectedMedia?.type === 'image' ? (
                        <img
                            src={selectedMedia.url}
                            alt="Enlarged"
                            style={{ maxWidth: '100%', maxHeight: '80vh', width: 'auto', height: 'auto' }}
                        />
                    ) : (
                        <video controls style={{ maxWidth: '100%', maxHeight: '80vh', width: 'auto', height: 'auto' }}>
                            <source src={selectedMedia?.url} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    )}
                </Modal.Body>
            </Modal>
        </>
    );
}

export default PostDisplay;